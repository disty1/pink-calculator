import { useEffect, useState } from 'react';
import { ChevronDown, History as HistoryIcon, Trash2, X } from 'lucide-react';
import type { HistoryEntry } from '../types/calculator';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { formatDisplayValue, formatTimestamp, prettifyExpression } from '../utils/formatter';

interface HistoryProps {
  entries: HistoryEntry[];
  onRecall: (result: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function History({ entries, onRecall, onRemove, onClear }: HistoryProps) {
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const open = isDesktop || expanded;

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const handleClear = () => {
    if (!confirming) return setConfirming(true);
    setConfirming(false);
    onClear();
  };

  return (
    <section
      aria-label="Calculation history"
      className="animate-pop-in flex flex-col rounded-3xl border border-line/70 bg-card/80 p-4 shadow-card backdrop-blur-xl [animation-delay:80ms] sm:p-5 lg:min-h-0"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <HistoryIcon aria-hidden="true" className="h-5 w-5 text-brand" />
          History
          <span className="rounded-full bg-fn px-2 py-0.5 text-xs font-bold text-fn-ink" aria-label={`${entries.length} entries`}>
            {entries.length}
          </span>
        </h2>
        <div className="flex items-center gap-1">
          {open && entries.length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                confirming ? 'bg-clear text-clear-ink' : 'text-muted hover:bg-fn hover:text-brand'
              }`}
            >
              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
              {confirming ? 'Click again to confirm' : 'Clear all'}
            </button>
          )}
          {!isDesktop && (
            <button
              type="button"
              aria-expanded={expanded}
              aria-controls="history-list"
              aria-label={expanded ? 'Collapse history' : 'Expand history'}
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition hover:bg-fn hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronDown aria-hidden="true" className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <div id="history-list" className={`${open ? 'mt-4' : 'hidden'} lg:relative lg:min-h-[14rem] lg:flex-1`}>
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line px-4 py-10 text-center text-muted lg:absolute lg:inset-0">
            <HistoryIcon aria-hidden="true" className="h-10 w-10 opacity-50" />
            <p className="font-medium">No calculations yet</p>
            <p className="text-sm opacity-80">Your results will show up here.</p>
          </div>
        ) : (
          <ul className="max-h-80 space-y-2 overflow-y-auto pr-1 lg:absolute lg:inset-0 lg:max-h-none">
            {entries.map((entry) => {
              const expression = prettifyExpression(entry.expression);
              const result = formatDisplayValue(entry.result, 20);
              return (
                <li
                  key={entry.id}
                  className="group relative animate-slide-in rounded-2xl border border-line/60 bg-soft transition hover:border-accent/40 hover:bg-fn"
                >
                  <button
                    type="button"
                    onClick={() => onRecall(entry.result)}
                    aria-label={`Use result ${result} from ${expression}`}
                    title="Use this result"
                    className="block w-full rounded-2xl px-4 py-3 pr-11 text-right focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="block truncate text-sm text-muted">{expression}</span>
                    <span className="block truncate text-xl font-semibold text-ink">= {result}</span>
                    <time
                      dateTime={new Date(entry.timestamp).toISOString()}
                      title={new Date(entry.timestamp).toLocaleString()}
                      className="mt-0.5 block text-xs text-muted/80"
                    >
                      {formatTimestamp(entry.timestamp)}
                    </time>
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemove(entry.id)}
                    aria-label={`Delete ${expression} equals ${result}`}
                    title="Delete"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg text-muted/70 transition hover:bg-clear hover:text-clear-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <X aria-hidden="true" className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
