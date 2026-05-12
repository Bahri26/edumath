import React, { forwardRef } from 'react';

const baseClass =
  'w-full px-4 py-3 rounded-xl border bg-surface-50 dark:bg-surface-900 text-surface-800 dark:text-white ' +
  'outline-none transition-colors shadow-sm resize-y min-h-[6rem] ' +
  'focus:ring-2 focus:ring-brand-500 focus:border-transparent ' +
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-surface-100 dark:disabled:bg-surface-800';

const Textarea = forwardRef(function Textarea(
  { className = '', invalid, rows = 4, ...props },
  ref,
) {
  const { className: propsClassName = '', ...areaProps } = props;
  return (
    <textarea
      ref={ref}
      {...areaProps}
      rows={rows}
      aria-invalid={invalid ? true : areaProps['aria-invalid']}
      className={`${baseClass} border-surface-200 dark:border-surface-600 ${
        invalid ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : ''
      } ${propsClassName} ${className}`.trim()}
    />
  );
});

export default Textarea;
