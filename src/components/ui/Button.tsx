import { clsx } from 'clsx';

export function Button({ children, variant = 'primary', onClick, disabled = false }: { children: React.ReactNode; variant?: 'primary' | 'secondary' | 'danger'; onClick?: () => void; disabled?: boolean }) {
  return (
    <button
      className={clsx(
        'inline-flex h-9 items-center justify-center rounded-lg px-3 text-[13px] font-bold shadow-sm transition focus:outline-none focus:ring-2 focus:ring-lang-red/20 disabled:cursor-not-allowed disabled:opacity-60',
        variant === 'primary' && 'bg-lang-red text-white hover:bg-lang-redDark',
        variant === 'secondary' && 'border border-lang-line bg-white text-lang-ink hover:bg-gray-50',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700'
      )}
      type="button"
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
