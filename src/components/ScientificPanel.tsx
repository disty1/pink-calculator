import type { AngleMode, ButtonDef, CalcAction } from '../types/calculator';
import { CalculatorButton } from './CalculatorButton';

interface ScientificPanelProps {
  keys: ButtonDef[];
  onPress: (action: CalcAction) => void;
  flashId: string | null;
  angleMode: AngleMode;
  onAngleModeChange: (mode: AngleMode) => void;
}

const ANGLE_OPTIONS: { value: AngleMode; label: string; aria: string }[] = [
  { value: 'deg', label: 'DEG', aria: 'Degrees' },
  { value: 'rad', label: 'RAD', aria: 'Radians' },
];

export function ScientificPanel({ keys, onPress, flashId, angleMode, onAngleModeChange }: ScientificPanelProps) {
  return (
    <div className="animate-expand space-y-2.5" data-testid="scientific-panel">
      <div role="group" aria-label="Angle unit" className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">Angle</span>
        <div className="flex rounded-full border border-line bg-soft p-0.5">
          {ANGLE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={angleMode === option.value}
              aria-label={option.aria}
              onClick={() => onAngleModeChange(option.value)}
              className={`rounded-full px-3.5 py-1 text-xs font-bold tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                angleMode === option.value ? 'bg-op text-white shadow-key' : 'text-muted hover:text-brand'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-2">
        {keys.map((def) => (
          <CalculatorButton key={def.id} def={def} onPress={onPress} flash={flashId === def.id} />
        ))}
      </div>
    </div>
  );
}
