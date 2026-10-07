import type { CalculatorMode } from '../types/calculator';

const OPTIONS: { value: CalculatorMode; label: string }[] = [
  { value: 'basic', label: 'Basic' },
  { value: 'scientific', label: 'Scientific' },
];

export function ModeToggle({ mode, onChange }: { mode: CalculatorMode; onChange: (mode: CalculatorMode) => void }) {
  return (
    <div
      role="group"
      aria-label="Calculator mode"
      className="relative grid h-11 grid-cols-2 rounded-2xl border border-line bg-card/80 p-1 shadow-key backdrop-blur"
    >
      <span
        aria-hidden="true"
        className={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-xl bg-op shadow-glow transition-transform duration-300 ease-out ${
          mode === 'scientific' ? 'translate-x-full' : ''
        }`}
      />
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={mode === option.value}
          onClick={() => onChange(option.value)}
          className={`relative z-10 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
            mode === option.value ? 'text-white' : 'text-muted hover:text-brand'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
