"use client";

import { useRouter } from "next/navigation";
import { MemberAvatar } from "@/components/member-avatar";
import { WordRotate } from "@/components/ui/word-rotate";
import { LightRays } from "@/components/ui/light-rays";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { useState } from "react";

const members = [
  {
    id: 1,
    name: "nabi",
    avatar: "/nabi.jpeg",
  },
  {
    id: 2,
    name: "anik",
    avatar: "/anik.jpeg",
  },
  {
    id: 3,
    name: "musta",
    avatar: "/musta.jpeg",
  },
  {
    id: 4,
    name: "sargie",
    avatar: "/sargie.jpeg",
  },
  {
    id: 5,
    name: "god",
    avatar: "/god.jpeg",
  },
];

export default function Home() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);

  const handleMemberSelect = (memberId: number) => {
    const selectedMemberData = members.find((member) => member.id === memberId);

    if (selectedMemberData) {
      setIsNavigating(true);
      setNavigatingTo(selectedMemberData.name);

      // Navigate directly to user page for all members including god
      router.push(`/user/${selectedMemberData.name}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <LightRays />
      {/* Logo */}
      <div className="mb-5">
        <div className="flex flex-col items-center">
          <img
            src="/logo.png"
            alt="Memet Logo"
            className="w-28 h-28 md:w-36 md:h-36 -mb-4"
          />
          <h1 className="font-pixelify-sans text-6xl md:text-8xl font-medium text-foreground text-center">
            memet
          </h1>
        </div>
        <div className="w-32 h-1 bg-gradient-to-r from-primary to-accent mx-auto mt-4 rounded-full" />
      </div>

      {/* Main Content */}
      <div className="max-w-4xl w-full">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="text-3xl md:text-4xl font-bebas-neue text-foreground mb-4">
            <WordRotate
              duration={2500}
              words={["Pick Your Character"]}
              className="text-3xl md:text-4xl text-foreground"
            />
          </div>
        </div>

        {/* Member Selection Grid */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8 max-w-5xl mx-auto">
          {members.map((member) => (
            <MemberAvatar
              key={member.id}
              name={member.name}
              avatar={member.avatar}
              onClick={() => handleMemberSelect(member.id)}
              isSelected={false}
            />
          ))}
        </div>

        {/* Navigation Loading State */}
        {isNavigating && (
          <div className="mt-8 text-center">
            <PixelLoader
              message={`Loading ${navigatingTo}...`}
              variant="pulse"
              size="lg"
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8">
        <p className="text-sm text-muted-foreground text-center">
          made with ❤️ for thesis ig
        </p>
      </div>
    </div>
  );
}
