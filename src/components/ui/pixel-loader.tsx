"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface PixelLoaderProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "dots" | "pulse" | "glitch";
  className?: string;
}

const loadingMessages = [
  "Loading memes...",
  "Processing data...",
  "We're on it!",
  "Almost there...",
  "Fetching stuff...",
  "Working magic...",
  "Loading pixels...",
  "Getting ready...",
  "Preparing data...",
  "Loading awesomeness...",
  "Almost done...",
  "Just a sec...",
  "Loading goodies...",
  "Processing...",
  "Getting things ready...",
  "Loading content...",
  "Preparing...",
  "Working on it...",
  "Loading...",
  "Hold tight...",
];

const glitchMessages = [
  "LOADING...",
  "L0AD1NG...",
  "L0ADING...",
  "LOAD1NG...",
  "L0AD1NG...",
  "LOADING...",
];

export function PixelLoader({
  message,
  size = "md",
  variant = "default",
  className = "",
}: PixelLoaderProps) {
  const [currentMessage, setCurrentMessage] = useState(
    message || loadingMessages[0]
  );
  const [glitchIndex, setGlitchIndex] = useState(0);

  // Rotate through messages if no specific message provided
  useEffect(() => {
    if (message) return;

    const interval = setInterval(() => {
      setCurrentMessage((prev) => {
        const currentIndex = loadingMessages.indexOf(prev);
        return loadingMessages[(currentIndex + 1) % loadingMessages.length];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [message]);

  // Glitch effect for glitch variant
  useEffect(() => {
    if (variant !== "glitch") return;

    const interval = setInterval(() => {
      setGlitchIndex((prev) => (prev + 1) % glitchMessages.length);
    }, 150);

    return () => clearInterval(interval);
  }, [variant]);

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const renderLoader = () => {
    switch (variant) {
      case "dots":
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-primary rounded-full animate-pulse"
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    animationDuration: "1s",
                  }}
                />
              ))}
            </div>
            <span
              className={`font-pixelify-sans ${sizeClasses[size]} text-foreground`}
            >
              {currentMessage}
            </span>
          </div>
        );

      case "pulse":
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className={`${iconSizes[size]} bg-primary rounded-full animate-ping opacity-75`}
              />
              <div
                className={`absolute top-0 left-0 ${iconSizes[size]} bg-primary rounded-full`}
              />
            </div>
            <span
              className={`font-pixelify-sans ${sizeClasses[size]} text-foreground animate-pulse`}
            >
              {currentMessage}
            </span>
          </div>
        );

      case "glitch":
        return (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Loader2
                className={`${iconSizes[size]} text-primary animate-spin`}
              />
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
            </div>
            <span
              className={`font-pixelify-sans ${sizeClasses[size]} text-foreground font-bold tracking-wider`}
            >
              {glitchMessages[glitchIndex]}
            </span>
          </div>
        );

      default:
        return (
          <div className="flex items-center gap-3">
            <Loader2
              className={`${iconSizes[size]} text-primary animate-spin`}
            />
            <span
              className={`font-pixelify-sans ${sizeClasses[size]} text-foreground`}
            >
              {currentMessage}
            </span>
          </div>
        );
    }
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      {renderLoader()}
    </div>
  );
}

// Specialized loaders for different contexts
export function MemeLoader({ className = "" }: { className?: string }) {
  return (
    <PixelLoader
      message="Loading memes..."
      variant="dots"
      size="md"
      className={className}
    />
  );
}

export function DataLoader({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <PixelLoader
      message="Processing data..."
      variant="pulse"
      size={size}
      className={className}
    />
  );
}

export function ApiLoader({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <PixelLoader
      message="We're on it!"
      variant="default"
      size={size}
      className={className}
    />
  );
}

export function GlitchLoader({ className = "" }: { className?: string }) {
  return <PixelLoader variant="glitch" size="lg" className={className} />;
}

// Loading overlay component
export function LoadingOverlay({
  isLoading,
  message,
  children,
}: {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
        <div className="bg-card/90 border rounded-lg p-6 shadow-lg">
          <PixelLoader message={message} variant="pulse" size="lg" />
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
export function LoadingSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted/50 rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}
