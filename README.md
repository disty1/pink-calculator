# PinkCalc

A polished, dependency-light web calculator — **Smart • Simple • Beautiful**.
React + TypeScript + Vite + Tailwind CSS + Lucide icons. No backend; history and settings live in `localStorage`.

## Features

- Basic and **Scientific** modes (sin, cos, tan, asin, acos, atan, log, ln, π, e, xʸ, !, ( ), EXP) with a DEG/RAD toggle
- `√`, `x²`, `1/x`, `%`, `±`, backspace, all-clear; chained calculations and correct operator precedence
- Safe expression evaluator (tokenizer + recursive-descent parser — **no `eval`**)
- Friendly errors (`Cannot divide by zero`, invalid √ / log / factorial input, overflow…) that never crash the UI
- Live result preview, scientific notation for huge/tiny numbers, auto-shrinking display
- Calculation history (max 50): reuse a result, delete one, clear all, persisted
- Light / dark theme (follows system on first visit, then remembers your choice)
- Full keyboard support, copy-result button, accessible labels, visible focus, `prefers-reduced-motion`
- Responsive: side-by-side history on desktop, collapsible history panel on mobile

## Scripts

```bash
npm install
npm run dev      # dev server
npm run build    # type-check + production build (dist/)
npm run preview  # serve the production build
npm test         # unit tests (vitest)
npm run lint     # eslint
```

## Keyboard

`0-9 . + - * / %` · `Enter`/`=` equals · `Backspace` delete · `Esc`/`Delete` clear · `@` √ · `q` x² · `r` 1/x  
Scientific mode adds `( ) ^ !` · `s o t` sin/cos/tan · `l n` log/ln · `p` π · `e` e · `E` EXP

## Structure

```
src/
  components/  Calculator, Display, CalculatorButton, History, ScientificPanel,
               ThemeToggle, ModeToggle, KeyboardHint
  hooks/       useCalculator (reducer), useHistory, useTheme, useKeyboard,
               usePersistentState, useCopyToClipboard, useMediaQuery
  utils/       calculator (evaluator), expression (input editing), formatter,
               storage, buttons, keymap
  types/       calculator.ts
```

The calculator state is a pure reducer over a raw expression string (`2+3×4`); each key press edits the
string through small pure helpers in `utils/expression.ts`, and `utils/calculator.ts` evaluates it.
`a + n%` behaves like a typical calculator (`200+10% = 220`); `50%` alone is `0.5`.
