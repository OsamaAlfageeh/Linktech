import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface OTPInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  className?: string;
}

export function OTPInput({ 
  value, 
  onChange, 
  length = 6, 
  disabled = false,
  className 
}: OTPInputProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize input refs array
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus the first empty input or the last input
  useEffect(() => {
    const firstEmptyIndex = value.length;
    const targetIndex = Math.min(firstEmptyIndex, length - 1);
    
    if (inputRefs.current[targetIndex]) {
      inputRefs.current[targetIndex]?.focus();
      setActiveIndex(targetIndex);
    }
  }, [value, length]);

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow single digit
    if (inputValue.length > 1) {
      inputValue = inputValue.slice(-1);
    }

    // Only allow numbers
    if (!/^\d*$/.test(inputValue)) {
      return;
    }

    const newValue = value.split('');
    newValue[index] = inputValue;
    
    // Join and limit to length
    const updatedValue = newValue.join('').slice(0, length);
    onChange(updatedValue);

    // Move to next input if current is filled
    if (inputValue && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setActiveIndex(index + 1);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current input is empty, move to previous input
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          prevInput.focus();
          setActiveIndex(index - 1);
        }
      } else {
        // Clear current input
        const newValue = value.split('');
        newValue[index] = '';
        onChange(newValue.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
        setActiveIndex(index - 1);
      }
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setActiveIndex(index + 1);
      }
    } else if (e.key === 'Delete') {
      const newValue = value.split('');
      newValue[index] = '';
      onChange(newValue.join(''));
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    
    if (pastedData.length > 0) {
      onChange(pastedData);
      
      // Focus the next empty input or the last input
      const nextEmptyIndex = Math.min(pastedData.length, length - 1);
      const nextInput = inputRefs.current[nextEmptyIndex];
      if (nextInput) {
        nextInput.focus();
        setActiveIndex(nextEmptyIndex);
      }
    }
  };

  const handleFocus = (index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }, (_, index) => (
        <Input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => handleFocus(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-xl font-bold border-2 transition-all duration-200",
            "focus:ring-2 focus:ring-primary focus:border-primary",
            activeIndex === index 
              ? "border-primary bg-primary/5 shadow-md" 
              : "border-neutral-300 hover:border-neutral-400",
            value[index] 
              ? "border-green-500 bg-green-50 text-green-700" 
              : "",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          autoComplete="one-time-code"
        />
      ))}
    </div>
  );
}
