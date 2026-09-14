import { useLayoutEffect, useRef } from 'react';
import {
  AppCurrency,
  caretFromDigitCount,
  countDigits,
  formatAmountInput,
  sanitizeAmountInput,
} from '../lib/currency';

interface Props {
  value: string | number;
  onChange: (raw: string) => void;
  currency?: string | AppCurrency | null;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

const DEFAULT_CLASS =
  'w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder-gray-500';

export default function MoneyInput({ value, onChange, currency, className, placeholder, required }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digitCaret = useRef<number | null>(null);
  const raw = sanitizeAmountInput(String(value ?? ''), currency);
  const formatted = formatAmountInput(raw, currency);

  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el || digitCaret.current == null) return;
    const pos = caretFromDigitCount(formatted, digitCaret.current);
    el.setSelectionRange(pos, pos);
    digitCaret.current = null;
  }, [formatted]);

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode={currency === 'UGX' ? 'numeric' : 'decimal'}
      required={required}
      value={formatted}
      placeholder={placeholder}
      onChange={e => {
        digitCaret.current = countDigits(e.target.value.slice(0, e.target.selectionStart ?? e.target.value.length));
        onChange(sanitizeAmountInput(e.target.value, currency));
      }}
      className={className || DEFAULT_CLASS}
    />
  );
}
