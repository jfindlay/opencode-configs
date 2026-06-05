# Test Style (index)

Per-language test styleguides. Load the file matching the target language; each test guide layers
on top of its same-language code guide.

| Language | Guide                  | Inherits                  |
|----------|------------------------|---------------------------|
| Python   | `STYLE-TEST-PYTHON.md` | `STYLE-CODE-PYTHON.md`    |
| Rust     | `STYLE-TEST-RUST.md`   | `STYLE-CODE-RUST.md`      |
| Go       | `STYLE-TEST-GO.md`     | `STYLE-CODE-GO.md`        |

When the target language is ambiguous (mixed repo, polyglot file), load every applicable guide.
