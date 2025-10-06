"use client";

import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface HighlighterProps {
  children: React.ReactNode;
  action?: "underline" | "highlight" | "strike";
  color?: string;
  className?: string;
  delay?: number;
}

export function Highlighter({
  children,
  action = "underline",
  color = "#FFD700",
  className,
  delay = 0,
}: HighlighterProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  const getActionStyles = () => {
    switch (action) {
      case "underline":
        return {
          background: `linear-gradient(120deg, ${color} 0%, ${color} 100%)`,
          backgroundPosition: "0 100%",
          backgroundRepeat: "no-repeat",
          transition: "background-size 0.3s ease-in-out",
          backgroundSize: isVisible ? "100% 0.1em" : "0% 0.1em",
        };
      case "highlight":
        return {
          background: isVisible ? color : "transparent",
          transition: "background-color 0.3s ease-in-out",
        };
      case "strike":
        return {
          position: "relative" as const,
          "&::after": {
            content: '""',
            position: "absolute",
            top: "50%",
            left: 0,
            right: 0,
            height: "2px",
            background: color,
            transform: isVisible ? "scaleX(1)" : "scaleX(0)",
            transformOrigin: "left",
            transition: "transform 0.3s ease-in-out",
          },
        };
      default:
        return {};
    }
  };

  return (
    <span
      ref={ref}
      className={cn("inline-block", className)}
      style={getActionStyles()}
    >
      {children}
    </span>
  );
}
