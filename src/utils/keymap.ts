import type { CalcAction, Operator } from '../types/calculator';

export interface MappedKey {
  action: CalcAction;
  /** Only active in scientific mode. */
  scientific?: boolean;
}

const op = (operator: Operator): MappedKey => ({ action: { type: 'operator', operator } });
const fn = (name: Extract<CalcAction, { type: 'function' }>['name']): MappedKey => ({
  action: { type: 'function', name },
  scientific: true,
});

const KEYS: Record<string, MappedKey> = {
  '+': op('+'),
  '-': op('−'),
  '−': op('−'),
  '*': op('×'),
  x: op('×'),
  X: op('×'),
  '×': op('×'),
  '/': op('÷'),
  '÷': op('÷'),
  '%': { action: { type: 'percent' } },
  '.': { action: { type: 'decimal' } },
  ',': { action: { type: 'decimal' } },
  Enter: { action: { type: 'equals' } },
  '=': { action: { type: 'equals' } },
  Backspace: { action: { type: 'delete' } },
  Escape: { action: { type: 'clear' } },
  Delete: { action: { type: 'clear' } },
  '@': { action: { type: 'function', name: '√' } },
  q: { action: { type: 'square' } },
  r: { action: { type: 'reciprocal' } },
  '(': { action: { type: 'paren', paren: '(' }, scientific: true },
  ')': { action: { type: 'paren', paren: ')' }, scientific: true },
  '^': { action: { type: 'operator', operator: '^' }, scientific: true },
  '!': { action: { type: 'factorial' }, scientific: true },
  E: { action: { type: 'exp' }, scientific: true },
  p: { action: { type: 'constant', name: 'π' }, scientific: true },
  e: { action: { type: 'constant', name: 'e' }, scientific: true },
  s: fn('sin'),
  o: fn('cos'),
  t: fn('tan'),
  l: fn('log'),
  n: fn('ln'),
};

export function mapKey(key: string): MappedKey | null {
  if (/^[0-9]$/.test(key)) return { action: { type: 'digit', digit: key } };
  return Object.hasOwn(KEYS, key) ? KEYS[key] : null;
}

/** Shortcuts shown in the in-app help. */
export const SHORTCUT_HELP: { keys: string[]; label: string }[] = [
  { keys: ['0', '–', '9'], label: 'Digits' },
  { keys: ['+', '-', '*', '/'], label: 'Operators' },
  { keys: ['Enter', '='], label: 'Equals' },
  { keys: ['Backspace'], label: 'Delete' },
  { keys: ['Esc', 'Del'], label: 'Clear' },
  { keys: ['%'], label: 'Percent' },
  { keys: ['.'], label: 'Decimal' },
  { keys: ['@'], label: 'Square root' },
  { keys: ['q'], label: 'Square' },
  { keys: ['r'], label: 'Reciprocal' },
];

export const SCIENTIFIC_SHORTCUT_HELP: { keys: string[]; label: string }[] = [
  { keys: ['(', ')'], label: 'Parentheses' },
  { keys: ['^', '!'], label: 'Power, factorial' },
  { keys: ['s', 'o', 't'], label: 'sin, cos, tan' },
  { keys: ['l', 'n'], label: 'log, ln' },
  { keys: ['p', 'e'], label: 'π, e' },
  { keys: ['E'], label: 'EXP' },
];
