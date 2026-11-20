#!/usr/bin/env python3
"""Collect real, timestamped Google Trends RSS topics for Wordville.

This is country-specific *search interest*, not a social-meme leaderboard.
The output is published to the 'trend-data' branch to avoid an APK rebuild
on each scheduled data refresh. No API key or paid third-party service.
"""
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import json
import re
import sys
import time
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit, urlencode
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

SOURCE = "Google Trends · Trending Now (public RSS)"
COUNTRIES = {"US": "America/New_York", "GB": "Europe/London",
             "CA": "America/Toronto", "AU": "Australia/Sydney"}
FEED = "https://trends.google.com/trending/rss?geo={country}"
DISPLAY = "https://trends.google.com/trending?geo={country}"
NEWS_SEARCH = '"meme" OR "viral trend" OR "internet slang" when:2d'
MAX_NEWS_DAY = 12


def google_news_url(country: str) -> str:
    if country not in COUNTRIES:
        raise ValueError("Unsupported geography")
    return "https://news.google.com/rss/search?" + urlencode({
        "q": NEWS_SEARCH, "hl": "en-US", "gl": country, "ceid": country + ":en"
    })


def parse_news_feed(country: str, xml: bytes) -> list[dict[str, Any]]:
    """Google News search headlines about memes/viral topics, not popularity ranks."""
    if country not in COUNTRIES:
        raise ValueError("Unsupported geography")
    root = ET.fromstring(xml)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("Google News RSS channel missing")
    found, seen = [], set()
    for entry in channel.findall("item"):
        title = re.sub(r"\s+", " ", text_of(entry, "title"))[:MAX_TEXT].strip()
        link = safe_url(text_of(entry, "link"))
        date_string = text_of(entry, "pubDate")
        if not title or not link or not date_string:
            continue
        try:
            when = parsedate_to_datetime(date_string)
            if when.tzinfo is None:
                continue
            when = when.astimezone(timezone.utc)
        except (TypeError, ValueError, OverflowError):
            continue
        day = when.astimezone(ZoneInfo(COUNTRIES[country])).date().isoformat()
        key = (day, title.casefold())
        if key in seen:
            continue
        seen.add(key)
        found.append({
            "title": title,
            "url": link,
            "date": day,
            "publishedAt": when.isoformat().replace("+00:00", "Z"),
            "publisher": text_of(entry, "source")[:70],
            "source": "Google News search RSS",
        })
    return found

MAX_DAYS = 90
MAX_PER_DAY = 20
MAX_TEXT = 160


def safe_url(value: str) -> str:
    if not isinstance(value, str) or len(value) > 1600:
        return ""
    parsed = urlsplit(value)
    if parsed.scheme != "https" or not parsed.netloc or parsed.username or parsed.password:
        return ""
    return value


def text_of(el: ET.Element, name: str) -> str:
    # Works whether or not Google's optional ht namespace is present.
    child = el.find(name)
    if child is None:
        child = el.find("{*}" + name)
    return (child.text or "").strip() if child is not None else ""


def parse_feed(country: str, xml: bytes) -> list[dict[str, Any]]:
    if country not in COUNTRIES:
        raise ValueError("Unsupported geography")
    root = ET.fromstring(xml)
    channel = root.find("channel")
    if channel is None:
        raise ValueError("RSS channel missing")
    seen = set()
    results = []
    for item in channel.findall("item"):
        title = re.sub(r"\s+", " ", text_of(item, "title"))[:MAX_TEXT].strip()
        published = text_of(item, "pubDate")
        if not title or not published:
            continue
        try:
            dt = parsedate_to_datetime(published)
            if dt.tzinfo is None:
                continue
            dt = dt.astimezone(timezone.utc)
        except (TypeError, ValueError, OverflowError):
            continue
        local_date = dt.astimezone(ZoneInfo(COUNTRIES[country])).date().isoformat()
        key = (local_date, title.casefold())
        if key in seen:
            continue
        seen.add(key)
        traffic = text_of(item, "approx_traffic")[:40]
        news = []
        for story in item.findall("{*}news_item")[:2]:
            name = text_of(story, "news_item_title")[:MAX_TEXT]
            link = safe_url(text_of(story, "news_item_url"))
            publisher = text_of(story, "news_item_source")[:70]
            if name and link:
                news.append({"title": name, "url": link, "publisher": publisher})
        results.append({
            "title": title,
            "date": local_date,
            "publishedAt": dt.isoformat().replace("+00:00", "Z"),
            "approxTraffic": traffic,
            "sourceUrl": DISPLAY.format(country=country),
            "news": news,
        })
    return results


def download(url: str, *, timeout: int = 18) -> bytes:
    request = Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; WordvilleTrends/1.0; public RSS)",
        "Accept": "application/rss+xml, application/xml, text/xml, application/json;q=0.8",
    })
    with urlopen(request, timeout=timeout) as response:
        return response.read(2_500_000)


def read_archive(url: str) -> dict[str, Any]:
    try:
        loaded = json.loads(download(url))
        if isinstance(loaded, dict) and loaded.get("schema") == 1 and isinstance(loaded.get("countries"), dict):
            return loaded
    except (HTTPError, URLError, TimeoutError, ValueError, OSError):
        pass
    return {"schema": 1, "source": SOURCE, "countries": {}, "countryUpdatedAt": {}}


def merge(
    old: dict[str, Any],
    updates: dict[str, list[dict[str, Any]]],
    collected_at: datetime,
    news_updates: dict[str, list[dict[str, Any]]] | None = None,
) -> dict[str, Any]:
    """Merge without inventing dates, preserve earlier snapshots and bound size."""
    result = {
        "schema": 1,
        "source": SOURCE,
        "updatedAt": collected_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
        "countryUpdatedAt": dict(old.get("countryUpdatedAt") or {}),
        "countries": {},
        "memeNews": {},
    }
    min_date = (collected_at.date() - timedelta(days=MAX_DAYS)).isoformat()
    max_date = (collected_at.date() + timedelta(days=2)).isoformat()
    for country in COUNTRIES:
        dates = old.get("countries", {}).get(country) or {}
        if not isinstance(dates, dict):
            dates = {}
        cleaned = {day: list(rows) for day, rows in dates.items()
                   if isinstance(day, str) and min_date <= day <= max_date and isinstance(rows, list)}
        new_rows = updates.get(country, [])
        for item in new_rows:
            day = item["date"]
            if min_date <= day <= max_date:
                cleaned.setdefault(day, []).insert(0, item)
        for day in list(cleaned):
            unique: dict[str, dict[str, Any]] = {}
            for row in cleaned[day]:
                if not isinstance(row, dict):
                    continue
                title = str(row.get("title", "")).strip()
                iso = str(row.get("publishedAt", ""))
                if title and iso and row.get("date") == day:
                    key = title.casefold()
                    if key not in unique or iso > str(unique[key].get("publishedAt", "")):
                        unique[key] = row
            ranked = sorted(unique.values(), key=lambda entry: entry["publishedAt"], reverse=True)
            cleaned[day] = ranked[:MAX_PER_DAY]
            if not cleaned[day]:
                del cleaned[day]
        result["countries"][country] = dict(sorted(cleaned.items(), reverse=True))
        if new_rows:
            result["countryUpdatedAt"][country] = result["updatedAt"]
        old_news = old.get("memeNews", {}).get(country) or {}
        if not isinstance(old_news, dict):
            old_news = {}
        cleaned_news = {day: list(rows) for day, rows in old_news.items()
                        if isinstance(day, str) and min_date <= day <= max_date and isinstance(rows, list)}
        for item in (news_updates or {}).get(country, []):
            if min_date <= item.get("date", "") <= max_date:
                cleaned_news.setdefault(item["date"], []).insert(0, item)
        for day in list(cleaned_news):
            news_unique = {}
            for item in cleaned_news[day]:
                if not isinstance(item, dict):
                    continue
                title = str(item.get("title", "")).strip()
                when = str(item.get("publishedAt", ""))
                if title and item.get("date") == day and safe_url(item.get("url", "")) and when:
                    key = title.casefold()
                    if key not in news_unique or when > str(news_unique[key].get("publishedAt", "")):
                        news_unique[key] = item
            cleaned_news[day] = sorted(news_unique.values(),
                key=lambda row: row["publishedAt"], reverse=True)[:MAX_NEWS_DAY]
            if not cleaned_news[day]:
                del cleaned_news[day]
        result["memeNews"][country] = dict(sorted(cleaned_news.items(), reverse=True))
    return result


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", required=True)
    parser.add_argument("--previous-url", default="")
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    previous = read_archive(args.previous_url) if args.previous_url else read_archive("")
    updates = {}
    for country in COUNTRIES:
        feed_url = FEED.format(country=country)
        for attempt in range(3):
            try:
                rows = parse_feed(country, download(feed_url))
                if not rows:
                    raise ValueError("No valid RSS records")
                updates[country] = rows
                print(f"{country}: {len(rows)} verified RSS topics", file=sys.stderr)
                break
            except (HTTPError, URLError, TimeoutError, ValueError, ET.ParseError, OSError) as exc:
                print(f"{country} attempt {attempt + 1}: {exc}", file=sys.stderr)
                if attempt < 2:
                    time.sleep(attempt + 1)
    if not updates:
        print("No country feeds available; refusing to publish an unverified update.", file=sys.stderr)
        return 1
    news_updates = {}
    for country in COUNTRIES:
        try:
            stories = parse_news_feed(country, download(google_news_url(country)))
            if stories:
                news_updates[country] = stories
            print(f"{country}: {len(stories)} Google News meme/viral articles", file=sys.stderr)
        except (HTTPError, URLError, TimeoutError, ValueError, ET.ParseError, OSError) as exc:
            print(f"{country}: meme news unavailable: {exc}", file=sys.stderr)
    final = merge(previous, updates, now, news_updates)
    with open(args.output, "w", encoding="utf-8") as output:
        json.dump(final, output, ensure_ascii=False, separators=(",", ":"))
        output.write("\n")
    print(f"Published countries: {', '.join(sorted(updates))}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
