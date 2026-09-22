# Code Style (index)

Per-language code styleguides. Load the file matching the target language; the language-agnostic
register rules live in `STYLE-DOC.md` and AGENTS.md `## Code conventions`.

| Language | Guide                  |
|----------|------------------------|
| Python   | `STYLE-CODE-PYTHON.md` |
| Rust     | `STYLE-CODE-RUST.md`   |
| Go       | `STYLE-CODE-GO.md`     |

When the target language is ambiguous (mixed repo, polyglot file), load every applicable guide.

## Configuration precedence

The prioritization of configuration or data should be conventional but is enumerated explicitly
anyway.  In order of decreasing priority:

1. Command line
2. Environment variables (Discouraged: environment is passive and side effective because there is no
   causal covariance between app use and its data)
3. Config file
4. Programatic defaults
