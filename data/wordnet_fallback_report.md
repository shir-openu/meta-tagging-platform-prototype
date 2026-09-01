# WordNet 3.0 fallback measurement

- Picker coverage: **1859/14767 terms**.
- Historical assigned-gap coverage: **75/415 terms**; **340** remain uncovered.
- Current all-corpus layer: **719** terms with exactly one corpus definition newly reach two source-separated definitions; **2730** picker terms have at least two after opt-in.
- Current public rights-cleared layer: **511** terms with exactly one displayed corpus definition newly reach two source-separated definitions; **1702** picker terms have at least two after opt-in.
- Static JSON payload: **878,604 bytes**, containing **6158** WordNet synsets.

WordNet is counted as one independent provider per term for the two-definition threshold. Every matched synset is retained and displayed, but multiple dictionary senses are not misrepresented as multiple independent sources. External definitions remain separate, opt-in, default off, and never alter corpus sense counts or scoreability.
