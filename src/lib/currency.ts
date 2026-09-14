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
