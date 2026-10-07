import { Check, Copy, TriangleAlert } from 'lucide-react';
import type { AngleMode } from '../types/calculator';
import { formatDisplayValue, prettifyExpression, valueSizeClass } from '../utils/formatter';

interface DisplayProps {
  expression: string;
  value: string;
  error: string | null;
  evaluated: boolean;
  errorTick: number;
  evalTick: number;
  /** Shown as a badge in scientific mode. */
  angleMode: AngleMode | null;
  copied: boolean;
  onCopy: () => void;
}

export function Display({
  expression,
  value,
  error,
  evaluated,
  errorTick,
  evalTick,
  angleMode,
  copied,
  onCopy,
}: DisplayProps) {
  const prettyExpression = prettifyExpression(expression);
  const shownValue = formatDisplayValue(value);
  const status = error ? 'Error: ' : evaluated ? 'Result: ' : 'Current value: ';

  return (
    <section
      key={error ? `error-${errorTick}` : 'display'}
      aria-label="Calculator display"
      className={`rounded-2xl border border-line/60 bg-soft p-4 sm:p-5 ${error ? 'animate-shake' : ''}`}
    >
      <div className="flex h-8 items-center justify-between gap-2">
        <span
          className={`rounded-full border border-line px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-muted ${
            angleMode ? '' : 'invisible'
          }`}
          aria-hidden={!angleMode}
        >
          {angleMode?.toUpperCase() ?? 'DEG'}
        </span>
        <div className="flex items-center gap-2">
          <span role="status" className="sr-only">
            {copied ? 'Copied to clipboard' : ''}
          </span>
          {copied && (
            <span aria-hidden="true" className="animate-expand text-xs font-semibold text-brand">
              Copied!
            </span>
          )}
          <button
            type="button"
            onClick={onCopy}
            disabled={Boolean(error) || value === ''}
            aria-label="Copy result"
            title="Copy result"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-fn hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
          >
            {copied ? <Check aria-hidden="true" className="h-4 w-4" /> : <Copy aria-hidden="true" className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className="fade-left flex h-7 justify-end overflow-hidden text-base text-muted sm:text-lg"
        aria-label={prettyExpression ? `Expression: ${prettyExpression}` : undefined}
      >
        <span className="shrink-0 whitespace-nowrap" aria-hidden="true">
          {prettyExpression || ' '}
        </span>
      </div>

      <output
        aria-live="polite"
        aria-atomic="true"
        className="mt-1 flex min-h-[4rem] items-end justify-end overflow-hidden sm:min-h-[4.5rem]"
      >
        <span className="sr-only">{status}</span>
        {error ? (
          <span className="flex items-center gap-2 text-right text-xl font-semibold leading-tight text-danger sm:text-2xl">
            <TriangleAlert aria-hidden="true" className="h-6 w-6 shrink-0" />
            {error}
          </span>
        ) : (
          <span
            key={evaluated ? `result-${evalTick}` : 'live'}
            className={`block max-w-full whitespace-nowrap font-semibold leading-none tracking-tight ${valueSizeClass(
              shownValue.length,
            )} ${evaluated ? 'animate-result-pop text-brand' : 'text-ink'}`}
          >
            {shownValue || '0'}
          </span>
        )}
      </output>
    </section>
  );
}
