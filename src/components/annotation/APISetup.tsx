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
  const [keys, setKeys] = useState<GeminiKey[]>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    keyId?: string;
  } | null>(null);
  const [isEditingKey, setIsEditingKey] = useState<string | null>(null);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyValue, setNewKeyValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Load keys on component mount
  useEffect(() => {
    loadKeys();
  }, []);

  // Notify parent when selected key changes
  useEffect(() => {
    if (selectedKeyId && onKeySelected) {
      const selectedKey = keys.find((key) => key.id === selectedKeyId);
      if (selectedKey) {
        onKeySelected(selectedKeyId, selectedKey.key);
      }
    }
  }, [selectedKeyId, keys, onKeySelected]);

  const loadKeys = async () => {
    setIsLoadingKeys(true);
    setError(null);

    try {
      const response = await fetch("/api/gemini-keys");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load keys");
      }

      setKeys(data.keys || []);

      // Auto-select first key if none selected
      if (data.keys && data.keys.length > 0 && !selectedKeyId) {
        setSelectedKeyId(data.keys[0].id);
      }
    } catch (error: any) {
      console.error("Error loading keys:", error);
      setError(error.message || "Failed to load API keys");
    } finally {
      setIsLoadingKeys(false);
    }
  };

  const testKey = async (keyId: string) => {
    setTestingKeyId(keyId);
    setTestResult(null);
    setError(null);

    try {
      const response = await fetch("/api/test-gemini-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Key test failed");
      }

      setTestResult({
        success: true,
        message: data.message || "Key test successful!",
        keyId,
      });
    } catch (error: any) {
      console.error("Key test error:", error);
      setTestResult({
        success: false,
        message: error.message || "Key test failed",
        keyId,
      });
    } finally {
      setTestingKeyId(null);
    }
  };

  const addKey = async () => {
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
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add key");
      }

      // Reset form and reload keys
      setNewKeyName("");
      setNewKeyValue("");
      await loadKeys();
    } catch (error: any) {
      console.error("Error adding key:", error);
      setError(error.message || "Failed to add API key");
    }
  };

  const updateKey = async (keyId: string, name: string, key: string) => {
    try {
      const response = await fetch("/api/gemini-keys", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: keyId,
          name: name.trim(),
          key: key.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update key");
      }

      setIsEditingKey(null);
      await loadKeys();
    } catch (error: any) {
      console.error("Error updating key:", error);
      setError(error.message || "Failed to update API key");
    }
  };

  const deleteKey = async (keyId: string) => {
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
        body: JSON.stringify({ id: keyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete key");
      }

      // If deleted key was selected, clear selection
      if (selectedKeyId === keyId) {
        setSelectedKeyId("");
      }

      await loadKeys();
    } catch (error: any) {
      console.error("Error deleting key:", error);
      setError(error.message || "Failed to delete API key");
    }
  };

  const selectedKey = keys.find((key) => key.id === selectedKeyId);

  return (
    <div className="space-y-6">
      {/* API Setup Header */}

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-500 font-medium">{error}</p>
          </div>
        </div>
      )}

      {/* Test Result Display */}
      {testResult && (
        <div
          className={`p-4 border rounded-lg ${
            testResult.success
              ? "bg-green-500/10 border-green-500/30"
              : "bg-red-500/10 border-red-500/30"
          }`}
        >
          <div className="flex items-center gap-2">
            {testResult.success ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <XCircle className="w-4 h-4 text-red-500" />
            )}
            <p
              className={`text-sm font-medium ${
                testResult.success ? "text-green-500" : "text-red-500"
              }`}
            >
              {testResult.message}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="flex justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 max-w-6xl">
          {/* Left Column - Keys Table and Add Form */}
          <div className="space-y-6">
            {/* Keys Table */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </h4>
                {selectedKey && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      Selected: {selectedKey.name}
                    </Badge>
                  </div>
                )}
              </div>

              {isLoadingKeys ? (
                <div className="flex items-center justify-center py-8">
                  <PixelLoader
                    message="Loading keys..."
                    size="sm"
                    variant="dots"
                  />
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            Name
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            Key Preview
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            Created
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-foreground">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {keys.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-muted-foreground"
                            >
                              <Key className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              No API keys found. Add your first key below.
                            </td>
                          </tr>
                        ) : (
                          keys.map((key) => (
                            <tr
                              key={key.id}
                              className={`hover:bg-muted/30 transition-colors ${
                                selectedKeyId === key.id ? "bg-primary/5" : ""
                              }`}
                            >
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-foreground">
                                    {key.name}
                                  </span>
                                  {selectedKeyId === key.id && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Selected
                                    </Badge>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <code className="text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded">
                                  {key.key.substring(0, 20)}...
                                </code>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {new Date(key.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3">
                                <Button
                                  onClick={() => setSelectedKeyId(key.id)}
                                  size="sm"
                                  variant={
                                    selectedKeyId === key.id
                                      ? "default"
                                      : "outline"
                                  }
                                >
                                  {selectedKeyId === key.id
                                    ? "Selected"
                                    : "Select"}
                                </Button>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Button
                                    onClick={() => testKey(key.id)}
                                    size="sm"
                                    variant="outline"
                                    disabled={testingKeyId !== null}
                                    className="flex items-center gap-1"
                                  >
                                    {testingKeyId === key.id ? (
                                      <PixelLoader size="sm" variant="dots" />
                                    ) : (
                                      <>
                                        <TestTube className="w-3 h-3" />
                                        Test
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setIsEditingKey(key.id);
                                      setNewKeyName(key.name);
                                      setNewKeyValue(key.key);
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    onClick={() => deleteKey(key.id)}
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center gap-1 text-red-500 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>

            {/* Add New Key Form */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add New Key
                </h4>
                {isEditingKey && (
                  <Button
                    onClick={() => {
                      setIsEditingKey(null);
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
                    onClick={
                      isEditingKey
                        ? () => updateKey(isEditingKey, newKeyName, newKeyValue)
                        : addKey
                    }
                    className="flex items-center gap-2"
                    disabled={!newKeyName.trim() || !newKeyValue.trim()}
                  >
                    <Save className="w-4 h-4" />
                    {isEditingKey ? "Update Key" : "Add Key"}
                  </Button>
                  {isEditingKey && (
                    <Button
                      onClick={() => {
                        setIsEditingKey(null);
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
            </Card>
          </div>

          {/* Right Column - Selected Key Info and API Information */}
          <div className="space-y-6">
            {/* Selected Key Info */}
            {selectedKey ? (
              <Card className="p-6">
                <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Selected Key Details
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Name:
                    </label>
                    <p className="text-foreground font-medium">
                      {selectedKey.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Key:
                    </label>
                    <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-2 rounded break-all whitespace-pre-wrap">
                      {selectedKey.key}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground">
                      Created:
                    </label>
                    <p className="text-sm text-muted-foreground">
                      {new Date(selectedKey.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="pt-4">
                    <Button
                      onClick={() => testKey(selectedKey.id)}
                      disabled={testingKeyId !== null}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      {testingKeyId === selectedKey.id ? (
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
                    No Key Selected
                  </h4>
                  <p className="text-muted-foreground mb-4">
                    Select an API key from the table to view details and test
                    connectivity.
                  </p>
                  {keys.length > 0 && (
                    <Button onClick={() => setSelectedKeyId(keys[0].id)}>
                      Select First Key
                    </Button>
                  )}
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
                  {testingKeyId ? "Testing..." : "Ready"}
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
