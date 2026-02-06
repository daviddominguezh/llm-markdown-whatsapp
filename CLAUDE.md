# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript monorepo that splits LLM-generated markdown text into WhatsApp-friendly chat message chunks. The core algorithm intelligently breaks long text at natural boundaries (questions, periods, lists, markdown sections) while preserving URLs, numbers, emails, abbreviations, parenthetical expressions, and Spanish punctuation.

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

**Core package entry point:** `packages/core/src/index.ts` exports `splitChatText` — the single public API function.

### splitChatText Pipeline

`splitChatText(text)` in `packages/core/src/chatSplit/splitChatText.ts` is the orchestrator:

1. **Pre-processing** — normalize inline numbered lists, inline product card lists, and URL periods
2. **Main loop** — iteratively applies processor chains on remaining text:
   - **Intro/list processors** (`splitProcessors.ts`): intro + colon + list, question + numbered list, intro + long paragraphs
   - **Content structure processors**: product cards (`productCardProcessor.ts`), list sections (`listProcessor.ts`), long paragraphs (`paragraphProcessor.ts`)
   - **Formatting processors**: markdown sections (`paragraphProcessor.ts`), section breaks / double newlines (`breakProcessor.ts`)
   - **Fallback processors**: question marks (`questionProcessor.ts`), period splits (`periodProcessor.ts`)
3. **Post-processing** — merge small chunks (<20 chars) with adjacent ones (`mergeProcessor.ts`), normalize Spanish punctuation (¿/¡ capitalization)

### Key Design Patterns

- **Processor chain:** Each processor returns `{ splitFound: boolean, newRemainingText: string }`. The main loop tries processors in priority order; the first match wins, text is re-evaluated.
- **Protected ranges:** `periodProcessor.ts` builds protected ranges (URLs, emails, domains, numbers, abbreviations, bullet points) to prevent splitting inside them.
- **Position helpers:** `positionHelpers.ts` checks if a candidate split position is inside parentheses or bullet lines.
- **Constants centralized:** Thresholds live in `constants.ts` and `splitConstants.ts` — `MIN_CHUNK_SIZE` (20), `MAX_INTRO_LENGTH` (150), `LONG_PARAGRAPH_THRESHOLD` (150), `PERIOD_SPLIT_TEXT_THRESHOLD` (100), etc.

## Code Style & Rules

- **ESLint config:** `eslint-config-love` + strict custom rules:
  - `max-lines-per-function: 40` (skip blanks/comments)
  - `max-depth: 2`
  - `max-lines: 300` per file
- When hitting max-lines/max-lines-per-function, extract helper functions or split into separate files. Never compress statements onto single lines.
- Never use `any` type — always use explicit TypeScript types.
- Never disable ESLint rules (no eslint-disable comments or config modifications).
- **Prettier:** single quotes, 110 print width, trailing commas (es5), import sorting via `@trivago/prettier-plugin-sort-imports`.
- **Import order:** third-party modules, then `@globalUtils/*`, `@src/*`, `@globalTypes/*`, then relative imports.
- **ESM throughout:** `"type": "module"` in all package.json files. Imports use `.js` extensions (TypeScript ESM convention).
- **Regex:** Uses the `v` flag (Unicode sets) consistently across all regex patterns.

## Testing

Tests are in `packages/core/src/__tests__/`. The test suite is heavily scenario-based with real-world WhatsApp conversation examples in Spanish. Tests verify chunk boundaries exactly with `toEqual`, not just structural properties.

## TypeScript Config

- Target: ES2024, Module: NodeNext
- `strict: true`, `noUncheckedIndexedAccess: true`
- Build uses `tsconfig.build.json` (excludes tests) + `tsc-alias` for path alias resolution
