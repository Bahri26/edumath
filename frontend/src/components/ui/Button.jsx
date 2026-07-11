import React from 'react';

const variants = {
  primary:
    'bg-brand-600 text-white hover:bg-brand-700 shadow-md shadow-brand-600/20 active:scale-[0.98]',
  secondary:
    'bg-surface-100 text-surface-700 hover:bg-surface-200 dark:bg-surface-700 dark:text-surface-200 dark:hover:bg-surface-600',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/15 active:scale-[0.98]',
  danger: 'bg-rose-600 text-white hover:bg-rose-700',
  outline:
    'border border-surface-300 text-surface-700 hover:bg-surface-50 dark:border-surface-600 dark:text-surface-200 dark:hover:bg-surface-700',
  soft:
    'bg-teal-50 text-teal-800 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-200 dark:hover:bg-teal-900/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-sm rounded-lg min-h-[36px]',
  md: 'px-4 py-2 text-sm rounded-xl min-h-[44px]',
  lg: 'px-5 py-2.5 text-base rounded-xl min-h-[48px]',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  fullWidth = false,
  icon: Icon,
  onClick,
  disabled,
  type = 'button',
  ariaLabel,
  title,
}) => {
  const base =
    'font-semibold tracking-tight transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--edu-ring)] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-surface-900 inline-flex items-center justify-center gap-2';
  const width = fullWidth ? 'w-full' : '';
  const variantCls = variants[variant] || variants.primary;
  const sizeCls = sizes[size] || sizes.md;
  return (
    <button
      type={type}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizeCls} ${variantCls} ${width} ${disabled ? 'opacity-50 cursor-not-allowed shadow-none' : ''} ${className}`}
    >
      {Icon && <Icon size={18} aria-hidden />}
      {children}
    </button>
  );
};

export default Button;
