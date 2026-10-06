# WordNet 3.0 fallback measurement

- **Generated:** 2026-10-06T11:46:27+00:00
- **Input:** `DATA/corpus.json`, `PLATFORM/data/concepts.json`, WordNet 3.0 archive
- **Input hash:** `SHA256 4eae9d93aa6348a4feb204fd9c0e141461d6b479bec61f71ac3f5e39ab6ab875`
- **Denominator:** 22,920 picker concepts against 1,698 of the 1,714 corpus records (the 16 this project withholds from every public surface are not counted)

- Picker coverage: **2624/22920 terms**.
- Historical assigned-gap coverage: **75/415 terms**; **340** remain uncovered.
- Current all-corpus layer: **1198** terms with exactly one corpus definition newly reach two source-separated definitions; **5424** picker terms have at least two after opt-in.
- Current public rights-cleared layer: **1115** terms with exactly one displayed corpus definition newly reach two source-separated definitions; **4415** picker terms have at least two after opt-in.
- Static JSON payload: **1,178,317 bytes**, containing **8354** WordNet synsets.

WordNet is counted as one independent provider per term for the two-definition threshold. Every matched synset is retained and displayed, but multiple dictionary senses are not misrepresented as multiple independent sources. External definitions remain separate, opt-in, default off, and never alter corpus sense counts or scoreability.
