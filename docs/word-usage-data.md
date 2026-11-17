# Word card usage data

The bundled index counts how often the vocabulary headwords occur in the genre-tagged English corpora below. Single words match the surface spelling or annotated base form. Phrases match consecutive surface tokens. Bare proper-name tokens are skipped. The card ranks up to three genres by density and shows raw counts. A count can combine multiple meanings.

- [Universal Dependencies English EWT](https://universaldependencies.org/treebanks/en_ewt/) by the English EWT contributors, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/), revision `491be069d36e378f67c29f183699eea88308ea42`.
- [Universal Dependencies English GUM](https://universaldependencies.org/treebanks/en_gum/) by Siyao Peng, Amir Zeldes and the GUM contributors, [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), revision `8e168382a25686ca6253deb7c4ef839494ddb154`.

The derived index contains aggregate counts only. Corpus sentences and annotations are available from their sources under their respective licenses. Build the index with the checked-out repositories.

```sh
python3 scripts/build-word-usage.py --ewt /path/to/UD_English-EWT --gum /path/to/UD_English-GUM
```
