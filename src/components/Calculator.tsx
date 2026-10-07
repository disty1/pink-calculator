import { useCallback, useEffect, useRef, useState } from 'react';
import type { AngleMode, CalcAction, CalculatorMode } from '../types/calculator';
import type { useCalculator } from '../hooks/useCalculator';
import { useCopyToClipboard } from '../hooks/useCopyToClipboard';
import { useKeyboard } from '../hooks/useKeyboard';
import { actionId, MAIN_KEYS, QUICK_KEYS, SCIENTIFIC_KEYS } from '../utils/buttons';
import { CalculatorButton } from './CalculatorButton';
import { Display } from './Display';
import { KeyboardHint } from './KeyboardHint';
import { ScientificPanel } from './ScientificPanel';

interface CalculatorProps {
  calc: ReturnType<typeof useCalculator>;
  mode: CalculatorMode;
  angleMode: AngleMode;
  onAngleModeChange: (mode: AngleMode) => void;
}

export function Calculator({ calc, mode, angleMode, onAngleModeChange }: CalculatorProps) {
  const { state, press, value, expressionText } = calc;
  const { copied, copy } = useCopyToClipboard();
  const [flashId, setFlashId] = useState<string | null>(null);
  const flashTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(flashTimer.current), []);

  const handleKey = useCallback(
    (action: CalcAction) => {
      press(action);
      setFlashId(actionId(action));
      window.clearTimeout(flashTimer.current);
      flashTimer.current = window.setTimeout(() => setFlashId(null), 130);
    },
    [press],
  );
  useKeyboard(handleKey, mode);

  const scientific = mode === 'scientific';

  return (
    <section
      aria-label="Calculator"
      className="animate-pop-in rounded-3xl border border-line/70 bg-card/80 p-4 shadow-card backdrop-blur-xl sm:p-6"
    >
      <Display
        expression={expressionText}
        value={value}
        error={state.error}
        evaluated={state.justEvaluated}
        errorTick={state.errorTick}
        evalTick={state.evalTick}
        angleMode={scientific ? angleMode : null}
        copied={copied}
        onCopy={() => void copy(value.replace(/−/g, '-'))}
      />

      <div className="mt-4 space-y-3" data-calc-pad>
        {scientific && (
          <ScientificPanel
            keys={SCIENTIFIC_KEYS}
            onPress={press}
            flashId={flashId}
            angleMode={angleMode}
            onAngleModeChange={onAngleModeChange}
          />
        )}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
          {QUICK_KEYS.map((def) => (
            <CalculatorButton key={def.id} def={def} onPress={press} flash={flashId === def.id} />
          ))}
        </div>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {MAIN_KEYS.map((def) => (
            <CalculatorButton key={def.id} def={def} onPress={press} flash={flashId === def.id} />
          ))}
        </div>
      </div>

      <KeyboardHint mode={mode} />
    </section>
  );
}
