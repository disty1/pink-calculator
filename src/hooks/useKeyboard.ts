import { useEffect, useRef } from 'react';
import type { CalcAction, CalculatorMode } from '../types/calculator';
import { mapKey } from '../utils/keymap';

/** Global calculator keyboard shortcuts. */
export function useKeyboard(onAction: (action: CalcAction) => void, mode: CalculatorMode): void {
  const latest = useRef({ onAction, mode });
  useEffect(() => {
    latest.current = { onAction, mode };
  });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;
      if (target instanceof HTMLElement) {
        if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
        // Enter on a control the user tabbed to should activate it.
        if ((event.key === 'Enter' || event.key === ' ') && target.closest('button, a, summary, [role="button"]')) return;
      }

      const mapped = mapKey(event.key);
      if (!mapped || (mapped.scientific && latest.current.mode !== 'scientific')) return;

      event.preventDefault(); // e.g. "/" opens quick-find in Firefox, Backspace may navigate back
      latest.current.onAction(mapped.action);
    };
    // Buttons don't keep focus after a mouse/touch press, so Enter still means "="
    // afterwards. (Keyboard users can still Tab to a button and press Enter on it.)
    const keepFocusOffButtons = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('button')) event.preventDefault();
    };
    window.addEventListener('keydown', handler);
    window.addEventListener('mousedown', keepFocusOffButtons);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('mousedown', keepFocusOffButtons);
    };
  }, []);
}
