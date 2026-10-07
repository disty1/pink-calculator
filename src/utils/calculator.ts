import type { AngleMode } from '../types/calculator';

/** A user-facing calculation error (message is safe to show in the UI). */
export class CalcError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalcError';
  }
}

export const ERRORS = {
  divideByZero: 'Cannot divide by zero',
  invalid: 'Invalid expression',
  tooLarge: 'Number too large',
  sqrt: 'Invalid input: √ needs a number ≥ 0',
  log: 'Invalid input: log needs a number > 0',
  factorial: 'Invalid input: ! needs a whole number ≥ 0',
  domain: 'Invalid input: must be between −1 and 1',
  tan: 'Undefined: tan has no value here',
  notReal: 'Invalid input: result is not a real number',
} as const;

type FuncName = 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'log' | 'ln' | 'sqrt';
type BinaryOp = '+' | '-' | '*' | '/' | '^';

type Token =
  | { type: 'num'; value: number }
  | { type: 'op'; op: BinaryOp }
  | { type: 'lparen' }
  | { type: 'rparen' }
  | { type: 'fact' }
  | { type: 'pct' }
  | { type: 'func'; name: FuncName }
  | { type: 'const'; value: number };

const NUMBER = /^(?:\d+\.?\d*|\.\d+)(?:E[+\-−]?\d+)?/;
const IDENTIFIER = /^[a-z]+/;
const FUNCTIONS: Record<string, FuncName> = {
  sin: 'sin', cos: 'cos', tan: 'tan', asin: 'asin', acos: 'acos', atan: 'atan', log: 'log', ln: 'ln', sqrt: 'sqrt',
};
const SYMBOLS: Record<string, Token> = {
  '+': { type: 'op', op: '+' },
  '-': { type: 'op', op: '-' },
  '−': { type: 'op', op: '-' },
  '*': { type: 'op', op: '*' },
  '×': { type: 'op', op: '*' },
  '/': { type: 'op', op: '/' },
  '÷': { type: 'op', op: '/' },
  '^': { type: 'op', op: '^' },
  '(': { type: 'lparen' },
  ')': { type: 'rparen' },
  '!': { type: 'fact' },
  '%': { type: 'pct' },
  'π': { type: 'const', value: Math.PI },
  '√': { type: 'func', name: 'sqrt' },
};

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (ch === ' ') {
      i++;
      continue;
    }
    const rest = source.slice(i);

    const num = NUMBER.exec(rest);
    if (num) {
      // "1.2.3" is never valid.
      if (rest[num[0].length] === '.') throw new CalcError(ERRORS.invalid);
      const value = Number(num[0].replace('−', '-'));
      if (!Number.isFinite(value)) throw new CalcError(ERRORS.tooLarge);
      tokens.push({ type: 'num', value });
      i += num[0].length;
      continue;
    }

    const symbol = SYMBOLS[ch];
    if (symbol) {
      tokens.push(symbol);
      i++;
      continue;
    }

    const word = IDENTIFIER.exec(rest)?.[0];
    if (word === 'e') tokens.push({ type: 'const', value: Math.E });
    else if (word === 'pi') tokens.push({ type: 'const', value: Math.PI });
    else if (word && FUNCTIONS[word]) tokens.push({ type: 'func', name: FUNCTIONS[word] });
    else throw new CalcError(ERRORS.invalid);
    i += word.length;
  }
  return tokens;
}

// ---------- math helpers ----------

function check(value: number): number {
  if (Number.isNaN(value)) throw new CalcError(ERRORS.invalid);
  if (!Number.isFinite(value)) throw new CalcError(ERRORS.tooLarge);
  return Object.is(value, -0) ? 0 : value;
}

export function factorial(n: number): number {
  if (!Number.isInteger(n) || n < 0) throw new CalcError(ERRORS.factorial);
  if (n > 170) throw new CalcError(ERRORS.tooLarge);
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
}

function power(base: number, exponent: number): number {
  if (base === 0 && exponent < 0) throw new CalcError(ERRORS.divideByZero);
  const result = Math.pow(base, exponent);
  if (Number.isNaN(result)) throw new CalcError(ERRORS.notReal);
  return check(result);
}

/** Removes floating point dust such as sin(π) = 1.2e-16. */
function cleanTrig(result: number, radians: number): number {
  return Math.abs(result) < 1e-15 && Math.abs(radians) > 1e-9 ? 0 : result;
}

function applyFunction(name: FuncName, x: number, angle: AngleMode): number {
  const toRad = (v: number) => (angle === 'deg' ? (v * Math.PI) / 180 : v);
  const fromRad = (v: number) => (angle === 'deg' ? (v * 180) / Math.PI : v);
  switch (name) {
    case 'sin':
      return cleanTrig(Math.sin(toRad(x)), toRad(x));
    case 'cos':
      return cleanTrig(Math.cos(toRad(x)), toRad(x));
    case 'tan': {
      const rad = toRad(x);
      if (Math.abs(Math.cos(rad)) < 1e-15) throw new CalcError(ERRORS.tan);
      return cleanTrig(Math.tan(rad), rad);
    }
    case 'asin':
      if (x < -1 || x > 1) throw new CalcError(ERRORS.domain);
      return fromRad(Math.asin(x));
    case 'acos':
      if (x < -1 || x > 1) throw new CalcError(ERRORS.domain);
      return fromRad(Math.acos(x));
    case 'atan':
      return fromRad(Math.atan(x));
    case 'log':
      if (x <= 0) throw new CalcError(ERRORS.log);
      return Math.log10(x);
    case 'ln':
      if (x <= 0) throw new CalcError(ERRORS.log);
      return Math.log(x);
    case 'sqrt':
      if (x < 0) throw new CalcError(ERRORS.sqrt);
      return Math.sqrt(x);
  }
}

// ---------- parser ----------

interface Value {
  value: number;
  /** True when the value is a bare `n%`, so `a + n%` can mean `a + a·n/100`. */
  percent: boolean;
}

const plain = (value: number): Value => ({ value, percent: false });

/**
 * Recursive-descent parser. Precedence (low → high):
 *   + −   <   × ÷ (and implicit multiplication)   <   unary −   <   ^   <   ! %
 */
class Parser {
  private pos = 0;
  private readonly tokens: Token[];
  private readonly angle: AngleMode;

  constructor(tokens: Token[], angle: AngleMode) {
    this.tokens = tokens;
    this.angle = angle;
  }

  parse(): number {
    const result = this.expression();
    if (this.pos < this.tokens.length) throw new CalcError(ERRORS.invalid);
    return result.value;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private expect(type: 'rparen' | 'lparen'): void {
    if (this.tokens[this.pos++]?.type !== type) throw new CalcError(ERRORS.invalid);
  }

  private expression(): Value {
    let left = this.term();
    for (;;) {
      const t = this.peek();
      if (t?.type !== 'op' || (t.op !== '+' && t.op !== '-')) return left;
      this.pos++;
      const right = this.term();
      const operand = right.percent ? left.value * right.value : right.value;
      left = plain(check(t.op === '+' ? left.value + operand : left.value - operand));
    }
  }

  private term(): Value {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      if (!t) return left;
      let divide = false;
      if (t.type === 'op' && (t.op === '*' || t.op === '/')) {
        this.pos++;
        divide = t.op === '/';
      } else if (!(t.type === 'num' || t.type === 'const' || t.type === 'func' || t.type === 'lparen')) {
        return left; // not an implicit multiplication either
      }
      const right = this.unary();
      if (divide && right.value === 0) throw new CalcError(ERRORS.divideByZero);
      left = plain(check(divide ? left.value / right.value : left.value * right.value));
    }
  }

  private unary(): Value {
    const t = this.peek();
    if (t?.type === 'op' && (t.op === '-' || t.op === '+')) {
      this.pos++;
      const inner = this.unary();
      return { value: t.op === '-' ? -inner.value : inner.value, percent: inner.percent };
    }
    return this.power();
  }

  private power(): Value {
    const base = this.postfix();
    const t = this.peek();
    if (t?.type === 'op' && t.op === '^') {
      this.pos++;
      return plain(power(base.value, this.unary().value)); // right-associative, allows 2^-3
    }
    return base;
  }

  private postfix(): Value {
    let v = this.primary();
    for (;;) {
      const t = this.peek();
      if (t?.type === 'fact') {
        this.pos++;
        v = plain(factorial(v.value));
      } else if (t?.type === 'pct') {
        this.pos++;
        v = { value: v.value / 100, percent: true };
      } else return v;
    }
  }

  private primary(): Value {
    const t = this.tokens[this.pos++];
    switch (t?.type) {
      case 'num':
      case 'const':
        return plain(t.value);
      case 'lparen': {
        const inner = this.expression();
        this.expect('rparen');
        return plain(inner.value);
      }
      case 'func': {
        this.expect('lparen');
        const inner = this.expression();
        this.expect('rparen');
        return plain(check(applyFunction(t.name, inner.value, this.angle)));
      }
      default:
        throw new CalcError(ERRORS.invalid);
    }
  }
}

/**
 * Evaluates an expression string (no `eval`). Throws `CalcError` for anything
 * invalid. The expression must be complete — see `sanitizeExpression` for
 * trimming dangling operators / closing open parentheses first.
 */
export function evaluate(expression: string, angleMode: AngleMode = 'deg'): number {
  const tokens = tokenize(expression);
  if (tokens.length === 0) throw new CalcError(ERRORS.invalid);
  return check(new Parser(tokens, angleMode).parse());
}

export type EvaluationResult = { ok: true; value: number } | { ok: false; error: string };

export function tryEvaluate(expression: string, angleMode: AngleMode = 'deg'): EvaluationResult {
  try {
    return { ok: true, value: evaluate(expression, angleMode) };
  } catch (error) {
    return { ok: false, error: error instanceof CalcError ? error.message : ERRORS.invalid };
  }
}
