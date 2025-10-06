"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FolderOpen,
  FileText,
  CheckCircle,
  Users,
  TrendingUp,
  Play,
  Trophy,
  Medal,
  Award,
} from "lucide-react";
import {
  PixelLoader,
  DataLoader,
  ApiLoader,
  LoadingOverlay,
  LoadingSkeleton,
} from "@/components/ui/pixel-loader";
import { LightRays } from "@/components/ui/light-rays";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import React from "react";
import { Button } from "@/components/ui/button";

// Types for API data
interface AnnotatorData {
  id: string;
  name: string;
  total_memes_assigned: number;
  completed_annotations: number;
  folders_assigned: string[];
}

interface FolderData {
  id: string;
  name: string;
  bucket: string;
  total_images: number;
  done: number;
  left: number;
  created_at: string;
}

interface ApiResponse {
  annotator: AnnotatorData;
  folders: FolderData[];
}

// Types for leaderboard data
interface LeaderboardOverall {
  total_memes: number;
  completed: number;
  left: number;
  folders: number;
}

interface LeaderboardIndividual {
  annotator: string;
  total_assigned: number;
  completed: number;
}

interface LeaderboardResponse {
  overall: LeaderboardOverall;
  individuals: LeaderboardIndividual[];
}

// Dummy data - fallback when API fails
const userStats = {
  nabi: {
    name: "Nabi",
    folders: [
      {
        name: "Political meme",
        count: 200,
        done: 80,
        left: 120,
        created: "2024-01-15",
        image: "/politics.jpeg",
      },
      {
        name: "Cinema memes",
        count: 250,
        done: 120,
        left: 130,
        created: "2024-01-20",
        image: "/cinema.jpeg",
      },
    ],
    totalAssigned: 450,
    completed: 200,
    percentage: 44,
  },
  anik: {
    name: "Anik",
    folders: [
      {
        name: "Political meme",
        count: 150,
        done: 90,
        left: 60,
        created: "2024-01-10",
        image: "/politics.jpeg",
      },
      {
        name: "Cinema memes",
        count: 100,
        done: 90,
        left: 10,
        created: "2024-01-18",
        image: "/cinema.jpeg",
      },
    ],
    totalAssigned: 250,
    completed: 180,
    percentage: 72,
  },
  musta: {
    name: "Musta",
    folders: [
      {
        name: "Political meme",
        count: 300,
        done: 180,
        left: 120,
        created: "2024-01-12",
        image: "/politics.jpeg",
      },
      {
        name: "Cinema memes",
        count: 200,
        done: 120,
        left: 80,
        created: "2024-01-22",
        image: "/cinema.jpeg",
      },
    ],
    totalAssigned: 500,
    completed: 300,
    percentage: 60,
  },
  sargie: {
    name: "Sargie",
    folders: [
      {
        name: "Political meme",
        count: 180,
        done: 150,
        left: 30,
        created: "2024-01-08",
        image: "/politics.jpeg",
      },
      {
        name: "Cinema memes",
        count: 120,
        done: 100,
        left: 20,
        created: "2024-01-25",
        image: "/cinema.jpeg",
      },
    ],
    totalAssigned: 300,
    completed: 250,
    percentage: 83,
  },
  god: {
    name: "God",
    folders: [
      {
        name: "Political meme",
        count: 1000,
        done: 800,
        left: 200,
        created: "2024-01-01",
        image: "/politics.jpeg",
      },
      {
        name: "Cinema memes",
        count: 500,
        done: 400,
        left: 100,
        created: "2024-01-05",
        image: "/cinema.jpeg",
      },
    ],
    totalAssigned: 1500,
    completed: 1200,
    percentage: 80,
  },
};

const teamStats = {
  totalMemes: 2000,
  totalCompleted: 1000,
  percentage: 50,
  individualStats: [
    { name: "Nabi", completed: 300, total: 500, percentage: 60 },
    { name: "Anik", completed: 180, total: 250, percentage: 72 },
    { name: "Musta", completed: 300, total: 500, percentage: 60 },
    { name: "Sargie", completed: 250, total: 300, percentage: 83 },
    { name: "God", completed: 1200, total: 1500, percentage: 80 },
  ],
};

export default function UserPage() {
  const params = useParams();
  const router = useRouter();
  const userName = params.name as string;
  const userData = userStats[userName as keyof typeof userStats];
  const [selectedFolder, setSelectedFolder] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "leaderboard">(
    "profile"
  );
  const [pin, setPin] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [populateMessage, setPopulateMessage] = useState("");

  // API data state
  const [apiData, setApiData] = useState<ApiResponse | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Leaderboard data state
  const [leaderboardData, setLeaderboardData] =
    useState<LeaderboardResponse | null>(null);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);

  // Fetch user data from API
  useEffect(() => {
    const fetchUserData = async () => {
      if (userName === "god") {
        // Skip API call for god user
        setIsLoadingData(false);
        return;
      }

      try {
        setIsLoadingData(true);
        setDataError(null);

        const response = await fetch(`/api/annotator-summary?name=${userName}`);
        const data = await response.json();

        // Debug logging
        console.log("API Response:", response);
        console.log("API Data:", data);
        console.log("Response OK:", response.ok);
        console.log("Response Status:", response.status);

        if (response.ok) {
          setApiData(data);
        } else {
          setDataError(data.error || "Failed to fetch user data");
        }
      } catch (error) {
        setDataError(error instanceof Error ? error.message : "Unknown error");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchUserData();
  }, [userName]);

  // Fetch leaderboard data
  const fetchLeaderboardData = async () => {
    try {
      setIsLoadingLeaderboard(true);
      setLeaderboardError(null);

      const response = await fetch("/api/leaderboard");
      const data = await response.json();

      if (response.ok) {
        setLeaderboardData(data);
      } else {
        setLeaderboardError(data.error || "Failed to fetch leaderboard data");
      }
    } catch (error) {
      setLeaderboardError(
        error instanceof Error ? error.message : "Unknown error"
      );
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Fetch leaderboard data when leaderboard tab is active
  useEffect(() => {
    if (
      activeTab === "leaderboard" &&
      !leaderboardData &&
      !isLoadingLeaderboard
    ) {
      fetchLeaderboardData();
    }
  }, [activeTab, leaderboardData, isLoadingLeaderboard]);

  // Format date function
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return "Unknown Date";
    }
  };

  // Transform leaderboard data for UI
  const getLeaderboardStats = () => {
    if (!leaderboardData) {
      return teamStats; // fallback to mock data
    }

    const { overall, individuals } = leaderboardData;

    const individualStats = individuals.map((individual) => ({
      name: individual.annotator,
      completed: individual.completed,
      total: individual.total_assigned,
      percentage:
        individual.total_assigned > 0
          ? Math.round((individual.completed / individual.total_assigned) * 100)
          : 0,
    }));

    return {
      totalMemes: overall.total_memes,
      totalCompleted: overall.completed,
      percentage:
        overall.total_memes > 0
          ? Math.round((overall.completed / overall.total_memes) * 100)
          : 0,
      individualStats,
    };
  };

  // Get display data (API data only, no fallback)
  const getDisplayData = () => {
    if (userName === "god") {
      return userData; // Use dummy data for god user only
    }

    if (apiData) {
      // Transform API data to match the expected format
      const totalAssigned = apiData.annotator.total_memes_assigned || 0;
      const completed = apiData.annotator.completed_annotations || 0;
      const percentage =
        totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

      return {
        name: apiData.annotator.name,
        totalAssigned: totalAssigned,
        completed: completed,
        percentage: percentage,
        folders: apiData.folders.map((folder) => ({
          name: folder.name || "Unknown Folder",
          count: folder.total_images || 0,
          done: folder.done || 0,
          left: folder.left || 0,
          created: formatDate(folder.created_at || ""),
          image: "/politics.jpeg", // Default image, could be enhanced later
        })),
      };
    }

    return null; // No fallback data
  };

  const displayData = getDisplayData();

  // Loading state - check this first
  if (isLoadingData && userName !== "god") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <DataLoader size="lg" />
        </div>
      </div>
    );
  }

  // Safety check for displayData - only after loading is complete
  if (!displayData && userName !== "god") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            No data available
          </h1>
          <p className="text-muted-foreground mb-4">
            Unable to load user data from the database.
          </p>
          <Link href="/" className="text-primary hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError && userName !== "god") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            Error loading data
          </h1>
          <p className="text-muted-foreground mb-4">{dataError}</p>
          <Link href="/" className="text-primary hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            User not found
          </h1>
          <Link href="/" className="text-primary hover:underline">
            Go back to home
          </Link>
        </div>
      </div>
    );
  }

  // Type assertion - we know displayData is not null after the checks above
  const safeDisplayData = displayData!;

  const handleFolderSelect = (folderIndex: number) => {
    // Get the folder name from the API data
    const folderName = safeDisplayData.folders[folderIndex]?.name;
    if (folderName) {
      // Navigate to annotation page with user and folder parameters
      router.push(
        `/annotation?user=${encodeURIComponent(
          userName
        )}&folder=${encodeURIComponent(folderName)}`
      );
    }
  };

  const handlePinSubmit = () => {
    if (pin === "1111") {
      setIsAuthenticated(true);
    } else {
      alert("Invalid PIN");
    }
  };

  const handlePopulateAnnotations = async () => {
    setIsLoading(true);
    setPopulateMessage("");

    try {
      const response = await fetch("/api/populate-annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setPopulateMessage(
          `Success! ${data.message}. Inserted: ${data.inserted} records.`
        );
      } else {
        setPopulateMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setPopulateMessage(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!confirm('Migrate files from "Raw Memes" to "raw-memes"?')) return;

    setIsMigrating(true);
    try {
      const res = await fetch("/api/migrate-bucket", { method: "POST" });
      const json = await res.json();
      alert(JSON.stringify(json, null, 2));
    } catch (error) {
      alert(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 relative">
      <LightRays />
      <div className="max-w-6xl mx-auto">
        {/* Greeting */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-7xl font-bebas-neue font-bold text-foreground mb-2">
            Hey,{" "}
            <span className="font-pixelify-sans">{safeDisplayData.name}</span>!
          </h1>
          <Link
            href="/"
            className="text-sm  text-muted-foreground hover:text-foreground transition-colors underline"
          >
            Change who I am
          </Link>
        </div>

        {/* Special UI for God user */}
        {userName === "god" ? (
          <div className="max-w-md mx-auto">
            {!isAuthenticated ? (
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="text-center">Enter PIN</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter PIN"
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground"
                    onKeyPress={(e) => e.key === "Enter" && handlePinSubmit()}
                  />
                  <Button onClick={handlePinSubmit} className="w-full">
                    Submit
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-6">
                <CardHeader>
                  <CardTitle className="text-center">God Mode</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handlePopulateAnnotations}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <PixelLoader
                        message="Populating..."
                        size="sm"
                        variant="pulse"
                      />
                    ) : (
                      "Populate Annotations"
                    )}
                  </Button>
                  <Button
                    onClick={handleMigrate}
                    disabled={isMigrating}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
                  >
                    {isMigrating ? (
                      <PixelLoader
                        message="Migrating..."
                        size="sm"
                        variant="glitch"
                      />
                    ) : (
                      "Migrate Bucket"
                    )}
                  </Button>
                  {populateMessage && (
                    <div
                      className={`p-3 rounded-md text-sm ${
                        populateMessage.includes("Success")
                          ? "bg-green-500/20 text-green-600"
                          : "bg-red-500/20 text-red-600"
                      }`}
                    >
                      {populateMessage}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <>
            {/* Tab Header */}
            <div className="flex justify-center mb-8">
              <div className="flex bg-card/50 rounded-lg p-1 border">
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    activeTab === "profile"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`px-6 py-3 rounded-md font-medium transition-all duration-300 ${
                    activeTab === "leaderboard"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Leaderboard
                </button>
              </div>
            </div>
          </>
        )}

        {/* Tab Content - Only for non-god users */}
        {userName !== "god" && activeTab === "profile" && (
          <>
            {/* Direct Stats Display */}
            <div className="text-center mb-16">
              <div className="grid grid-cols-2 gap-8 max-w-2xl mx-auto mb-8">
                <div className="space-y-2">
                  <div className="text-6xl font-bold text-primary font-pixelify-sans">
                    {(safeDisplayData.totalAssigned || 0).toLocaleString()}
                  </div>
                  <div className="text-lg text-muted-foreground font-medium">
                    Total Memes Assigned
                  </div>
                  <div className="text-sm text-muted-foreground/60 font-mono">
                    ({safeDisplayData.totalAssigned || 0})
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-6xl font-bold text-accent font-pixelify-sans">
                    {(safeDisplayData.completed || 0).toLocaleString()}
                  </div>
                  <div className="text-lg text-muted-foreground font-medium">
                    Completed Annotations
                  </div>
                  <div className="text-sm text-muted-foreground/60 font-mono">
                    ({safeDisplayData.completed || 0})
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="max-w-md mx-auto">
                <div className="flex justify-between text-lg mb-2">
                  <span className="font-medium">Completion Rate</span>
                  <span className="font-bold text-primary">
                    {safeDisplayData.percentage || 0}%
                  </span>
                </div>
                <Progress
                  value={safeDisplayData.percentage || 0}
                  className="h-4 bg-background/50"
                />
              </div>
            </div>

            {/* Folders Section */}
            <div className="text-center">
              <h2 className="text-3xl font-bold text-foreground mb-8">
                Folders Assigned ({safeDisplayData.folders.length})
              </h2>

              <div
                className={`grid gap-4 max-w-3xl mx-auto ${
                  safeDisplayData.folders.length === 1
                    ? "grid-cols-1 justify-items-center"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {safeDisplayData.folders.map((folder, index) => (
                  <div
                    key={index}
                    className={`group relative transition-all duration-300 transform hover:scale-105 ${
                      selectedFolder === index ? "scale-105" : ""
                    } ${
                      safeDisplayData.folders.length === 1
                        ? "w-full max-w-md"
                        : ""
                    }`}
                  >
                    {/* Compact Folder Card */}
                    <div
                      className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                        selectedFolder === index
                          ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                          : "border-border bg-card/50 hover:border-accent hover:bg-accent/5 hover:shadow-md"
                      }`}
                    >
                      <div className="flex flex-col items-center space-y-4">
                        {/* Circular Folder Image */}
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                            <Image
                              src={folder.image}
                              alt={folder.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Selection Indicator */}
                          {selectedFolder === index && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                              <div className="w-2 h-2 bg-primary-foreground rounded-full" />
                            </div>
                          )}
                        </div>

                        {/* Folder Name */}
                        <h3 className="text-xl font-bold text-foreground text-center">
                          {folder.name}
                        </h3>

                        {/* Stats */}
                        <div className="w-full grid grid-cols-2 gap-2 text-center">
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-primary font-pixelify-sans">
                              {folder.count}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Total memes
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-accent font-pixelify-sans">
                              {folder.done}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Done
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-2xl font-bold text-primary font-pixelify-sans">
                              {folder.left}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Left
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold text-foreground">
                              {folder.created}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Created
                            </div>
                          </div>
                        </div>

                        {/* Start Button */}
                        <button
                          onClick={() => handleFolderSelect(index)}
                          className="w-full px-4 py-3 rounded-lg font-bold text-sm transition-all duration-300 bg-accent/20 text-accent hover:bg-accent hover:text-accent-foreground"
                        >
                          Start Annotate
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Leaderboard Tab - Only for non-god users */}
        {userName !== "god" && activeTab === "leaderboard" && (
          <div className="space-y-8">
            {/* Loading State */}
            {isLoadingLeaderboard && (
              <div className="text-center py-8">
                <ApiLoader size="lg" />
              </div>
            )}

            {/* Error State */}
            {leaderboardError && (
              <div className="text-center py-8">
                <div className="text-lg text-red-500">
                  Error: {leaderboardError}
                </div>
                <button
                  onClick={fetchLeaderboardData}
                  className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Leaderboard Content */}
            {!isLoadingLeaderboard &&
              !leaderboardError &&
              (() => {
                const stats = getLeaderboardStats();
                return (
                  <>
                    {/* Overall Stats */}
                    <div className="text-center">
                      <h2 className="text-3xl font-bold text-foreground mb-8">
                        Overall Progress
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                        <div className="space-y-2">
                          <div className="text-4xl font-bold text-primary font-pixelify-sans">
                            {stats.totalMemes.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Total Memes
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-4xl font-bold text-accent font-pixelify-sans">
                            {stats.totalCompleted.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Completed
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-4xl font-bold text-primary font-pixelify-sans">
                            {stats.totalMemes - stats.totalCompleted}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Left
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="text-4xl font-bold text-accent font-pixelify-sans">
                            {leaderboardData?.overall.folders ||
                              safeDisplayData.folders.length}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Folders
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}

            {/* Team Ranking */}
            {!isLoadingLeaderboard &&
              !leaderboardError &&
              (() => {
                const stats = getLeaderboardStats();
                return (
                  <div className="text-center">
                    <div className="max-w-2xl mx-auto space-y-4">
                      {stats.individualStats
                        .sort((a, b) => b.completed - a.completed)
                        .map((stat, index) => {
                          const isCurrentUser =
                            stat.name === safeDisplayData.name;
                          const rankIcon =
                            index === 0
                              ? Trophy
                              : index === 1
                              ? Medal
                              : index === 2
                              ? Award
                              : null;

                          return (
                            <div
                              key={stat.name}
                              className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                isCurrentUser
                                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                                  : "border-border bg-card/50 hover:border-accent hover:bg-accent/5"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    {rankIcon && (
                                      <div
                                        className={`p-2 rounded-lg ${
                                          index === 0
                                            ? "bg-yellow-500/20 text-yellow-500"
                                            : index === 1
                                            ? "bg-gray-400/20 text-gray-400"
                                            : "bg-amber-600/20 text-amber-600"
                                        }`}
                                      >
                                        {React.createElement(rankIcon, {
                                          className: "w-5 h-5",
                                        })}
                                      </div>
                                    )}
                                    <span className="text-2xl font-bold text-muted-foreground">
                                      #{index + 1}
                                    </span>
                                  </div>
                                  <div>
                                    <h3
                                      className={`text-xl font-bold ${
                                        isCurrentUser
                                          ? "text-primary"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {stat.name}
                                    </h3>
                                    <div className="text-sm text-muted-foreground">
                                      {stat.completed}/{stat.total} completed
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-2xl font-bold text-accent font-pixelify-sans">
                                    {stat.completed}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {stat.percentage}%
                                  </div>
                                </div>
                              </div>
                              <div className="mt-3">
                                <Progress
                                  value={stat.percentage}
                                  className={`h-2 ${
                                    isCurrentUser
                                      ? "bg-primary/20"
                                      : "bg-background/50"
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })()}
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
