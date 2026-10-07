import type { ConstantName, FunctionName, Operator } from '../types/calculator';

/**
 * Pure helpers that edit the raw expression string in response to key presses.
 * Every function returns the (possibly unchanged) new string; invalid input is
 * simply ignored so the expression can never get into a broken shape.
 */

export const MAX_EXPRESSION_LENGTH = 200;
export const MAX_DIGITS = 15;

const FUNCTION_NAMES = '(?:asin|acos|atan|sin|cos|tan|log|ln|√)';
const FUNCTION_OPEN_AT_END = new RegExp(`${FUNCTION_NAMES}\\($`);
const FUNCTION_NAME_AT_END = new RegExp(`${FUNCTION_NAMES}$`);
const TRAILING_NUMBER = /(?:\d+\.?\d*|\.\d+)(?:E[+−-]?\d*)?$/;
const OPEN_EXPONENT = /[\d.]E[+−-]?$/;
const PLAIN_NUMBER = /^[−-]?(?:\d+\.?\d*|\.\d+)(?:E[+−-]?\d+)?$/;

export interface NumberSpan {
  start: number;
  text: string;
}

export function trailingNumber(expr: string): NumberSpan | null {
  const match = TRAILING_NUMBER.exec(expr);
  return match ? { start: match.index, text: match[0] } : null;
}

export const isPlainNumber = (expr: string): boolean => PLAIN_NUMBER.test(expr);
export const endsWithOperator = (expr: string): boolean => /[+−×÷^]$/.test(expr);
export const hasOpenExponent = (expr: string): boolean => OPEN_EXPONENT.test(expr);

/** True if the expression ends in something an operator can be applied to. */
export function endsWithOperand(expr: string): boolean {
  return /[\d.)!%πe]$/.test(expr) && !OPEN_EXPONENT.test(expr);
}

export function countParens(expr: string): { open: number; close: number } {
  let open = 0;
  let close = 0;
  for (const ch of expr) {
    if (ch === '(') open++;
    else if (ch === ')') close++;
  }
  return { open, close };
}

function matchingOpenParen(expr: string, closeIndex: number): number {
  let depth = 0;
  for (let i = closeIndex; i >= 0; i--) {
    if (expr[i] === ')') depth++;
    else if (expr[i] === '(' && --depth === 0) return i;
  }
  return -1;
}

/** Start index of the operand (number, constant or group, plus ! %) at the end. */
export function findTrailingOperand(expr: string): number | null {
  if (!endsWithOperand(expr)) return null;
  let end = expr.length;
  while (end > 0 && (expr[end - 1] === '!' || expr[end - 1] === '%')) end--;
  if (end === 0) return null;

  const last = expr[end - 1];
  if (last === ')') {
    const open = matchingOpenParen(expr, end - 1);
    if (open < 0) return null;
    const fn = FUNCTION_NAME_AT_END.exec(expr.slice(0, open));
    return fn ? fn.index : open;
  }
  if (last === 'π' || last === 'e') return end - 1;
  const number = trailingNumber(expr.slice(0, end));
  return number ? number.start : null;
}

/**
 * Like `findTrailingOperand`, but also covers a leading unary minus and a chain
 * of `^` — i.e. everything a function / x² / 1/x button should apply to.
 */
export function findTrailingFactor(expr: string): number | null {
  let start = findTrailingOperand(expr);
  if (start === null) return null;
  while (start > 0 && expr[start - 1] === '^') {
    const base = findTrailingOperand(expr.slice(0, start - 1));
    if (base === null) break;
    start = base;
  }
  if (expr[start - 1] === '−' && (start === 1 || '(×÷^'.includes(expr[start - 2]))) start -= 1;
  return start;
}

// ---------- editing ----------

const atLimit = (expr: string): boolean => expr.length >= MAX_EXPRESSION_LENGTH;

export function appendDigit(expr: string, digit: string): string {
  if (atLimit(expr)) return expr;
  const number = trailingNumber(expr);
  if (number) {
    if (number.text === '0') return expr.slice(0, number.start) + digit;
    const [mantissa, exponent] = number.text.split('E');
    if (exponent === undefined && mantissa.replace('.', '').length >= MAX_DIGITS) return expr;
    if (exponent !== undefined && exponent.replace(/^[+−-]/, '').length >= 3) return expr;
    return expr + digit;
  }
  if (/[)!%πe]$/.test(expr)) return `${expr}×${digit}`;
  return expr + digit;
}

export function appendDecimal(expr: string): string {
  if (atLimit(expr)) return expr;
  const number = trailingNumber(expr);
  if (number) {
    return number.text.includes('.') || number.text.includes('E') ? expr : `${expr}.`;
  }
  if (OPEN_EXPONENT.test(expr)) return expr;
  return /[)!%πe]$/.test(expr) ? `${expr}×0.` : `${expr}0.`;
}

export function appendOperator(expr: string, operator: Operator): string {
  if (atLimit(expr)) return expr;
  if (expr === '') return operator === '−' ? '−' : expr;
  // "5E" + "−" is an exponent sign, not subtraction.
  if (OPEN_EXPONENT.test(expr)) {
    return (operator === '−' || operator === '+') && expr.endsWith('E') ? expr + operator : expr;
  }
  if (expr.endsWith('(')) return operator === '−' ? `${expr}−` : expr;

  const run = /[+−×÷^]+$/.exec(expr)?.[0];
  if (run) {
    // Allow a sign after × ÷ ^ (e.g. 5×−3).
    if (operator === '−' && run.length === 1 && '×÷^'.includes(run)) return expr + operator;
    const base = expr.slice(0, expr.length - run.length);
    if (base === '' || base.endsWith('(')) return expr; // only a leading sign is allowed
    return base + operator; // replace the previous operator(s)
  }
  return expr + operator;
}

export function applyFunction(expr: string, name: FunctionName): string {
  if (atLimit(expr) || OPEN_EXPONENT.test(expr)) return expr;
  const start = findTrailingFactor(expr);
  if (start !== null) return `${expr.slice(0, start)}${name}(${expr.slice(start)})`;
  return `${expr}${name}(`;
}

export function applyConstant(expr: string, name: ConstantName): string {
  if (atLimit(expr) || OPEN_EXPONENT.test(expr)) return expr;
  return endsWithOperand(expr) ? `${expr}×${name}` : expr + name;
}

export function appendParen(expr: string, paren: '(' | ')'): string {
  if (atLimit(expr) || OPEN_EXPONENT.test(expr)) return expr;
  if (paren === '(') return endsWithOperand(expr) ? `${expr}×(` : `${expr}(`;
  const { open, close } = countParens(expr);
  return open > close && endsWithOperand(expr) ? `${expr})` : expr;
}

export const appendPercent = (expr: string): string =>
  endsWithOperand(expr) && !atLimit(expr) ? `${expr}%` : expr;

export const appendFactorial = (expr: string): string =>
  endsWithOperand(expr) && !atLimit(expr) ? `${expr}!` : expr;

export function applySquare(expr: string): string {
  const operand = findTrailingOperand(expr);
  const factor = findTrailingFactor(expr);
  if (operand === null || factor === null || atLimit(expr)) return expr;
  if (factor === operand) return `${expr}^2`;
  return `${expr.slice(0, factor)}(${expr.slice(factor)})^2`;
}

export function applyReciprocal(expr: string): string {
  const factor = findTrailingFactor(expr);
  if (factor === null || atLimit(expr)) return expr;
  return `${expr.slice(0, factor)}1÷(${expr.slice(factor)})`;
}

export function appendExp(expr: string): string {
  const number = trailingNumber(expr);
  if (!number || number.text.includes('E') || atLimit(expr)) return expr;
  return `${expr}E`;
}

export function toggleSign(expr: string): string {
  if (expr === '') return '−';
  const start = findTrailingOperand(expr);
  if (start === null) {
    const last = expr[expr.length - 1];
    if ('×÷^('.includes(last)) return `${expr}−`;
    if (last === '−' && (expr.length === 1 || '×÷^('.includes(expr[expr.length - 2]))) return expr.slice(0, -1);
    return expr;
  }
  const operand = expr.slice(start);
  // "(−3)" produced by an earlier toggle → "3"
  const wrapped = /^\(−([^()]*)\)$/.exec(operand);
  if (wrapped) return expr.slice(0, start) + wrapped[1];
  const previous = expr[start - 1];
  if (previous === '−' && (start === 1 || '×÷^('.includes(expr[start - 2]))) {
    return expr.slice(0, start - 1) + operand; // remove unary minus
  }
  if (start === 0 || previous === '(') return `${expr.slice(0, start)}−${operand}`;
  return `${expr.slice(0, start)}(−${operand})`;
}

export function deleteLast(expr: string): string {
  const withoutFunction = expr.replace(FUNCTION_OPEN_AT_END, '');
  return withoutFunction !== expr ? withoutFunction : expr.slice(0, -1);
}

/**
 * Prepares an expression for evaluation: drops dangling operators, empty
 * function openers and incomplete exponents, then closes open parentheses.
 */
export function sanitizeExpression(expr: string): string {
  let s = expr.trim();
  for (;;) {
    const next = s
      .replace(FUNCTION_OPEN_AT_END, '')
      .replace(/[+−×÷^(]$/, '')
      .replace(/([\d.])E[+−-]?$/, '$1');
    if (next === s) break;
    s = next;
  }
  const { open, close } = countParens(s);
  return open > close ? s + ')'.repeat(open - close) : s;
}

export interface ExpressionParts {
  currentValue: string;
  previousValue: string;
  operator: string;
}

/** Splits the expression into the number being typed, what precedes it, and the operator between. */
export function describeExpression(expr: string): ExpressionParts {
  const number = trailingNumber(expr);
  const head = number ? expr.slice(0, number.start) : expr;
  const run = /[+−×÷^]+$/.exec(head)?.[0] ?? '';
  return {
    currentValue: number?.text ?? '',
    previousValue: run ? head.slice(0, head.length - run.length) : head,
    operator: run[0] ?? '',
  };
}
