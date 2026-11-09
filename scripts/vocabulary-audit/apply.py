"""Apply reviewed edits without regenerating stable vocabulary identifiers.

Input is the checked-in pre-audit export, not an OCR result. Never infer missing
letters or Korean senses in this script; those changes require an explicit edit.
"""
import copy
import json
import pathlib
import re
import unicodedata

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parents[1]

def load(path):
    return json.loads(path.read_text())

def senses(text):
    result, part, depth = [], '', 0
    text = unicodedata.normalize('NFKC', text).strip().rstrip('.')
    text = re.sub(r'[•■□]', '·', text)
    text = re.sub(r'^·', '', text)
    for char in text:
        if char == '(':
            depth += 1
        elif char == ')':
            depth -= 1
        if char in ',;.' and depth == 0:
            result.append(part.strip()); part = ''
        else:
            part += '·' if char == '.' else char
    result.append(part.strip())
    return [re.sub(r'\s+', ' ', s).strip(' ;,') for s in result if s.strip(' ;,')]

def sense_key(text):
    # Spacing and generic object markers do not create a second meaning.
    return re.sub(r'[\s·~]', '', re.sub(r'^~\s*[을를이가에와과의]?\s*', '', text))

def unique_senses(items):
    out, keys = [], set()
    for s in items:
        key = sense_key(s)
        if key not in keys:
            keys.add(key); out.append(s)
    return out

def apply(baseline):
    corrections = load(HERE / 'corrections.json')
    renames = load(HERE / 'renames.json')
    groups, order = {}, []
    for old in baseline:
        w = copy.deepcopy(old)
        w['word'] = renames.get(old['word'], old['word'])
        w['meanings'] = senses(corrections.get(old['word'], old['meaning']))
        key = w['word'].casefold()
        if key not in groups:
            groups[key] = []; order.append(key)
        groups[key].append(w)
    out = []
    for key in order:
        group = groups[key]
        # Keep the real existing spelling's ID, and retain all merged IDs.
        primary = next((w for w in group if any(b['id'] == w['id'] and b['word'].casefold() == key for b in baseline)), group[0])
        w = copy.deepcopy(primary)
        aliases = list(dict.fromkeys(a for g in group for a in [g['id'], *g.get('aliases', [])] if a != w['id']))
        if aliases:
            w['aliases'] = aliases
        for field in ['days', 'pdfPages', 'sourceTypes']:
            w[field] = sorted(set(v for g in group for v in g[field]))
        w['meanings'] = unique_senses([s for g in group for s in g['meanings']])
        w['meaning'] = '; '.join(w['meanings'])
        out.append(w)
    fair = next(w for w in out if w['word'] == 'fair')
    fair['pdfPages'].remove(164)
    fair['sourceTypes'] = ['관련어', '완성']
    # Day 9 also contains the genuine fair on page 166, so keep that Day.
    out.append(dict(id='voca-fall', word='fall', meanings=['(값·가치가) 하락하다', '하락', '낙하'], meaning='(값·가치가) 하락하다; 하락; 낙하', days=[9], pdfPages=[164], sourceTypes=['핵심']))
    return out

if __name__ == '__main__':
    import sys
    baseline = load(pathlib.Path(sys.argv[1]))
    output = apply(baseline)
    (ROOT / 'app/src/main/assets/words.json').write_text(json.dumps(output, ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'{len(baseline)} -> {len(output)} cards; aliases retained')
