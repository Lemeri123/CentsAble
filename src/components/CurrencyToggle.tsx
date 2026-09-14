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
    <div className="inline-flex bg-gray-800 border border-gray-700 rounded-xl p-0.5" role="group" aria-label="Currency">
      {(['USD', 'UGX'] as const).map(code => (
        <button
          key={code}
          type="button"
          disabled={disabled}
          onClick={() => onChange(code)}
          className={`${pad} rounded-lg font-semibold transition-all disabled:opacity-40 ${
            value === code
              ? 'bg-emerald-500 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          {code === 'USD' ? 'USD $' : 'UGX'}
        </button>
      ))}
    </div>
  );
}
