export type Operator = '+' | '−' | '×' | '÷' | '^';
export type AngleMode = 'deg' | 'rad';
export type CalculatorMode = 'basic' | 'scientific';
export type Theme = 'light' | 'dark';
export type FunctionName = 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan' | 'log' | 'ln' | '√';
export type ConstantName = 'π' | 'e';

export type CalcAction =
  | { type: 'digit'; digit: string }
  | { type: 'decimal' }
  | { type: 'operator'; operator: Operator }
  | { type: 'equals'; angleMode?: AngleMode; now?: number }
  | { type: 'clear' }
  | { type: 'delete' }
  | { type: 'sign' }
  | { type: 'percent' }
  | { type: 'square' }
  | { type: 'reciprocal' }
  | { type: 'factorial' }
  | { type: 'exp' }
  | { type: 'function'; name: FunctionName }
  | { type: 'constant'; name: ConstantName }
  | { type: 'paren'; paren: '(' | ')' }
  | { type: 'recall'; value: string };

export interface HistoryEntry {
  id: string;
  /** Raw expression, e.g. `12×5`. */
  expression: string;
  /** Raw result, e.g. `60`. */
  result: string;
  timestamp: number;
}

export interface CalculatorState {
  /** What the user has typed so far (raw, unformatted). */
  expression: string;
  /** Result of the last `=`; non-null only while `justEvaluated`. */
  result: string | null;
  /** Expression that produced `result`. */
  previousExpression: string;
  justEvaluated: boolean;
  error: string | null;
  /** Bumped on every error so the UI can replay its shake animation. */
  errorTick: number;
  /** Bumped on every successful `=` so the UI can replay its result animation. */
  evalTick: number;
  /** Set when `=` produced a new history-worthy calculation. */
  commit: HistoryEntry | null;
}

export type ButtonVariant = 'digit' | 'function' | 'operator' | 'equals' | 'clear' | 'scientific';

export interface ButtonDef {
  id: string;
  label: string;
  ariaLabel: string;
  action: CalcAction;
  variant: ButtonVariant;
  icon?: 'delete';
}
