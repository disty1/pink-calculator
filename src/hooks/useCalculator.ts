import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { AngleMode, CalcAction, CalculatorState, HistoryEntry } from '../types/calculator';
import { CalcError, ERRORS, evaluate, tryEvaluate } from '../utils/calculator';
import {
  appendDecimal,
  appendDigit,
  appendExp,
  appendFactorial,
  appendOperator,
  appendParen,
  appendPercent,
  applyConstant,
  applyFunction,
  applyReciprocal,
  applySquare,
  deleteLast,
  describeExpression,
  isPlainNumber,
  sanitizeExpression,
  toggleSign,
} from '../utils/expression';
import { toExpressionNumber } from '../utils/formatter';

export const initialCalculatorState: CalculatorState = {
  expression: '',
  result: null,
  previousExpression: '',
  justEvaluated: false,
  error: null,
  errorTick: 0,
  evalTick: 0,
  commit: null,
};

/** After `=`, these actions start a brand-new expression instead of continuing from the result. */
const startsFresh = (action: CalcAction): boolean =>
  action.type === 'digit' ||
  action.type === 'decimal' ||
  action.type === 'constant' ||
  (action.type === 'paren' && action.paren === '(');

function edit(expression: string, action: CalcAction): string {
  switch (action.type) {
    case 'digit':
      return appendDigit(expression, action.digit);
    case 'decimal':
      return appendDecimal(expression);
    case 'operator':
      return appendOperator(expression, action.operator);
    case 'delete':
      return deleteLast(expression);
    case 'sign':
      return toggleSign(expression);
    case 'percent':
      return appendPercent(expression);
    case 'square':
      return applySquare(expression);
    case 'reciprocal':
      return applyReciprocal(expression);
    case 'factorial':
      return appendFactorial(expression);
    case 'exp':
      return appendExp(expression);
    case 'function':
      return applyFunction(expression, action.name);
    case 'constant':
      return applyConstant(expression, action.name);
    case 'paren':
      return appendParen(expression, action.paren);
    default:
      return expression;
  }
}

function evaluateState(state: CalculatorState, angleMode: AngleMode, now: number): CalculatorState {
  if (state.justEvaluated) return { ...state, commit: null };
  const prepared = sanitizeExpression(state.expression);
  if (prepared === '') return { ...state, error: null, commit: null };

  try {
    const result = toExpressionNumber(evaluate(prepared, angleMode));
    const evalTick = state.evalTick + 1;
    const commit: HistoryEntry | null = isPlainNumber(prepared)
      ? null
      : { id: `${now}-${evalTick}`, expression: prepared, result, timestamp: now };
    return {
      ...state,
      expression: result,
      result,
      previousExpression: prepared,
      justEvaluated: true,
      error: null,
      evalTick,
      commit,
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof CalcError ? error.message : ERRORS.invalid,
      errorTick: state.errorTick + 1,
      commit: null,
    };
  }
}

export function calculatorReducer(state: CalculatorState, action: CalcAction): CalculatorState {
  switch (action.type) {
    case 'clear':
      return { ...initialCalculatorState, errorTick: state.errorTick, evalTick: state.evalTick };
    case 'recall':
      return {
        ...initialCalculatorState,
        expression: action.value,
        result: action.value,
        justEvaluated: true,
        errorTick: state.errorTick,
        evalTick: state.evalTick,
      };
    case 'equals':
      return evaluateState(state, action.angleMode ?? 'deg', action.now ?? Date.now());
  }

  const base = state.justEvaluated && startsFresh(action) ? '' : state.expression;
  const expression = edit(base, action);

  // Negating a fresh result keeps it "evaluated" so the next digit still starts over.
  if (action.type === 'sign' && state.justEvaluated) {
    return { ...state, expression, result: expression, error: null, commit: null };
  }
  return {
    ...state,
    expression,
    result: null,
    previousExpression: '',
    justEvaluated: false,
    error: null,
    commit: null,
  };
}

/** Live result of an unfinished expression, or `null` when it can't be computed yet. */
export function computePreview(expression: string, angleMode: AngleMode): string | null {
  const prepared = sanitizeExpression(expression);
  if (prepared === '' || isPlainNumber(prepared)) return null;
  const result = tryEvaluate(prepared, angleMode);
  return result.ok ? toExpressionNumber(result.value) : null;
}

/** The raw number to show on the main display line. */
export function currentDisplayValue(state: CalculatorState, preview: string | null): string {
  if (state.error) return '';
  if (state.justEvaluated) return state.result ?? '';
  const prepared = sanitizeExpression(state.expression);
  if (prepared === '') return '0';
  if (isPlainNumber(prepared)) return prepared;
  if (preview !== null) return preview;
  return prepared.match(/(?:\d+\.?\d*|\.\d+)(?:E[+−-]?\d+)?/g)?.at(-1) ?? '0';
}

export interface UseCalculatorOptions {
  angleMode: AngleMode;
  onCommit?: (entry: HistoryEntry) => void;
}

export function useCalculator({ angleMode, onCommit }: UseCalculatorOptions) {
  const [state, dispatch] = useReducer(calculatorReducer, initialCalculatorState);

  const commitRef = useRef(onCommit);
  useEffect(() => {
    commitRef.current = onCommit;
  });
  useEffect(() => {
    if (state.commit) commitRef.current?.(state.commit);
  }, [state.commit]);

  const press = useCallback(
    (action: CalcAction) => {
      dispatch(action.type === 'equals' ? { ...action, angleMode, now: Date.now() } : action);
    },
    [angleMode],
  );

  const { expression, justEvaluated, error } = state;
  const preview = useMemo(
    () => (justEvaluated || error ? null : computePreview(expression, angleMode)),
    [expression, justEvaluated, error, angleMode],
  );
  const value = currentDisplayValue(state, preview);
  const parts = useMemo(() => describeExpression(expression), [expression]);

  return {
    state,
    press,
    /** Raw (unformatted) number for the main display line. */
    value,
    /** Raw expression for the secondary line (empty when it would just repeat the value). */
    expressionText: justEvaluated
      ? state.previousExpression
        ? `${state.previousExpression} =`
        : ''
      : isPlainNumber(expression)
        ? ''
        : expression,
    currentValue: parts.currentValue,
    previousValue: parts.previousValue,
    operator: parts.operator,
  };
}
