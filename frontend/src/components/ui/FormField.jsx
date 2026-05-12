import React, { useId } from 'react';

export default function FormField({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className = '',
  labelClassName = 'text-sm font-bold text-surface-600 dark:text-surface-300 mb-1 flex items-center gap-2',
}) {
  const autoId = useId().replace(/:/g, '');
  const id = htmlFor || `field-${autoId}`;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  const child = React.Children.only(children);
  const merged = React.cloneElement(child, {
    id,
    invalid: error ? true : child.props.invalid,
    'aria-invalid': error ? true : child.props['aria-invalid'],
    'aria-describedby': describedBy || undefined,
    required: required !== undefined ? required : child.props.required,
  });

  return (
    <div className={`space-y-1 ${className}`.trim()}>
      {label != null && label !== false && (
        <label htmlFor={id} className={labelClassName}>
          {label}
          {required ? (
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      )}
      {hint ? (
        <p id={hintId} className="text-xs text-surface-500 dark:text-surface-400 -mt-0.5 mb-0.5">
          {hint}
        </p>
      ) : null}
      {merged}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
