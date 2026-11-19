"""Build Wordville's part-of-speech index from Princeton WordNet 3.1."""
import argparse
from collections import defaultdict
import json
from pathlib import Path

ASSETS = Path(__file__).resolve().parents[1] / 'app/src/main/assets'
CATEGORIES = {'noun': 'n', 'verb': 'v', 'adj': 'a', 'adv': 'r'}

# Entries absent from the WordNet indexes, classified by the sense in words.json.
EXTRA = {
    'n': '''
        criteria self-motivation alumni fund-raising memoirs must-see affordability
        window-shopping drycleaner refreshments valuables goods figures whereabout
        time-off flextime roadwork ridership midtown courteousness remodeling
        repairperson housewares reconfiguration toxication palpitations coworker
    ''',
    'v': 'reapply telecommute overbook repave carpool',
    'a': '''
        overqualified pulled double-sided proposed owed nice-looking up-and-down
        family-run multi-regional refundable high-end allowed updated well-prepared
        bewildering top-of-the-line precautious priced predicted unmet in-flight
        annotated acclaimed itemized perishing compensatory themed decaffeinated
        estimated indicated pretax overstaffed condensed presiding off-peak
        recommendable tech-savvy inter-department designated fuel-efficient
        overdrawn secured repairable home-improvement space-saving shockproof
        clearable eco-friendly big-name
    ''',
    'r': '''
        neutrally intriguingly preventively fleetingly unlimitedly
        substantively incrementally delinquently expectedly disparately numerously
    ''',
    'p': 'concerning including regarding excluding',
}


def build(dictionary):
    entries = defaultdict(list)
    for filename, code in CATEGORIES.items():
        with (dictionary / f'index.{filename}').open(encoding='utf-8') as source:
            for line in source:
                if line.strip() and not line.startswith(' '):
                    entries[line.split()[0].replace('_', ' ')].append(code)

    extra = {term: code for code, terms in EXTRA.items() for term in terms.split()}
    words = json.loads((ASSETS / 'words.json').read_text(encoding='utf-8'))
    index = {}
    for word in words:
        term = word['word']
        codes = ''.join(entries.get(term.lower(), ())) or extra.get(term.lower())
        if codes:
            index[term] = codes
    return dict(sorted(index.items()))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('dictionary', type=Path, help='WordNet 3.1 dict directory')
    index = build(parser.parse_args().dictionary)
    (ASSETS / 'word-pos-index.json').write_text(
        json.dumps(index, ensure_ascii=False, separators=(',', ':')) + '\n',
        encoding='utf-8',
    )
