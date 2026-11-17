"""Build the offline usage index from local, pinned English UD treebanks."""
import argparse
from collections import Counter, defaultdict
import json
from pathlib import Path
import re
import unicodedata

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'app/src/main/assets'
GENRES = {
    'gum': {
        'academic': 'academic', 'textbook': 'academic', 'bio': 'reference',
        'essay': 'reference', 'whow': 'guide', 'voyage': 'guide', 'court': 'legal',
        'letter': 'email', 'news': 'news', 'fiction': 'fiction',
        'conversation': 'conversation', 'interview': 'conversation',
        'podcast': 'conversation', 'speech': 'conversation', 'vlog': 'conversation',
    },
    'ewt': {
        'email': 'email', 'answers': 'forum', 'newsgroup': 'forum',
        'reviews': 'review', 'weblog': 'blog',
    },
}
# The same folding is applied to vocabulary terms, token forms, and lemmas.
TOKEN = re.compile(r"[a-z0-9]+(?:'[a-z]+)?")
NORMALIZE_APOSTROPHE = str.maketrans({'’': "'", '‘': "'"})
PREFIX = {'gum': re.compile(r'GUM_([^_]+)_'), 'ewt': re.compile(r'([^-]+)-')}


def tokenize(text):
    text = unicodedata.normalize('NFKD', text.lower().translate(NORMALIZE_APOSTROPHE))
    return TOKEN.findall(''.join(char for char in text if not unicodedata.combining(char)))


def read_sentences(directory, family):
    files = sorted(directory.glob('*.conllu'))
    if not files:
        raise ValueError(f'No CoNLL-U files in {directory}')
    for path in files:
        genre = None
        sentence = []
        with path.open(encoding='utf-8') as source:
            for line in source:
                if line.startswith('# newdoc id = '):
                    match = PREFIX[family].match(line.split(' = ', 1)[1])
                    genre = GENRES[family].get(match[1]) if match else None
                if line.startswith('#'):
                    continue
                if not line.strip():
                    if genre and sentence:
                        yield genre, sentence
                    sentence = []
                    continue
                fields = line.rstrip('\n').split('\t')
                index, original, lemma, pos = fields[:4]
                if not index.isdecimal():
                    continue
                forms = tokenize(original)
                if not forms:
                    sentence.append(('', '', pos))
                    continue
                lemmas = tokenize(lemma)
                for offset, form in enumerate(forms):
                    base = lemmas[offset] if len(lemmas) == len(forms) else form
                    sentence.append((form, base, pos))
            if genre and sentence:
                yield genre, sentence


def index_words(ewt, gum):
    entries = json.loads((ASSETS / 'words.json').read_text(encoding='utf-8'))
    singles = {}
    phrases = defaultdict(dict)
    for entry in entries:
        key = entry['word']
        tokens = tuple(tokenize(key))
        if len(tokens) == 1:
            singles.setdefault(tokens[0], []).append(key)
        elif tokens:
            phrases[tokens[0]].setdefault(tokens, []).append(key)

    sizes = Counter()
    counts = defaultdict(Counter)
    for family, directory in [('ewt', ewt), ('gum', gum)]:
        for genre, sentence in read_sentences(directory, family):
            forms = [item[0] for item in sentence]
            sizes[genre] += sum(bool(form) for form in forms)
            for i, (form, lemma, pos) in enumerate(sentence):
                if not form or pos == 'PROPN':
                    continue
                for key in set(singles.get(form, ())) | set(singles.get(lemma, ())):
                    counts[key][genre] += 1
                for phrase, keys in phrases.get(form, {}).items():
                    if tuple(forms[i:i + len(phrase)]) == phrase:
                        for key in keys:
                            counts[key][genre] += 1

    genres = sorted(sizes)
    data = {}
    for term, by_genre in sorted(counts.items()):
        paired = [[genres.index(genre), count] for genre, count in sorted(by_genre.items())]
        data[term] = paired
    return {'genres': genres, 'sizes': [sizes[genre] for genre in genres], 'terms': data}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ewt', type=Path, required=True)
    parser.add_argument('--gum', type=Path, required=True)
    args = parser.parse_args()
    data = index_words(args.ewt, args.gum)
    (ASSETS / 'word-usage-index.json').write_text(
        json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8'
    )
    print(f"{len(data['terms'])} indexed terms, {sum(data['sizes']):,} corpus tokens")
