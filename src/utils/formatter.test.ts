import { describe, expect, it } from 'vitest';
import {
  formatDisplayValue,
  formatNumberText,
  formatTimestamp,
  prettifyExpression,
  toExpressionNumber,
} from './formatter';

describe('toExpressionNumber', () => {
  it('removes floating point noise', () => {
    expect(toExpressionNumber(0.1 + 0.2)).toBe('0.3');
    expect(toExpressionNumber(1 / 3)).toBe('0.333333333333333');
    expect(toExpressionNumber(1.1 * 1.1)).toBe('1.21');
  });
  it('uses a real minus sign and no negative zero', () => {
    expect(toExpressionNumber(-5)).toBe('−5');
    expect(toExpressionNumber(-0)).toBe('0');
  });
  it('keeps safe integers exact', () => {
    expect(toExpressionNumber(2 ** 50)).toBe('1125899906842624');
  });
  it('switches to scientific notation for huge and tiny numbers', () => {
    expect(toExpressionNumber(1e21)).toBe('1E+21');
    expect(toExpressionNumber(1.5e-9)).toBe('1.5E−9');
    expect(Number(toExpressionNumber(Number.MAX_VALUE).replace('E', 'e'))).toBe(Number.MAX_VALUE);
  });
});

describe('formatNumberText', () => {
  it('groups thousands and preserves in-progress input', () => {
    expect(formatNumberText('1234567.891')).toBe('1,234,567.891');
    expect(formatNumberText('1234.')).toBe('1,234.');
    expect(formatNumberText('−1234')).toBe('−1,234');
    expect(formatNumberText('0.')).toBe('0.');
    expect(formatNumberText('1.5E+20')).toBe('1.5E+20');
  });
});

describe('formatDisplayValue', () => {
  it('leaves short values alone', () => {
    expect(formatDisplayValue('1234')).toBe('1,234');
  });
  it('drops separators before it ever rounds typed input', () => {
    expect(formatDisplayValue('999999999999999')).toBe('999999999999999');
    expect(formatDisplayValue('0.123456789012345')).toBe('0.123456789012345');
  });
  it('shortens long integers with scientific notation', () => {
    expect(formatDisplayValue('123456789012345678')).toBe('1.23456789E+17');
  });
  it('rounds long decimals to fit', () => {
    expect(formatDisplayValue('0.333333333333333').length).toBeLessThanOrEqual(17);
  });
  it('never exceeds the limit for extreme values', () => {
    expect(formatDisplayValue('1.7976931348623E+308').length).toBeLessThanOrEqual(17);
  });
});

describe('prettifyExpression', () => {
  it('spaces binary operators only', () => {
    expect(prettifyExpression('125×4')).toBe('125 × 4');
    expect(prettifyExpression('5×−3')).toBe('5 × −3');
    expect(prettifyExpression('−5+10')).toBe('−5 + 10');
    expect(prettifyExpression('√(1000)')).toBe('√(1,000)');
    expect(prettifyExpression('2^3')).toBe('2 ^ 3');
  });
});

describe('formatTimestamp', () => {
  const now = Date.UTC(2025, 0, 15, 12, 0, 0);
  it('is relative for recent entries', () => {
    expect(formatTimestamp(now - 5_000, now)).toBe('Just now');
    expect(formatTimestamp(now - 5 * 60_000, now)).toBe('5 min ago');
  });
});
