<p align="center">
  <h1 align="center">LLM Markdown WhatsApp</h1>
  <p align="center">
    A TypeScript library that splits LLM-generated markdown into WhatsApp-friendly chat message chunks.
  </p>
</p>

<div align="center">

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](https://opensource.org/licenses/MIT)

</div>

<p align="center">
  <a href="#the-problem">Problem</a> •
  <a href="#quickstart">Quickstart</a> •
  <a href="#features">Features</a> •
  <a href="#splitting-rules">Splitting Rules</a> •
  <a href="#api-reference">API Reference</a>
</p>

---

## The Problem

LLMs generate long, structured markdown responses—paragraphs, numbered lists, product cards, nested bullet points. Sending these as a single WhatsApp message creates a wall of text that users won't read.

Naively splitting at character limits breaks mid-sentence, mid-list, or mid-URL. Splitting at every period creates fragmented messages that feel robotic. Neither approach understands the structure of the content.

Additionally:

- **URLs, emails, and numbers contain periods.** Splitting at `Nike.com.co` or `$1.000.000` or `juan.perez@gmail.com` produces broken fragments.
- **Lists should stay together.** A numbered list of products or a bullet list of options is a single logical unit—splitting inside an item destroys readability.
- **Questions need context.** A short trailing question like "¿Te interesa?" should stay attached to the preceding sentence, not become its own tiny message.

This library handles all of this. One function call, zero configuration. Pass in the LLM's markdown output, get back an array of WhatsApp-ready message chunks.

## How It Works

The library takes a markdown string and splits it into an array of smaller chunks optimized for chat readability. It applies a priority-ordered chain of processors:

1. Pre-processes text (normalizes inline lists, removes periods after URLs)
2. Tries structural splits first (intro + list, product cards, markdown sections, double newlines)
3. Falls back to semantic splits (question marks, periods) with intelligent protection
4. Merges chunks that are too small (<20 chars) with their neighbors
5. Normalizes Spanish punctuation (¿/¡ capitalization rules)

## Features

| Feature                       | Description                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------ |
| **Smart Question Splitting**  | Splits at question marks while keeping contiguous questions together            |
| **List Preservation**         | Keeps numbered and bullet lists intact, splits only when items are very long    |
| **Product Card Detection**    | Recognizes product card patterns (with emojis or markdown) and splits per card  |
| **URL/Email/Number Safety**   | Never splits inside URLs, emails, domain names, or formatted numbers           |
| **Parentheses Protection**    | Avoids splitting inside parenthetical expressions                              |
| **Abbreviation Awareness**    | Protects periods in `etc.`, `Dr.`, `D.C.`, `S.A.`, version numbers            |
| **Spanish Punctuation**       | Normalizes capitalization after mid-sentence ¿ and ¡ marks                     |
| **Small Chunk Merging**       | Prevents tiny fragments by merging small chunks with adjacent ones             |
| **Markdown Section Support**  | Splits at markdown headers (`*Title*` or `_Title_`) as natural boundaries      |
| **Zero Configuration**        | Single function, no setup required—just pass text, get chunks                  |

## Quickstart

```bash
npm install @daviddh/llm-markdown-whatsapp
```

### Basic Usage

```typescript
import { splitChatText } from '@daviddh/llm-markdown-whatsapp';

const llmResponse = 'Thanks for reaching out. I understand your situation and I want to help you resolve it in the best way possible. You can send your product back at no extra cost. Would you prefer a full refund or an exchange for a different model?';

const chunks = splitChatText(llmResponse);
console.log(chunks);
// [
//   'Thanks for reaching out.',
//   'I understand your situation and I want to help you resolve it in the best way possible.',
//   'You can send your product back at no extra cost.',
//   'Would you prefer a full refund or an exchange for a different model?',
// ]
```

### Lists Stay Together

```typescript
const llmResponse = `I found these options:

- Nike Pegasus Plus – High-performance running shoes for marathons and daily runs, featuring ZoomX Foam cushioning and a Flyknit upper that adapts to your foot. Available in black and a multicolor combination.
- Nike Air Max 90 – Classic model with a waffle sole and the iconic visible Air cushioning, in neutral tones like light bone/olive/university grey.
Which of these models interests you the most? 😊`;

const chunks = splitChatText(llmResponse);
// [
//   'I found these options:',
//   '- Nike Pegasus Plus – High-performance running shoes for marathons...',
//   '- Nike Air Max 90 – Classic model with a waffle sole...',
//   'Which of these models interests you the most? 😊',
// ]
```

### Product Cards Split Per Card

```typescript
const llmResponse = `I found these options:

1. 🛍️  Pegasus Plus Shoes: 💵 $1.015.000
📏 Color: Black, Glacier Blue/Mint Foam/Impact Green/Black.
📏 Shoe Size: 43, 41, 38.
✅ Ultra-lightweight, with ZoomX cushioning and great breathability.

2. 🛍️  ISPA Sense Shoes: 💵 $804.900
📏 Shoe Size: 38, 39, 40, 41, 42, 43.
✅ Casual style with great comfort for daily use.

Which of these products do you like?`;

const chunks = splitChatText(llmResponse);
// [
//   'I found these options:',
//   '🛍️  Pegasus Plus Shoes: 💵 $1.015.000\n📏 Color: ...\n✅ Ultra-lightweight...',
//   '🛍️  ISPA Sense Shoes: 💵 $804.900\n📏 Shoe Size: ...\n✅ Casual style...',
//   'Which of these products do you like?',
// ]
```

---

## Splitting Rules

The library applies processors in priority order. The first processor that finds a valid split point wins, and the remaining text is re-evaluated from the top.

### Structural Splits (highest priority)

| Pattern                    | Behavior                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **Intro + List**           | Text ending with `:` followed by a numbered/bullet list splits after the intro       |
| **Question + Numbered List** | Short question followed by numbered options stays together as one chunk             |
| **Product Cards**          | Numbered items with `🛍️` or `*Title*` formatting split into one chunk per card       |
| **List Sections**          | Numbered/bullet lists kept as one chunk; split per-item only when items are >150 chars |
| **Markdown Sections**      | `*Header*` or `_Header_` with content splits at section boundaries                   |
| **Section Breaks**         | Double newlines (`\n\n`) act as natural split points                                 |

### Semantic Splits (fallback)

| Pattern                    | Behavior                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **Question Marks**         | Splits after `?` unless followed by lowercase (sentence continuation) or emoji       |
| **Contiguous Questions**   | Multiple questions without periods between them stay together                        |
| **Period Splits**          | Splits at `.` for text >100 chars, skipping protected positions                      |

### Protected Content (never split inside)

| Content                    | Examples                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------ |
| **URLs**                   | `https://example.com/path`, `www.site.com`                                           |
| **Plain Domains**          | `Nike.com.co`, `shop.example.co.uk`                                                  |
| **Emails**                 | `john.perez@gmail.com`                                                               |
| **Formatted Numbers**      | `$1.000.000`, `2.5.1`, `15.5`                                                       |
| **Abbreviations**          | `etc.`, `Dr.`, `D.C.`, `S.A.`, `E.U.A.`                                             |
| **Parenthetical Expressions** | `(street, number, ref, etc.)`                                               |
| **Bullet Point Content**   | Content within `- item` or `• item` lines                                            |

### Post-processing

- **Small Chunk Merging:** Chunks under 20 characters merge with the next chunk (or previous, if last).
- **Spanish Punctuation:** After mid-sentence `¿` or `¡` (not at start or after `.`/`!`/`?`), the following letter is lowercased. Example: `ayudarte ¿Cómo estás?` becomes `ayudarte ¿cómo estás?`.

---

## API Reference

### `splitChatText(text)`

```typescript
function splitChatText(text: string | null | undefined): string[]
```

Splits a markdown text string into an array of chat-ready chunks.

- **Input:** A string of markdown text (typically an LLM response). Accepts `null` or `undefined` safely.
- **Output:** An array of strings, each suitable for sending as an individual WhatsApp message.
- Returns `[]` for `null`, `undefined`, or empty string.

```typescript
import { splitChatText } from '@daviddh/llm-markdown-whatsapp';

const chunks = splitChatText(llmMarkdownText);
```

## Project Structure

```
llm-markdown-whatsapp/
├── packages/
│   └── core/                    # Core splitting library
│       └── src/
│           ├── index.ts         # Public API — exports splitChatText
│           └── chatSplit/
│               ├── splitChatText.ts          # Main orchestrator
│               ├── splitProcessors.ts        # Intro + list processors
│               ├── productCardProcessor.ts   # Product card detection and splitting
│               ├── listProcessor.ts          # Numbered/bullet list processing
│               ├── paragraphProcessor.ts     # Long paragraph and markdown sections
│               ├── breakProcessor.ts         # Double newline section breaks
│               ├── questionProcessor.ts      # Question mark splitting logic
│               ├── periodProcessor.ts        # Period splitting with protected ranges
│               ├── mergeProcessor.ts         # Small chunk merging
│               ├── sections.ts              # Markdown/list section detection
│               ├── textHelpers.ts           # Smart trim, emoji detection, text utilities
│               ├── positionHelpers.ts       # Parentheses/bullet position checks
│               ├── listNormalization.ts     # Inline list normalization
│               ├── urlNormalization.ts       # URL period removal
│               ├── punctuationNormalization.ts  # Spanish ¿/¡ capitalization
│               ├── constants.ts             # Threshold constants
│               └── splitConstants.ts        # Split-specific constants
└── README.md
```



## Architecture

```mermaid
flowchart TB
    subgraph Input["Input"]
        T["LLM markdown text"]
    end

    Input --> Pre

    subgraph Pre["Pre-processing"]
        direction LR
        A["Normalize<br/>inline lists"]
        B["Normalize<br/>product cards"]
        C["Remove periods<br/>after URLs"]
    end

    Pre --> Processors

    subgraph Processors["Processor Chain (priority order)"]
        direction TB
        P1["Intro + List<br/>Question + List<br/>Intro + Long Paragraphs"]
        P2["Product Cards<br/>List Sections<br/>Long Paragraphs"]
        P3["Markdown Sections<br/>Section Breaks (double newlines)"]
        P4["Question Marks<br/>Period Splits"]
    end

    Processors --> Post

    subgraph Post["Post-processing"]
        direction LR
        D["Merge small<br/>chunks"]
        E["Normalize Spanish<br/>punctuation"]
    end

    Post --> Output

    subgraph Output["Output"]
        O["string[ ] — array of chat-ready chunks"]
    end
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Ensure types check (`npm run typecheck`)
6. Commit with a clear message
7. Open a Pull Request

## Development

```bash
git clone <repository-url>
cd llm-markdown-whatsapp
npm install

npm run build          # Build all packages
npm test               # Run tests
npm run typecheck      # Type check
npm run lint           # Lint
npm run check          # Format + lint + typecheck
```

## License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with TypeScript • Zero Dependencies • WhatsApp-Optimized Chat Splitting
</p>
