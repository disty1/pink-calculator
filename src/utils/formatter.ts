const NUMBER_PARTS = /^([−-]?)(\d*)(\.\d*)?(E[+\-−]?\d*)?$/;

const groupDigits = (digits: string): string => digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const parseRaw = (raw: string): number => Number(raw.replace(/−/g, '-'));

function trimMantissa(mantissa: string): string {
  return mantissa.includes('.') ? mantissa.replace(/\.?0+$/, '') : mantissa;
}

function toExponentialText(n: number, fractionDigits: number): string {
  const [mantissa, exponent] = n.toExponential(fractionDigits).split('e');
  return `${trimMantissa(mantissa)}E${exponent}`.replace(/-/g, '−');
}

/**
 * Canonical string for a computed value: 15 significant digits (hides float
 * noise like 0.1+0.2), `−` for negatives, `E` notation for very large/small.
 */
export function toExpressionNumber(value: number): string {
  let n = Object.is(value, -0) ? 0 : value;
  if (!Number.isSafeInteger(n)) {
    const rounded = Number(n.toPrecision(15));
    if (Number.isFinite(rounded)) n = rounded; // 15-digit rounding can overflow near MAX_VALUE
  }
  const abs = Math.abs(n);
  if (!Number.isSafeInteger(n) && abs !== 0 && (abs >= 1e15 || abs < 1e-6)) {
    const text = toExponentialText(n, 14);
    // Rounded text must still parse as a finite number (matters right at MAX_VALUE).
    return Number.isFinite(parseRaw(text)) ? text : toExponentialText(n, 16);
  }
  return String(n).replace(/-/g, '−');
}

/** Adds thousands separators to a raw number string, preserving what is being typed (e.g. `1,234.`). */
export function formatNumberText(raw: string): string {
  const match = NUMBER_PARTS.exec(raw);
  if (!match) return raw;
  const [, sign, integer, fraction = '', exponent = ''] = match;
  return sign.replace('-', '−') + groupDigits(integer) + fraction + exponent.replace('-', '−');
}

/**
 * Formats a raw value for the main display. Lossless shortening comes first
 * (dropping thousands separators); rounding / scientific notation is only used
 * when the value still doesn't fit `maxLength` characters.
 */
export function formatDisplayValue(raw: string, maxLength = 17): string {
  const grouped = formatNumberText(raw);
  if (grouped.length <= maxLength) return grouped;
  const ungrouped = grouped.replace(/,/g, '');
  if (ungrouped.length <= maxLength) return ungrouped;

  const n = parseRaw(raw);
  if (!Number.isFinite(n)) return ungrouped;

  const abs = Math.abs(n);
  const needsExponent = Number.isInteger(n) || abs >= 1e15 || (abs !== 0 && abs < 1e-6);
  if (needsExponent) return formatNumberText(toExponentialText(n, 9));

  for (let precision = 14; precision >= 6; precision--) {
    const shortened = formatNumberText(toExpressionNumber(Number(n.toPrecision(precision))));
    if (shortened.length <= maxLength) return shortened;
  }
  return formatNumberText(toExponentialText(n, 9));
}

/** Readable version of a raw expression: grouped digits and spaced binary operators. */
export function prettifyExpression(expr: string): string {
  const pretty = expr.replace(
    /((?:\d+\.?\d*|\.\d+)(?:E[+−-]?\d*)?)|([+−×÷^])/g,
    (_match, number: string | undefined, operator: string | undefined, offset: number) => {
      if (number) return formatNumberText(number);
      const isBinary = offset > 0 && /[\d.)!%πe]/.test(expr[offset - 1]);
      return isBinary ? ` ${operator} ` : (operator as string);
    },
  );
  return pretty.trim();
}

/** Tailwind font-size class that keeps long values inside the display. */
export function valueSizeClass(length: number): string {
  if (length <= 8) return 'text-5xl sm:text-6xl';
  if (length <= 11) return 'text-4xl sm:text-5xl';
  if (length <= 14) return 'text-3xl sm:text-4xl';
  return 'text-2xl sm:text-3xl';
}

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const dateTimeFormat = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatTimestamp(timestamp: number, now: number = Date.now()): string {
  const diff = now - timestamp;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min ago`;
  const date = new Date(timestamp);
  return date.toDateString() === new Date(now).toDateString()
    ? timeFormat.format(date)
    : dateTimeFormat.format(date);
}
