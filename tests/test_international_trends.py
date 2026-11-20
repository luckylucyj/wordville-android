import importlib.util
from datetime import datetime, timezone
from pathlib import Path
import unittest

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "update-international-trends.py"
spec = importlib.util.spec_from_file_location("wordville_trends", SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

RSS = b"""<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:ht="https://trends.google.com/trending/rss">
 <channel>
  <title>Daily Search Trends</title>
  <item><title>sample search topic</title><pubDate>Fri, 20 Nov 2026 09:30:00 -0500</pubDate>
   <ht:approx_traffic>20K+</ht:approx_traffic>
   <ht:news_item>
    <ht:news_item_title>Sample headline</ht:news_item_title>
    <ht:news_item_url>https://news.example.org/story</ht:news_item_url>
    <ht:news_item_source>Example News</ht:news_item_source>
   </ht:news_item>
  </item>
  <item><title>sample search topic</title><pubDate>Fri, 20 Nov 2026 09:30:00 -0500</pubDate></item>
  <item><title>another topic</title><pubDate>Fri, 20 Nov 2026 12:00:00 -0500</pubDate></item>
 </channel>
</rss>"""


class InternationalTrendsTest(unittest.TestCase):
    def test_rss_deduplicates_and_preserves_sources(self):
        records = module.parse_feed("US", RSS)
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]["title"], "sample search topic")
        self.assertEqual(records[0]["date"], "2026-11-20")
        self.assertEqual(records[0]["approxTraffic"], "20K+")
        self.assertEqual(records[0]["news"][0]["url"], "https://news.example.org/story")
        self.assertEqual(records[0]["sourceUrl"], "https://trends.google.com/trending?geo=US")

    def test_archive_retains_valid_dates_and_never_fills_missing_dates(self):
        now = datetime(2026, 11, 20, 18, 0, tzinfo=timezone.utc)
        records = module.parse_feed("US", RSS)
        archive = module.merge({"countries": {"US": {"2026-09-01": [{**records[0], "date": "2026-09-01", "publishedAt": "2026-09-01T14:30:00Z"}]}}},
                               {"US": records}, now)
        self.assertEqual(len(archive["countries"]["US"]["2026-11-20"]), 2)
        self.assertNotIn("2026-11-19", archive["countries"]["US"])
        self.assertIn("2026-09-01", archive["countries"]["US"])
        second = module.merge(archive, {"US": records}, now)
        self.assertEqual(len(second["countries"]["US"]["2026-11-20"]), 2)

    def test_invalid_urls_and_bad_pubdates_cannot_enter_archive(self):
        self.assertFalse(module.safe_url("javascript:alert(1)"))
        self.assertFalse(module.safe_url("http://news.example.org"))
        self.assertFalse(module.safe_url("https://name:password@example.org"))
        broken = RSS.replace(b"Fri, 20 Nov 2026 09:30:00 -0500", b"not-a-date")
        self.assertEqual(module.parse_feed("GB", broken)[0]["title"], "another topic")


if __name__ == "__main__":
    unittest.main()
