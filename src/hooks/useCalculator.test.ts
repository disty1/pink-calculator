import { describe, expect, it } from 'vitest';
import type { CalcAction } from '../types/calculator';
import { ERRORS } from '../utils/calculator';
import {
  calculatorReducer,
  computePreview,
  currentDisplayValue,
  initialCalculatorState,
} from './useCalculator';

type Step = CalcAction | string;

/** Runs a sequence of presses. Strings: digits, `.`, `+ − × ÷`, `=`, `AC`, `DEL`. */
function run(...steps: Step[]) {
  let state = initialCalculatorState;
  const commits: string[] = [];
  for (const step of steps) {
    const action = typeof step === 'string' ? toAction(step) : step;
    state = calculatorReducer(state, action.type === 'equals' ? { ...action, now: 1000 } : action);
    if (state.commit) commits.push(`${state.commit.expression}=${state.commit.result}`);
  }
  return { state, commits, value: currentDisplayValue(state, computePreview(state.expression, 'deg')) };
}

function toAction(key: string): CalcAction {
  if (/^\d$/.test(key)) return { type: 'digit', digit: key };
  switch (key) {
    case '.': return { type: 'decimal' };
    case '+': case '−': case '×': case '÷': return { type: 'operator', operator: key };
    case '=': return { type: 'equals' };
    case 'AC': return { type: 'clear' };
    case 'DEL': return { type: 'delete' };
    case '%': return { type: 'percent' };
    case '±': return { type: 'sign' };
    case 'x²': return { type: 'square' };
    case '1/x': return { type: 'reciprocal' };
    case '√': return { type: 'function', name: '√' };
    default: throw new Error(`unknown key ${key}`);
  }
}

const keys = (s: string): string[] => s.split(' ');

describe('calculator flow', () => {
  it.each([
    ['2 + 3 =', '5'],
    ['1 0 − 4 =', '6'],
    ['5 × 6 =', '30'],
    ['2 0 ÷ 4 =', '5'],
    ['1 0 + 5 × 2 =', '20'],
    ['5 0 % =', '0.5'],
    ['1 4 4 √ =', '12'],
    ['5 x² =', '25'],
    ['4 1/x =', '0.25'],
    ['5 ± + 1 0 =', '5'],
    ['1 2 . 5 × 4 =', '50'],
    ['0 . 1 + 0 . 2 =', '0.3'],
  ])('%s → %s', (sequence, expected) => {
    expect(run(...keys(sequence)).state.result).toBe(expected);
  });

  it('shows a live preview before pressing equals', () => {
    expect(run(...keys('1 2 5 × 4')).value).toBe('500');
    expect(run(...keys('1 2 +')).value).toBe('12');
    expect(run(...keys('0 . 5')).value).toBe('0.5');
  });

  it('chains calculations from the previous result', () => {
    const { state } = run(...keys('2 + 3 = × 4 ='));
    expect(state.result).toBe('20');
  });

  it('starts fresh when a digit follows equals', () => {
    expect(run(...keys('2 + 3 = 7')).state.expression).toBe('7');
  });

  it('records history for real calculations only', () => {
    expect(run(...keys('1 2 × 5 =')).commits).toEqual(['12×5=60']);
    expect(run(...keys('5 =')).commits).toEqual([]);
    expect(run(...keys('= =')).commits).toEqual([]);
    expect(run(...keys('2 + 2 = =')).commits).toEqual(['2+2=4']);
  });

  it('supports delete and clear', () => {
    expect(run(...keys('1 2 3 DEL')).state.expression).toBe('12');
    expect(run(...keys('1 2 3 AC')).state.expression).toBe('');
    expect(run(...keys('2 + 3 = DEL')).state.expression).toBe('');
  });

  it('negates a result and keeps it ready for the next entry', () => {
    const { state } = run(...keys('2 + 3 = ±'));
    expect(state.expression).toBe('−5');
    expect(state.justEvaluated).toBe(true);
  });

  it('recalls a history result', () => {
    const { state } = run({ type: 'recall', value: '60' }, { type: 'operator', operator: '+' }, ...keys('4 ='));
    expect(state.result).toBe('64');
  });
});

describe('errors', () => {
  it('reports division by zero and stays usable', () => {
    let { state } = run(...keys('5 ÷ 0 ='));
    expect(state.error).toBe(ERRORS.divideByZero);
    expect(state.errorTick).toBe(1);
    expect(state.commit).toBeNull();
    state = calculatorReducer(state, { type: 'delete' });
    expect(state.error).toBeNull();
    state = calculatorReducer(state, { type: 'digit', digit: '2' });
    state = calculatorReducer(state, { type: 'equals' });
    expect(state.result).toBe('2.5');
  });

  it('reports invalid square root', () => {
    expect(run(...keys('4 ± √ =')).state.error).toBe(ERRORS.sqrt);
  });

  it('never throws on arbitrary key mashing', () => {
    const all = keys('0 1 2 3 4 5 6 7 8 9 . + − × ÷ = AC DEL % ± x² 1/x √');
    let seed = 7;
    const next = () => (seed = (seed * 1664525 + 1013904223) % 4294967296);
    for (let round = 0; round < 50; round++) {
      let state = initialCalculatorState;
      for (let i = 0; i < 80; i++) {
        state = calculatorReducer(state, toAction(all[next() % all.length]));
      }
      expect(typeof state.expression).toBe('string');
    }
  });
});
