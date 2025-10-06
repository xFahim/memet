"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  length?: number;
  onComplete?: (pin: string) => void;
  className?: string;
}

export function PinInput({ length = 4, onComplete, className }: PinInputProps) {
  const [pin, setPin] = useState<string[]>(new Array(length).fill(""));
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (pin.every((digit) => digit !== "") && onComplete) {
      onComplete(pin.join(""));
    }
  }, [pin, onComplete]);

  // Auto-focus the first input when component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Move to next input if value is entered
    if (value && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (pin[index]) {
        // Clear current input
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      } else if (index > 0) {
        // Move to previous input
        setActiveIndex(index - 1);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      setActiveIndex(index - 1);
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);

    if (pastedData.length > 0) {
      const newPin = [...pin];
      for (let i = 0; i < pastedData.length && i < length; i++) {
        newPin[i] = pastedData[i];
      }
      setPin(newPin);

      const nextIndex = Math.min(pastedData.length, length - 1);
      setActiveIndex(nextIndex);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={cn("flex gap-3 justify-center", className)}>
      {pin.map((digit, index) => (
        <div key={index} className="relative">
          <input
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={digit}
            onChange={(e) => handleInputChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={() => setActiveIndex(index)}
            className={cn(
              "w-12 h-12 text-center text-lg font-medium rounded-lg border-2 transition-all duration-200",
              "bg-background border-border text-foreground",
              "focus:outline-none focus:ring-0",
              digit
                ? "border-primary bg-primary/5"
                : activeIndex === index
                ? "border-accent bg-accent/5"
                : "border-border hover:border-muted-foreground/50"
            )}
            maxLength={1}
          />
          {/* Dash indicator */}
          {!digit && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-6 h-0.5 bg-muted-foreground/30 rounded-full" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
