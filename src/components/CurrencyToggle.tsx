import { AppCurrency } from '../lib/currency';

interface Props {
  value: AppCurrency;
  onChange: (currency: AppCurrency) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export default function CurrencyToggle({ value, onChange, disabled, size = 'md' }: Props) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  return (
    <div className="inline-flex bg-dusk border border-steel rounded-xl p-0.5" role="group" aria-label="Currency">
      {(['USD', 'UGX'] as const).map(code => (
        <button
          key={code}
          type="button"
          disabled={disabled}
          onClick={() => onChange(code)}
          className={`${pad} rounded-lg font-semibold transition-all disabled:opacity-40 ${
            value === code
              ? 'bg-snow text-ink'
              : 'text-mist hover:text-snow'
          }`}
        >
          {code === 'USD' ? 'USD $' : 'UGX'}
        </button>
      ))}
    </div>
  );
}
