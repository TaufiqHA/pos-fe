import React, { useRef, useEffect, useState } from 'react';
import { formatRibuan, unformatRibuan } from '../lib/utils';

export interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number | '';
  onChange: (value: number) => void;
  allowZero?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  allowZero = false,
  className,
  placeholder,
  ...props
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const getFormattedValue = (val: number | '') => {
    if (val === '' || val === undefined || val === null) return '';
    if (val === 0 && !allowZero) return '';
    return formatRibuan(val);
  };

  const [displayValue, setDisplayValue] = useState(() => getFormattedValue(value));

  // Sync state with parent value changes
  useEffect(() => {
    const formatted = getFormattedValue(value);
    if (formatted !== displayValue) {
      setDisplayValue(formatted);
    }
  }, [value, allowZero]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const cleanNum = unformatRibuan(rawValue);
    const formatted = getFormattedValue(cleanNum);

    // Calculate cursor position before state update
    const input = inputRef.current;
    let digitsBeforeCursor = 0;
    let selectionStart = 0;

    if (input) {
      selectionStart = input.selectionStart || 0;
      const textBeforeCursor = rawValue.substring(0, selectionStart);
      digitsBeforeCursor = textBeforeCursor.replace(/[^0-9]/g, '').length;
    }

    // Update parent and local state
    onChange(cleanNum);
    setDisplayValue(formatted);

    // Restore cursor position in the next tick after DOM update
    if (input) {
      setTimeout(() => {
        if (!input) return;

        let newCursorPosition = 0;
        let digitCount = 0;

        for (let i = 0; i < formatted.length; i++) {
          if (formatted[i] >= '0' && formatted[i] <= '9') {
            digitCount++;
          }
          if (digitCount === digitsBeforeCursor) {
            newCursorPosition = i + 1;
            break;
          }
        }

        if (digitsBeforeCursor === 0) {
          newCursorPosition = 0;
        } else if (digitCount < digitsBeforeCursor) {
          newCursorPosition = formatted.length;
        }

        input.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
};
