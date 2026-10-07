import type { ButtonDef, ButtonVariant, CalcAction, ConstantName, FunctionName, Operator } from '../types/calculator';

/** Stable id for an action — used for button keys and keyboard-press feedback. */
export function actionId(action: CalcAction): string {
  switch (action.type) {
    case 'digit':
      return `digit-${action.digit}`;
    case 'operator':
      return `operator-${action.operator}`;
    case 'function':
      return `function-${action.name}`;
    case 'constant':
      return `constant-${action.name}`;
    case 'paren':
      return `paren-${action.paren}`;
    default:
      return action.type;
  }
}

function def(
  action: CalcAction,
  label: string,
  ariaLabel: string,
  variant: ButtonVariant,
  icon?: ButtonDef['icon'],
): ButtonDef {
  return { id: actionId(action), label, ariaLabel, action, variant, icon };
}

const digit = (d: string) => def({ type: 'digit', digit: d }, d, d, 'digit');
const operator = (op: Operator, label: string, aria: string) =>
  def({ type: 'operator', operator: op }, label, aria, 'operator');
const fn = (name: FunctionName, label: string, aria: string) =>
  def({ type: 'function', name }, label, aria, 'scientific');
const constant = (name: ConstantName, aria: string) =>
  def({ type: 'constant', name }, name, aria, 'scientific');

/** The classic 5×4 keypad. */
export const MAIN_KEYS: ButtonDef[] = [
  def({ type: 'clear' }, 'AC', 'AC, all clear', 'clear'),
  def({ type: 'delete' }, 'DEL', 'Delete last character', 'function', 'delete'),
  def({ type: 'percent' }, '%', 'Percent', 'function'),
  operator('÷', '÷', 'Divide'),
  digit('7'),
  digit('8'),
  digit('9'),
  operator('×', '×', 'Multiply'),
  digit('4'),
  digit('5'),
  digit('6'),
  operator('−', '−', 'Subtract'),
  digit('1'),
  digit('2'),
  digit('3'),
  operator('+', '+', 'Add'),
  def({ type: 'sign' }, '±', 'Toggle sign, plus or minus', 'function'),
  digit('0'),
  def({ type: 'decimal' }, '.', 'Decimal point', 'function'),
  def({ type: 'equals' }, '=', 'Equals', 'equals'),
];

/** Secondary row available in every mode. */
export const QUICK_KEYS: ButtonDef[] = [
  def({ type: 'function', name: '√' }, '√', 'Square root', 'function'),
  def({ type: 'square' }, 'x²', 'x squared', 'function'),
  def({ type: 'reciprocal' }, '1/x', '1/x, reciprocal', 'function'),
];

/** Extra keys shown in scientific mode (5 columns). */
export const SCIENTIFIC_KEYS: ButtonDef[] = [
  fn('sin', 'sin', 'sin, sine'),
  fn('cos', 'cos', 'cos, cosine'),
  fn('tan', 'tan', 'tan, tangent'),
  def({ type: 'paren', paren: '(' }, '(', 'Open parenthesis', 'scientific'),
  def({ type: 'paren', paren: ')' }, ')', 'Close parenthesis', 'scientific'),
  fn('asin', 'asin', 'asin, inverse sine'),
  fn('acos', 'acos', 'acos, inverse cosine'),
  fn('atan', 'atan', 'atan, inverse tangent'),
  constant('π', 'π, pi'),
  constant('e', "e, Euler's number"),
  fn('log', 'log', 'log, base 10 logarithm'),
  fn('ln', 'ln', 'ln, natural logarithm'),
  def({ type: 'operator', operator: '^' }, 'xʸ', 'xʸ, x to the power of y', 'scientific'),
  def({ type: 'factorial' }, '!', 'Factorial', 'scientific'),
  def({ type: 'exp' }, 'EXP', 'EXP, times ten to the power of', 'scientific'),
];
