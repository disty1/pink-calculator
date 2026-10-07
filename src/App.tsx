import { useCallback } from 'react';
import { Calculator as CalculatorIcon } from 'lucide-react';
import { Calculator } from './components/Calculator';
import { History } from './components/History';
import { ModeToggle } from './components/ModeToggle';
import { ThemeToggle } from './components/ThemeToggle';
import { useCalculator } from './hooks/useCalculator';
import { useHistory } from './hooks/useHistory';
import { usePersistentState } from './hooks/usePersistentState';
import { useTheme } from './hooks/useTheme';
import type { AngleMode, CalculatorMode } from './types/calculator';
import { parseAngle, parseMode, STORAGE_KEYS } from './utils/storage';

export default function App() {
  const { theme, toggleTheme } = useTheme();
  const [mode, setMode] = usePersistentState<CalculatorMode>(STORAGE_KEYS.mode, 'basic', parseMode);
  const [angleMode, setAngleMode] = usePersistentState<AngleMode>(STORAGE_KEYS.angle, 'deg', parseAngle);
  const history = useHistory();
  const calc = useCalculator({ angleMode, onCommit: history.add });
  const { press } = calc;

  const recall = useCallback((value: string) => press({ type: 'recall', value }), [press]);

  return (
    <div className="relative min-h-dvh overflow-x-clip">
      {/* Decorative background */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-page to-[rgb(var(--bg-2))]">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-pink-300/50 blur-3xl dark:bg-pink-700/20" />
        <div className="absolute -right-20 top-1/4 h-80 w-80 rounded-full bg-rose-200/60 blur-3xl dark:bg-rose-800/20" />
        <div className="absolute -bottom-32 left-1/4 h-96 w-96 rounded-full bg-fuchsia-200/50 blur-3xl dark:bg-fuchsia-800/20" />
      </div>

      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-3 pb-8 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pt-8">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:mb-8">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-logo text-white shadow-glow">
              <CalculatorIcon aria-hidden="true" className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight">PinkCalc</h1>
              <p className="text-sm text-muted">Smart • Simple • Beautiful</p>
            </div>
          </div>
          <div className="order-3 w-full sm:order-2 sm:ml-auto sm:w-64">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>
          <div className="order-2 sm:order-3">
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </header>

        <main className="flex flex-1 items-start justify-center">
          <div className="grid w-full max-w-md grid-cols-1 gap-5 lg:max-w-none lg:grid-cols-[minmax(0,28rem)_minmax(0,24rem)] lg:items-stretch lg:justify-center lg:gap-6">
            <Calculator calc={calc} mode={mode} angleMode={angleMode} onAngleModeChange={setAngleMode} />
            <History entries={history.entries} onRecall={recall} onRemove={history.remove} onClear={history.clear} />
          </div>
        </main>

        <footer className="mt-8 text-center text-xs text-muted">
          Your history and settings are saved only in this browser.
        </footer>
      </div>
    </div>
  );
}
