import { memo } from 'react';
import { Delete } from 'lucide-react';
import type { ButtonDef, ButtonVariant, CalcAction } from '../types/calculator';

const ICONS = { delete: Delete } as const;

const BASE =
  'relative flex select-none touch-manipulation items-center justify-center font-semibold tabular-nums ' +
  'transition-all duration-150 ease-out active:translate-y-0 active:scale-95 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-card';

const LARGE = 'h-14 rounded-2xl text-xl sm:h-16 sm:text-2xl';
const SMALL = 'h-11 rounded-xl text-sm sm:h-12 sm:text-base';

const VARIANTS: Record<ButtonVariant, string> = {
  digit: `${LARGE} bg-key text-key-ink shadow-key hover:-translate-y-0.5 hover:shadow-key-hover`,
  function: `${LARGE} bg-fn text-fn-ink shadow-key hover:-translate-y-0.5 hover:shadow-key-hover`,
  clear: `${LARGE} bg-clear text-clear-ink shadow-key hover:-translate-y-0.5 hover:shadow-key-hover`,
  operator: `${LARGE} bg-op text-white shadow-key hover:-translate-y-0.5 hover:bg-op-hover hover:shadow-key-hover`,
  equals: `${LARGE} bg-equals text-white shadow-glow hover:-translate-y-0.5 hover:brightness-110`,
  scientific: `${SMALL} border border-line bg-sci font-medium text-sci-ink hover:-translate-y-0.5 hover:bg-fn`,
};

interface CalculatorButtonProps {
  def: ButtonDef;
  onPress: (action: CalcAction) => void;
  /** Briefly highlighted, e.g. when triggered from the keyboard. */
  flash?: boolean;
}

function CalculatorButtonBase({ def, onPress, flash = false }: CalculatorButtonProps) {
  const Icon = def.icon ? ICONS[def.icon] : null;
  return (
    <button
      type="button"
      aria-label={def.ariaLabel}
      data-key={def.id}
      className={`${BASE} ${VARIANTS[def.variant]} ${flash ? 'scale-95 brightness-90' : ''}`}
      onClick={() => onPress(def.action)}
    >
      {Icon ? <Icon aria-hidden="true" className="h-6 w-6" /> : def.label}
    </button>
  );
}

export const CalculatorButton = memo(CalculatorButtonBase);
