# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript monorepo that splits LLM-generated markdown text into WhatsApp-friendly chat message chunks. The core algorithm intelligently breaks long text at natural boundaries (questions, periods, lists, markdown sections) while preserving URLs, numbers, emails, abbreviations, parenthetical expressions, and Spanish punctuation.

The primary use case is Latin American e-commerce customer service over WhatsApp, where LLMs generate long Spanish responses about products (Nike shoes, clothing, etc.) that need to be split into readable chat messages.

## Commands

```bash
npm install                  # Install all workspace dependencies
npm run build                # Build all packages
npm run build:core           # Build core package only
npm test                     # Run all tests
npm run test:core            # Run core tests only
npm run typecheck            # Type check all packages (tsc -b)
npm run lint                 # ESLint
npm run format               # Prettier
npm run check                # Format + lint + typecheck

# Run a single test file
cd packages/core && NODE_OPTIONS='--experimental-vm-modules' npx jest --testPathPattern="splitChatText"

# Watch mode for core tests
cd packages/core && NODE_OPTIONS='--experimental-vm-modules' npx jest --watch
```

Note: `NODE_OPTIONS='--experimental-vm-modules'` is required because the project uses ESM modules with ts-jest.

## Architecture

**Monorepo structure:** npm workspaces with `packages/*`. Currently only `packages/core` (`@llm-markdown-whatsapp/core`) exists. The root `tsconfig.json` references additional packages (redis, e2e/*) that are not yet present.

**Core package entry point:** `packages/core/src/index.ts` re-exports `splitChatText` from `packages/core/src/chatSplit/index.ts`, which re-exports from `splitChatText.ts`. This is the single public API function.

### splitChatText Pipeline

`splitChatText(text)` in `packages/core/src/chatSplit/splitChatText.ts` is the orchestrator. It accepts `string | null | undefined` and returns `string[]`.

**1. Pre-processing** (`preProcessText`):
- `removePeriodsAfterURLs` (`urlNormalization.ts`): Replaces `.` after URLs with `\n` (URLs never end with periods)
- `normalizeInlineNumberedList` (`listNormalization.ts`): Detects inline patterns like `1. X 2. Y 3. Z` and adds line breaks between items. Skips already-formatted lists. Handles both colon-preceding and question-preceding patterns.
- `normalizeInlineProductCardList` (`listNormalization.ts`): Detects inline product cards (with `🛍️` or markdown formatting + emoji indicators) and adds line breaks before each card, before emoji indicators within cards, and before trailing questions.

**2. Main loop** — iterates while `remainingText !== ''`, trying processors in priority order. First match wins, remaining text is re-evaluated from the top.

Processor groups (in `splitChatText.ts`):

- **`runIntroAndListProcessors`** (highest priority):
  - `processIntroWithList` (`splitProcessors.ts`): Matches `intro:` + newline + list start (`\d. ` or `- `). If intro < 150 chars, splits after intro. Handles "Puedes responder con:" pattern specially.
  - `processQuestionWithList` (`splitProcessors.ts`): Matches `question?\n` + numbered list. Keeps together as one chunk if total < 250 chars and >= 2 list items.
  - `processIntroWithLongParagraphs` (`splitProcessors.ts`): Matches `intro:\n` + paragraph > 150 chars. Splits after intro.

- **`runContentStructureProcessors`**:
  - `processProductCardLists` (`productCardProcessor.ts`): Detects product cards by emoji pattern (`\d. 🛍️`) or markdown pattern (`\d. *Title*` + emoji indicators). Extracts intro, splits each card into its own chunk (removing the `\d.` prefix), and separates trailing questions from the last card via `extractTrailingQuestion`.
  - `processListSection` (`listProcessor.ts`): Uses `findListSection` (`sections.ts`) to detect numbered or bullet lists. Splits numbered lists per-item if items > 150 chars or average > 70 chars with <= 3 items. Splits bullet lists per-item only if items > 150 chars. Otherwise keeps the entire list as one chunk.
  - `processLongParagraphsAfterIntro` (`paragraphProcessor.ts`): `intro:\n` followed by multiple paragraphs where at least one > 150 chars. Splits after intro.
  - `processLongParagraphSequence` (`paragraphProcessor.ts`): First paragraph > 150 chars with multiple lines. Splits after first paragraph (unless followed by "question with options" pattern).

- **`runFormattingProcessors`**:
  - `processMarkdownSection` (`paragraphProcessor.ts`): Uses `findMarkdownSection` (`sections.ts`) to detect `*Header*` or `_Header_` followed by content until next `\n\n` or end. Splits at section boundaries.
  - `processSectionBreaks` (`breakProcessor.ts`): Splits at `\n\n` (double newline) if > 50 chars before the break. Does NOT split if: before ends with `?` and after has short intro + bullets, or before ends with "Puedes responder con:" + bullets, or after has question-with-options pattern. Also checks for markdown headers after break and long paragraphs before break.

- **`runQuestionAndPeriodProcessors`** (fallback):
  - `processQuestionMarks` (`questionProcessor.ts`): Finds all valid `?` positions (excluding those inside bullet lines, parentheses, or before response options). If multiple questions are "contiguous" (no `.` between them, < 50 chars gap), groups them and splits after the last `?`. For single questions: long questions (> 100 chars) split directly; short questions combine with the next sentence if combined length <= 110 chars. Handles emoji-after-question by keeping emoji with the question chunk. Does NOT split if followed by lowercase (sentence continuation).
  - `processPeriodSplits` (`periodProcessor.ts`): Only runs if remaining text > 100 chars. Builds protected ranges (URLs, domains, emails, numbers, abbreviations, bullet points, location abbreviations like `D.C.`) and finds valid `.` positions. Skips if after-period text has a short question (< 35 chars), or if last chunk was short (< 50 chars) + current text is short (< 150 chars) + after-period is short (< 150 chars).

**3. Post-processing**:
- `mergeSmallChunks` (`mergeProcessor.ts`): Chunks < 20 chars merge with the next chunk. Last small chunk merges backward with previous. Respects boundaries: does not merge if current ends with `:` and next is a list or long paragraph, or if next chunk ends with `:`. Does not merge if next starts with `¿`.
- `normalizeSpanishPunctuation` (`punctuationNormalization.ts`): For `¿` and `¡` marks: if mid-sentence (not at string start, not after `.`/`!`/`?`, not after line break), lowercases the following letter. This fixes LLM-generated text like `ayudarte ¿Cómo estás?` → `ayudarte ¿cómo estás?`.

### Key Design Patterns

- **Processor chain:** Each processor returns `{ splitFound: boolean, newRemainingText: string }`. The main loop tries processors in priority order; the first match wins, text is re-evaluated from the top.
- **Protected ranges:** `periodProcessor.ts` builds protected ranges (URLs, emails, domains, numbers, abbreviations, bullet points) to prevent splitting inside them. Ranges are `{ start, end }` intervals. Position is protected if it falls within any range.
- **Position helpers:** `positionHelpers.ts` — `isPositionInsideParentheses` counts open parens before position; `isPositionInBulletLine` checks if position is on a line starting with `- ` or `• `.
- **Text helpers:** `textHelpers.ts` — `smartTrim` removes Unicode whitespace while preserving emojis; `hasTextContent` checks for alphanumeric (not just emojis/symbols); `startsWithEmoji` / `startsWithLowercase` / `findPositionAfterEmoji` for question splitting logic; `isParentheticalClarification` detects `(something)?` patterns.
- **Section detection:** `sections.ts` — `findMarkdownSection` detects `*Header*\n` or `_Header_\n` sections; `findListSection` detects numbered and bullet lists by walking lines with state machines (`NumberedListState`, `BulletListState`).
- **Constants centralized:** Thresholds in `constants.ts` — `MIN_CHUNK_SIZE` (20), `MAX_INTRO_LENGTH` (150), `MAX_QUESTION_WITH_OPTIONS_LENGTH` (250), `SHORT_INTRO_THRESHOLD` (50), `LONG_QUESTION_THRESHOLD` (100), `COMBINED_LENGTH_THRESHOLD` (110), `SHORT_QUESTION_FRAGMENT_THRESHOLD` (35), `MIN_CONTENT_BEFORE_BREAK` (50), `SHORT_CHUNK_THRESHOLD` (50), `CURRENT_TEXT_SHORT_THRESHOLD` (150), `AVG_ITEM_LENGTH_THRESHOLD` (70), `MAX_ITEMS_FOR_LONG_SPLIT` (3), `MAX_LIST_NUMBER` (20), `FIRST_NEWLINE_SEARCH_LIMIT` (100), `DOUBLE_NEWLINE_DISTANCE_THRESHOLD` (5). Also `splitConstants.ts` — `PERIOD_SPLIT_TEXT_THRESHOLD` (100). Several files also define local constants like `LONG_PARAGRAPH_THRESHOLD` (150).

### File Map

```
packages/core/src/
├── index.ts                         # Public API re-export
├── chatSplit/
│   ├── index.ts                     # Re-exports splitChatText
│   ├── splitChatText.ts             # Main orchestrator: pre-process → processor loop → post-process
│   ├── splitProcessors.ts           # Intro+list, question+list, intro+long-paragraphs processors
│   ├── productCardProcessor.ts      # Product card detection (🛍️ emoji or *Title* markdown patterns)
│   ├── listProcessor.ts             # Numbered/bullet list chunking (per-item if items are huge)
│   ├── paragraphProcessor.ts        # Long paragraph sequences, markdown section detection
│   ├── breakProcessor.ts            # Double newline (section break) splitting
│   ├── questionProcessor.ts         # Question mark splitting with contiguous question grouping
│   ├── periodProcessor.ts           # Period splitting with protected ranges (URLs, emails, numbers, etc.)
│   ├── mergeProcessor.ts            # Post-processing: merge chunks < 20 chars with neighbors
│   ├── sections.ts                  # Markdown section and list section boundary detection (state machines)
│   ├── textHelpers.ts               # smartTrim, hasTextContent, emoji detection, lowercase detection
│   ├── positionHelpers.ts           # Parentheses depth counting, bullet line detection
│   ├── listNormalization.ts         # Pre-processing: inline numbered list and product card normalization
│   ├── urlNormalization.ts          # Pre-processing: remove periods after URLs
│   ├── punctuationNormalization.ts  # Post-processing: Spanish ¿/¡ capitalization normalization
│   ├── constants.ts                 # All threshold constants (centralized)
│   └── splitConstants.ts            # PERIOD_SPLIT_TEXT_THRESHOLD constant
└── __tests__/
    └── strs.splitChatText.test.ts   # 40+ scenario-based tests with exact chunk matching
```

### Shared Interface

All processors share the `SplitResult` interface (defined in `splitProcessors.ts`):
```typescript
interface SplitResult {
  splitFound: boolean;
  newRemainingText: string;
}
```

## Code Style & Rules

- **ESLint config** (`eslint.config.mjs`): `eslint-config-love` + `typescript-eslint` recommended + strict custom rules:
  - `max-lines-per-function: 40` (skip blanks/comments)
  - `max-depth: 2`
  - `max-lines: 300` per file
  - `curly: multi-line`
- When hitting max-lines/max-lines-per-function, extract helper functions or split into separate files. Never compress statements onto single lines.
- Never use `any` type — always use explicit TypeScript types.
- Never disable ESLint rules (no eslint-disable comments or config modifications).
- **Prettier** (`.prettierrc`): single quotes, 110 print width, trailing commas (es5), 2-space tabs, import sorting via `@trivago/prettier-plugin-sort-imports`.
- **Import order** (enforced by Prettier plugin): third-party modules → `@globalUtils/*` → `@src/*` → `@globalTypes/*` → relative imports (with blank line separation).
- **ESM throughout:** `"type": "module"` in all package.json files. Imports use `.js` extensions (TypeScript ESM convention).
- **Regex:** Uses the `v` flag (Unicode sets) consistently across all regex patterns.
- **Constants style:** Numeric constants are extracted as named `const` variables (`ZERO`, `NOT_FOUND`, `INDEX_OFFSET`, `INCREMENT`, etc.) throughout all files. New code should follow this pattern.

## Testing

Tests are in `packages/core/src/__tests__/strs.splitChatText.test.ts`. The test suite has 40+ scenario-based tests organized in `describe` blocks:
- Basic question splitting, contiguous questions, period splitting, smart question-period combination
- URL/link protection, number/price protection, email protection
- Edge cases (empty input, null/undefined, emojis, markdown formatting, abbreviations, version numbers)
- Real-world scenarios (22 numbered tests from actual WhatsApp conversations in Spanish)
- Spanish punctuation normalization (¿ and ¡ capitalization)
- Parentheses protection

Tests verify chunk boundaries exactly with `toEqual`. Some tests use structural assertions (`toContain`, `toBe(true/false)`) for URL/domain integrity checks. Jest is configured with `ts-jest` ESM preset and `--experimental-vm-modules`.

## TypeScript Config

- Target: ES2024, Module: NodeNext, moduleResolution: NodeNext
- `strict: true`, `noUncheckedIndexedAccess: true`, `isolatedModules: true`
- Build uses `tsconfig.build.json` (extends `tsconfig.json`, excludes `__tests__/`) + `tsc-alias` for path alias resolution
- Path aliases configured in root `jest.config.js`: `@globalUtils/*`, `@src/*`, `@globalTypes/*` (though core package doesn't currently use path aliases)
