import { Keyboard } from 'lucide-react';
import type { CalculatorMode } from '../types/calculator';
import { SCIENTIFIC_SHORTCUT_HELP, SHORTCUT_HELP } from '../utils/keymap';

export function KeyboardHint({ mode }: { mode: CalculatorMode }) {
  const rows = mode === 'scientific' ? [...SHORTCUT_HELP, ...SCIENTIFIC_SHORTCUT_HELP] : SHORTCUT_HELP;
  return (
    <details className="group mt-4 hidden text-sm text-muted sm:block">
      <summary className="mx-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1 transition hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
        <Keyboard aria-hidden="true" className="h-4 w-4" />
        Keyboard shortcuts
      </summary>
      <dl className="animate-expand mt-3 grid grid-cols-2 gap-x-4 gap-y-2 rounded-2xl border border-line/60 bg-soft p-3 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-2">
            <dt className="flex flex-wrap gap-1">
              {row.keys.map((key) => (
                <kbd
                  key={key}
                  className="rounded-md border border-line bg-card px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink shadow-key"
                >
                  {key}
                </kbd>
              ))}
            </dt>
            <dd className="text-right">{row.label}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
