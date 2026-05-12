import React, { forwardRef } from 'react';

const baseClass =
  'w-full px-4 py-3 rounded-xl border bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-white ' +
  'outline-none transition-colors shadow-sm ' +
  'focus:ring-2 focus:ring-brand-500 focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-100 dark:disabled:bg-surface-800';

const Input = forwardRef(function Input(
  { className = '', invalid, type = 'text', ...props },
  ref,
) {
  const { className: propsClassName = '', ...inputProps } = props;
  return (
    <input
      ref={ref}
      {...inputProps}
      type={type}
      aria-invalid={invalid ? true : inputProps['aria-invalid']}
      className={`${baseClass} border-surface-200 dark:border-surface-600 ${
        invalid ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''
      } ${propsClassName} ${className}`.trim()}
    />
  );
});

export default Input;
