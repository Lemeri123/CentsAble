export type AppCurrency = 'USD' | 'UGX';

export function normalizeCurrency(value?: string | null): AppCurrency {
  return value === 'UGX' ? 'UGX' : 'USD';
}

export function formatMoney(amount: number, currency?: string | null): string {
  const c = normalizeCurrency(currency);
  if (c === 'UGX') {
    return `UGX ${Math.round(amount).toLocaleString('en-UG')}`;
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function currencyCode(currency?: string | null): AppCurrency {
  return normalizeCurrency(currency);
}

export function amountStep(currency?: string | null): string {
  return normalizeCurrency(currency) === 'UGX' ? '1' : '0.01';
}

export function sanitizeAmountInput(raw: string, currency?: string | null): string {
  const ugx = normalizeCurrency(currency) === 'UGX';
  const stripped = raw.replace(/,/g, '');
  if (ugx) return stripped.split('.')[0].replace(/\D/g, '');
  const only = stripped.replace(/[^\d.]/g, '');
  const firstDot = only.indexOf('.');
  if (firstDot === -1) return only;
  return only.slice(0, firstDot + 1) + only.slice(firstDot + 1).replace(/\./g, '').slice(0, 2);
}

export function formatAmountInput(raw: string, currency?: string | null): string {
  const cleaned = sanitizeAmountInput(raw, currency);
  if (cleaned === '' || cleaned === '.') return cleaned;
  const ugx = normalizeCurrency(currency) === 'UGX';
  const [intRaw, decRaw] = cleaned.split('.');
  const grouped = intRaw === '' ? (cleaned.startsWith('.') ? '0' : '') : Number(intRaw).toLocaleString('en-US');
  if (ugx) return grouped;
  if (cleaned.includes('.')) return `${grouped || '0'}.${decRaw ?? ''}`;
  return grouped;
}

export function amountFromInput(raw: string | number | null | undefined): number {
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
  const n = Number(String(raw ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function countDigits(value: string): number {
  return (value.match(/\d/g) || []).length;
}

export function caretFromDigitCount(formatted: string, digitCount: number): number {
  if (digitCount <= 0) return 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i += 1) {
    if (/\d/.test(formatted[i])) {
      seen += 1;
      if (seen >= digitCount) return i + 1;
    }
  }
  return formatted.length;
}

