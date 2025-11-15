"use client";

import { useState, useEffect } from "react";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Key,
  TestTube,
  CheckCircle,
  XCircle,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
} from "lucide-react";

interface GeminiKey {
  id: string;
  name: string;
  for_user: string;
  key: string;
  created_at: string;
}

interface APISetupProps {
  userName: string;
  folderName: string;
  onKeySelected?: (keyId: string, keyValue: string) => void;
}

export default function APISetup({
  userName,
  folderName,
  onKeySelected,
}: APISetupProps) {
  // State management
  const [key, setKey] = useState<GeminiKey | null>(null);
  const [isLoadingKey, setIsLoadingKey] = useState(true);
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load key on component mount
  useEffect(() => {
    loadKey();
  }, [userName]);

  // Notify parent when key changes (only pass key ID, not the actual key value)
  useEffect(() => {
    if (key && onKeySelected) {
      // Only pass key ID, not the actual key value for security
      onKeySelected(key.id, key.id); // Pass ID twice to maintain interface compatibility
    }
  }, [key, onKeySelected]);

  const loadKey = async () => {
    if (!userName) {
      setIsLoadingKey(false);
      return;
    }

    setIsLoadingKey(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/gemini-keys?for_user=${encodeURIComponent(userName)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load key");
      }

      setKey(data.key || null);
    } catch (error: any) {
      console.error("Error loading key:", error);
      setError(error.message || "Failed to load API key");
      setKey(null);
    } finally {
      setIsLoadingKey(false);
    }
  };

  const testKey = async () => {
    if (!key || !userName) return;

    setIsTestingKey(true);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch("/api/test-gemini-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ for_user: userName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Key test failed");
      }

      setTestResult({
        success: true,
        message: data.message || "Key test successful!",
      });
    } catch (error: any) {
      console.error("Key test error:", error);
      setTestResult({
        success: false,
        message: error.message || "Key test failed",
      });
    } finally {
      setIsTestingKey(false);
    }
  };

  const saveKey = async () => {
    if (!userName) {
      setError("User name is required");
      return;
    }

    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setError("Both name and key are required");
      return;
    }

    try {
      const response = await fetch("/api/gemini-keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newKeyName.trim(),
          key: newKeyValue.trim(),
          for_user: userName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save key");
      }

      // Reset form and reload key
      setNewKeyName("");
      setNewKeyValue("");
      setIsEditingKey(false);
      await loadKey();
    } catch (error: any) {
      console.error("Error saving key:", error);
      setError(error.message || "Failed to save API key");
    }
  };

  const updateKey = async () => {
    if (!userName) {
      setError("User name is required");
      return;
    }

    if (!newKeyName.trim() || !newKeyValue.trim()) {
      setError("Both name and key are required");
      return;
    }

    try {
      const response = await fetch("/api/gemini-keys", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          for_user: userName,
          name: newKeyName.trim(),
          key: newKeyValue.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update key");
      }

      setIsEditingKey(false);
      setNewKeyName("");
      setNewKeyValue("");
      await loadKey();
    } catch (error: any) {
      console.error("Error updating key:", error);
      setError(error.message || "Failed to update API key");
    }
  };

  const deleteKey = async () => {
    if (!userName) {
      setError("User name is required");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this API key? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/gemini-keys", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ for_user: userName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete key");
      }

      setKey(null);
      await loadKey();
    } catch (error: any) {
      console.error("Error deleting key:", error);
      setError(error.message || "Failed to delete API key");
    }
  };

  return (
    <div className="space-y-6">
      {/* API Setup Header */}

      {/* Error Display */}
      {error && (
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg max-w-md w-full">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-500 font-medium break-words">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Test Result Display */}
      {testResult && (
        <div className="flex justify-center mb-4">
          <div
            className={`p-4 border rounded-lg max-w-md w-full ${
              testResult.success
                ? "bg-green-500/10 border-green-500/30"
                : "bg-red-500/10 border-red-500/30"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              )}
              <p
                className={`text-sm font-medium break-words ${
                  testResult.success ? "text-green-500" : "text-red-500"
                }`}
              >
                {testResult.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 max-w-6xl">
          {/* Left Column - Key Management */}
          <div className="space-y-6">
            {/* Current Key Display */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  Your API Key
                </h4>
                {key && (
                  <Badge variant="secondary" className="text-xs">
                    Configured
                  </Badge>
                )}
              </div>

              {isLoadingKey ? (
                <div className="flex items-center justify-center py-8">
                  <PixelLoader
                    message="Loading key..."
                    size="sm"
                    variant="dots"
                  />
                </div>
              ) : key ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Key Name
                    </label>
                    <p className="text-foreground font-medium">{key.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Key Status
                    </label>
                    <code className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded block">
                      ✓ Configured (hidden for security)
                    </code>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Created
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(key.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => {
                        setIsEditingKey(true);
                        setNewKeyName(key.name);
                        setNewKeyValue(""); // Don't pre-fill key value for security - user must re-enter
                      }}
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>
                    <Button
                      onClick={deleteKey}
                      variant="outline"
                      className="flex items-center gap-1 text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    No API key configured. Add your key below.
                  </p>
                </div>
              )}
            </Card>

            {/* Add/Edit Key Form */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  {key ? (
                    <>
                      <Edit className="w-5 h-5" />
                      Edit Key
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Add API Key
                    </>
                  )}
                </h4>
                {isEditingKey && key && (
                  <Button
                    onClick={() => {
                      setIsEditingKey(false);
                      setNewKeyName("");
                      setNewKeyValue("");
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <X className="w-4 h-4" />
                    Cancel Edit
                  </Button>
                )}
              </div>

              {(isEditingKey || !key) && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Key Name *
                    </label>
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="e.g., My Gemini Key, Production Key"
                      className="w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      API Key *
                    </label>
                    <textarea
                      value={newKeyValue}
                      onChange={(e) => setNewKeyValue(e.target.value)}
                      placeholder="Paste your Gemini API key here..."
                      className="w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={isEditingKey ? updateKey : saveKey}
                      className="flex items-center gap-2"
                      disabled={!newKeyName.trim() || !newKeyValue.trim()}
                    >
                      <Save className="w-4 h-4" />
                      {isEditingKey ? "Update Key" : "Save Key"}
                    </Button>
                    {isEditingKey && (
                      <Button
                        onClick={() => {
                          setIsEditingKey(false);
                          setNewKeyName("");
                          setNewKeyValue("");
                        }}
                        variant="outline"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Right Column - Key Info and API Information */}
          <div className="space-y-6">
            {/* Key Details */}
            {key ? (
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Key Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Name:
                    </label>
                    <p className="text-foreground font-medium">
                      {key.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Key Status:
                    </label>
                    <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded">
                      ✓ API key is configured (hidden for security)
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Created:
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(key.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={testKey}
                      disabled={isTestingKey}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {isTestingKey ? (
                        <PixelLoader
                          message="Testing..."
                          size="sm"
                          variant="dots"
                        />
                      ) : (
                        <>
                          <TestTube className="w-4 h-4" />
                          Test This Key
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="text-center py-8">
                  <Key className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-foreground mb-2">
                    No Key Configured
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    Add your API key to view details and test connectivity.
                  </p>
                </div>
              </Card>
            )}

            {/* API Information */}
            <Card className="p-6">
              <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                API Information
              </h4>
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Provider:</strong> Google Gemini
                </p>
                <p>
                  <strong>Model:</strong> gemini-2.0-flash-lite
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  {isTestingKey ? "Testing..." : "Ready"}
                </p>
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-500">
                    💡 Get your API key from{" "}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-400"
                    >
                      Google AI Studio
                    </a>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
