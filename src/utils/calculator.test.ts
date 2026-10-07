import { describe, expect, it } from 'vitest';
import { CalcError, ERRORS, evaluate, factorial, tryEvaluate } from './calculator';

const calc = (expr: string, angle: 'deg' | 'rad' = 'deg') => evaluate(expr, angle);

describe('basic arithmetic', () => {
  it.each([
    ['2+3', 5],
    ['10−4', 6],
    ['10-4', 6],
    ['5×6', 30],
    ['5*6', 30],
    ['20÷4', 5],
    ['20/4', 5],
    ['−5+10', 5],
    ['12.5×4', 50],
    ['0.1+0.2', 0.30000000000000004],
    ['.5+.5', 1],
    ['1E3+1', 1001],
    ['2×−3', -6],
    ['5−−3', 8],
  ])('%s = %s', (expr, expected) => {
    expect(calc(expr)).toBeCloseTo(expected, 12);
  });

  it('respects operator precedence', () => {
    expect(calc('10+5×2')).toBe(20);
    expect(calc('10−6÷2')).toBe(7);
    expect(calc('(10+5)×2')).toBe(30);
    expect(calc('2×3+4×5')).toBe(26);
  });

  it('supports implicit multiplication', () => {
    expect(calc('2(3+4)')).toBe(14);
    expect(calc('2π')).toBeCloseTo(2 * Math.PI);
    expect(calc('(2)(3)')).toBe(6);
  });

  it('handles large numbers without precision blow-ups', () => {
    expect(calc('999999999999×1000')).toBe(999999999999000);
    expect(calc('1E300×1E5') / 1e305).toBeCloseTo(1, 12);
  });
});

describe('percent', () => {
  it('converts a bare percentage', () => {
    expect(calc('50%')).toBe(0.5);
    expect(calc('5%')).toBe(0.05);
  });
  it('treats a + n% as a percentage of a', () => {
    expect(calc('200+10%')).toBe(220);
    expect(calc('200−10%')).toBe(180);
  });
  it('multiplies normally', () => {
    expect(calc('200×10%')).toBe(20);
  });
});

describe('powers, roots, reciprocal', () => {
  it('square root', () => {
    expect(calc('√(144)')).toBe(12);
    expect(calc('√(2)')).toBeCloseTo(Math.SQRT2);
  });
  it('power', () => {
    expect(calc('5^2')).toBe(25);
    expect(calc('2^10')).toBe(1024);
    expect(calc('2^−1')).toBe(0.5);
    expect(calc('2^3^2')).toBe(512); // right associative
    expect(calc('−2^2')).toBe(-4);
    expect(calc('(−2)^2')).toBe(4);
  });
  it('reciprocal', () => {
    expect(calc('1÷(4)')).toBe(0.25);
  });
});

describe('factorial', () => {
  it('computes factorials', () => {
    expect(calc('5!')).toBe(120);
    expect(calc('0!')).toBe(1);
    expect(calc('10!')).toBe(3628800);
    expect(calc('3!+2')).toBe(8);
    expect(factorial(170)).toBeGreaterThan(1e306);
  });
  it('rejects invalid input', () => {
    expect(() => calc('(−1)!')).toThrow(ERRORS.factorial);
    expect(() => calc('2.5!')).toThrow(ERRORS.factorial);
    expect(() => calc('171!')).toThrow(ERRORS.tooLarge);
  });
});

describe('scientific functions', () => {
  it('trig in degrees', () => {
    expect(calc('sin(30)')).toBeCloseTo(0.5, 12);
    expect(calc('cos(60)')).toBeCloseTo(0.5, 12);
    expect(calc('tan(45)')).toBeCloseTo(1, 12);
    expect(calc('sin(180)')).toBe(0);
    expect(calc('cos(90)')).toBe(0);
  });
  it('trig in radians', () => {
    expect(calc('sin(π÷2)', 'rad')).toBeCloseTo(1, 12);
    expect(calc('cos(π)', 'rad')).toBeCloseTo(-1, 12);
    expect(calc('sin(π)', 'rad')).toBe(0);
  });
  it('inverse trig', () => {
    expect(calc('asin(1)')).toBeCloseTo(90, 10);
    expect(calc('acos(0)')).toBeCloseTo(90, 10);
    expect(calc('atan(1)')).toBeCloseTo(45, 10);
    expect(calc('asin(1)', 'rad')).toBeCloseTo(Math.PI / 2, 12);
  });
  it('logarithms', () => {
    expect(calc('log(1000)')).toBeCloseTo(3, 12);
    expect(calc('ln(e)')).toBeCloseTo(1, 12);
    expect(calc('ln(1)')).toBe(0);
  });
  it('constants', () => {
    expect(calc('π')).toBe(Math.PI);
    expect(calc('e')).toBe(Math.E);
  });
  it('nested functions', () => {
    expect(calc('√(sin(90)+3)')).toBe(2);
  });
});

describe('errors', () => {
  const message = (expr: string) => {
    const result = tryEvaluate(expr);
    return result.ok ? null : result.error;
  };

  it('division by zero', () => {
    expect(message('5÷0')).toBe(ERRORS.divideByZero);
    expect(message('0÷0')).toBe(ERRORS.divideByZero);
    expect(message('1÷(5−5)')).toBe(ERRORS.divideByZero);
    expect(message('0^−1')).toBe(ERRORS.divideByZero);
  });
  it('invalid roots, logs and trig', () => {
    expect(message('√(−4)')).toBe(ERRORS.sqrt);
    expect(message('log(0)')).toBe(ERRORS.log);
    expect(message('ln(−1)')).toBe(ERRORS.log);
    expect(message('asin(2)')).toBe(ERRORS.domain);
    expect(message('tan(90)')).toBe(ERRORS.tan);
    expect(message('(−8)^0.5')).toBe(ERRORS.notReal);
  });
  it('overflow', () => {
    expect(message('1E308×10')).toBe(ERRORS.tooLarge);
    expect(message('10^400')).toBe(ERRORS.tooLarge);
    expect(message('1E999')).toBe(ERRORS.tooLarge);
  });
  it.each(['', '+', '5++', '5+', '(2+3', '2+3)', '()', '1.2.3', '2 $ 3', 'sin', 'sin5', '5E', 'abc', '×5', '2^'])(
    'rejects invalid expression %j',
    (expr) => {
      expect(message(expr)).toBe(ERRORS.invalid);
    },
  );
  it('throws CalcError from evaluate', () => {
    expect(() => evaluate('5÷0')).toThrow(CalcError);
  });
});
