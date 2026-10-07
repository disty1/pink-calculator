import { describe, expect, it } from 'vitest';
import {
  appendDecimal,
  appendDigit,
  appendExp,
  appendOperator,
  appendParen,
  appendPercent,
  applyConstant,
  applyFunction,
  applyReciprocal,
  applySquare,
  deleteLast,
  describeExpression,
  findTrailingOperand,
  sanitizeExpression,
  toggleSign,
} from './expression';

describe('digits and decimals', () => {
  it('replaces a lone leading zero', () => {
    expect(appendDigit('0', '5')).toBe('5');
    expect(appendDigit('0', '0')).toBe('0');
    expect(appendDigit('10', '0')).toBe('100');
    expect(appendDigit('5+0', '3')).toBe('5+3');
  });
  it('limits the digits of a single number', () => {
    const full = '1'.repeat(15);
    expect(appendDigit(full, '2')).toBe(full);
  });
  it('inserts implicit multiplication after a closed group', () => {
    expect(appendDigit('(2+3)', '4')).toBe('(2+3)×4');
    expect(appendDigit('π', '2')).toBe('π×2');
  });
  it('prevents multiple decimal points', () => {
    expect(appendDecimal('1.5')).toBe('1.5');
    expect(appendDecimal('1')).toBe('1.');
    expect(appendDecimal('')).toBe('0.');
    expect(appendDecimal('5+')).toBe('5+0.');
    expect(appendDecimal('5E3')).toBe('5E3');
  });
});

describe('operators', () => {
  it('ignores operators at the start except minus', () => {
    expect(appendOperator('', '×')).toBe('');
    expect(appendOperator('', '−')).toBe('−');
    expect(appendOperator('(', '+')).toBe('(');
    expect(appendOperator('(', '−')).toBe('(−');
  });
  it('replaces consecutive operators', () => {
    expect(appendOperator('5+', '×')).toBe('5×');
    expect(appendOperator('5×', '÷')).toBe('5÷');
    expect(appendOperator('5×−', '+')).toBe('5+');
    expect(appendOperator('−', '+')).toBe('−');
  });
  it('allows a negative number after × ÷ ^', () => {
    expect(appendOperator('5×', '−')).toBe('5×−');
    expect(appendOperator('5×−', '−')).toBe('5+'.replace('+', '−'));
  });
  it('treats +/− after E as an exponent sign', () => {
    expect(appendOperator('5E', '−')).toBe('5E−');
    expect(appendOperator('5E', '×')).toBe('5E');
    expect(appendExp('5')).toBe('5E');
    expect(appendExp('5E')).toBe('5E');
    expect(appendExp('')).toBe('');
  });
});

describe('unary buttons', () => {
  it('square appends ^2 to the last operand', () => {
    expect(applySquare('3+4')).toBe('3+4^2');
    expect(applySquare('−5')).toBe('(−5)^2');
    expect(applySquare('2^3')).toBe('(2^3)^2');
    expect(applySquare('')).toBe('');
    expect(applySquare('3+')).toBe('3+');
  });
  it('reciprocal wraps the last factor', () => {
    expect(applyReciprocal('4')).toBe('1÷(4)');
    expect(applyReciprocal('2+4')).toBe('2+1÷(4)');
    expect(applyReciprocal('2^3')).toBe('1÷(2^3)');
    expect(applyReciprocal('')).toBe('');
  });
  it('functions wrap an existing operand or open a call', () => {
    expect(applyFunction('144', '√')).toBe('√(144)');
    expect(applyFunction('2×30', 'sin')).toBe('2×sin(30)');
    expect(applyFunction('', 'sin')).toBe('sin(');
    expect(applyFunction('5+', 'ln')).toBe('5+ln(');
    expect(applyFunction('−4', '√')).toBe('√(−4)');
    expect(applyFunction('sin(30)', 'cos')).toBe('cos(sin(30))');
  });
  it('constants and parentheses add implicit multiplication', () => {
    expect(applyConstant('2', 'π')).toBe('2×π');
    expect(applyConstant('2+', 'e')).toBe('2+e');
    expect(appendParen('2', '(')).toBe('2×(');
    expect(appendParen('(2+3', ')')).toBe('(2+3)');
    expect(appendParen('2+3', ')')).toBe('2+3');
    expect(appendParen('(2+', ')')).toBe('(2+');
  });
  it('percent needs an operand', () => {
    expect(appendPercent('50')).toBe('50%');
    expect(appendPercent('')).toBe('');
    expect(appendPercent('5+')).toBe('5+');
  });
});

describe('toggleSign', () => {
  it('toggles the leading number', () => {
    expect(toggleSign('5')).toBe('−5');
    expect(toggleSign('−5')).toBe('5');
  });
  it('wraps a number after a binary operator', () => {
    expect(toggleSign('5+3')).toBe('5+(−3)');
    expect(toggleSign('5+(−3)')).toBe('5+3');
    expect(toggleSign('5−3')).toBe('5−(−3)');
  });
  it('toggles a unary minus after × ÷', () => {
    expect(toggleSign('5×−3')).toBe('5×3');
    expect(toggleSign('5×3')).toBe('5×(−3)');
  });
  it('handles groups', () => {
    expect(toggleSign('sin(30)')).toBe('−sin(30)');
    expect(toggleSign('−sin(30)')).toBe('sin(30)');
  });
});

describe('deleteLast / sanitize / describe', () => {
  it('removes a whole function opener at once', () => {
    expect(deleteLast('5+sin(')).toBe('5+');
    expect(deleteLast('5+√(')).toBe('5+');
    expect(deleteLast('123')).toBe('12');
    expect(deleteLast('')).toBe('');
  });
  it('sanitizes dangling input and closes parentheses', () => {
    expect(sanitizeExpression('5+')).toBe('5');
    expect(sanitizeExpression('5×(')).toBe('5');
    expect(sanitizeExpression('√(144')).toBe('√(144)');
    expect(sanitizeExpression('sin(')).toBe('');
    expect(sanitizeExpression('5E−')).toBe('5');
    expect(sanitizeExpression('((2+3')).toBe('((2+3))');
  });
  it('finds the trailing operand', () => {
    expect(findTrailingOperand('2+sin(30)')).toBe(2);
    expect(findTrailingOperand('2+')).toBeNull();
    expect(findTrailingOperand('12.5%')).toBe(0);
  });
  it('describes the expression parts', () => {
    expect(describeExpression('12+34')).toEqual({ currentValue: '34', previousValue: '12', operator: '+' });
    expect(describeExpression('12×')).toEqual({ currentValue: '', previousValue: '12', operator: '×' });
    expect(describeExpression('')).toEqual({ currentValue: '', previousValue: '', operator: '' });
  });
});
