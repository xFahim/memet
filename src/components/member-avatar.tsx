"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import Image from "next/image";

interface MemberAvatarProps {
  name: string;
  avatar: string;
  onClick: () => void;
  isSelected?: boolean;
}

export function MemberAvatar({
  name,
  avatar,
  onClick,
  isSelected = false,
}: MemberAvatarProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        "group relative cursor-pointer transition-all duration-300 ease-in-out",
        "transform hover:scale-105 active:scale-95"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Container */}
      <div
        className={cn(
          "relative w-32 h-32 rounded-full border-4 transition-all duration-300",
          "bg-card border-border shadow-lg",
          isSelected
            ? "border-primary shadow-primary/20 shadow-xl"
            : "hover:border-accent hover:shadow-accent/20 hover:shadow-xl",
          isHovered && "shadow-2xl"
        )}
      >
        {/* Avatar Image */}
        <div className="w-full h-full rounded-full overflow-hidden">
          <Image
            src={avatar}
            alt={name}
            width={128}
            height={128}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center border-2 border-background">
            <div className="w-3 h-3 bg-primary-foreground rounded-full" />
          </div>
        )}
      </div>

      {/* Name with Dual Fonts */}
      <div className="mt-4 text-center">
        {/* First name in Bowlby One SC */}
        <h3
          className={cn(
            "font-bowlby-one-sc text-xl transition-colors duration-300",
            isSelected
              ? "text-primary"
              : "text-foreground group-hover:text-accent"
          )}
        >
          {name}
        </h3>
        {/* Second name in Pixelify Sans */}
        <h4
          className={cn(
            "font-pixelify-sans text-sm font-medium transition-colors duration-300 -mt-1",
            isSelected
              ? "text-primary/80"
              : "text-muted-foreground group-hover:text-accent/80"
          )}
        >
          {name}
        </h4>
      </div>

      {/* Hover Effect Overlay */}
      <div
        className={cn(
          "absolute inset-0 rounded-full transition-opacity duration-300 pointer-events-none",
          "bg-gradient-to-br from-primary/10 to-accent/10",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
}
