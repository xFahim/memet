"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PixelLoader } from "@/components/ui/pixel-loader";
import { Key, TestTube, CheckCircle, XCircle, Copy } from "lucide-react";

export default function TestAPIKeysPage() {
  const [apiKey, setApiKey] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    response?: any;
    error?: string;
  } | null>(null);

  const testKey = async () => {
    if (!apiKey.trim()) {
      setResult({
        success: false,
        message: "Please enter an API key",
      });
      return;
    }

    setIsTesting(true);
    setResult(null);

    try {
      const response = await fetch("/api/test-api-key-direct", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setResult({
          success: false,
          message: data.error || "Test failed",
          error: data.error,
          response: data,
        });
      } else {
        setResult({
          success: true,
          message: data.message || "API key is working!",
          response: data,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Failed to test API key",
        error: error.message,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
          <Key className="w-8 h-8" />
          Test API Keys
        </h1>
        <p className="text-muted-foreground">
          Enter a Gemini API key to test if it's working correctly
        </p>
      </div>

      <Card className="p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Gemini API Key
            </label>
            <textarea
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Gemini API key (starts with AIza...)"
              className="w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Your API key will be sent to the server for testing. It will not
              be stored.
            </p>
          </div>

          <Button
            onClick={testKey}
            disabled={isTesting || !apiKey.trim()}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            {isTesting ? (
              <PixelLoader message="Testing..." size="sm" variant="dots" />
            ) : (
              <>
                <TestTube className="w-5 h-5" />
                Test API Key
              </>
            )}
          </Button>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <h2 className="text-xl font-semibold text-foreground">
              {result.success ? "Test Successful" : "Test Failed"}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Message:
              </label>
              <div
                className={`p-3 rounded-lg ${
                  result.success
                    ? "bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-300"
                    : "bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300"
                }`}
              >
                <p className="text-sm font-medium">{result.message}</p>
              </div>
            </div>

            {result.response && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground">
                    Full Response:
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(JSON.stringify(result.response, null, 2))
                    }
                    className="h-7"
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <pre className="p-4 bg-muted rounded-lg overflow-auto text-xs font-mono text-foreground max-h-96">
                  {JSON.stringify(result.response, null, 2)}
                </pre>
              </div>
            )}

            {result.error && (
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Error Details:
                </label>
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300 font-mono">
                    {result.error}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 mt-6 bg-blue-500/10 border border-blue-500/30">
        <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
          💡 How to get your API key:
        </h3>
        <ol className="text-sm text-blue-600 dark:text-blue-400 space-y-1 list-decimal list-inside">
          <li>
            Visit{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-800 dark:hover:text-blue-200"
            >
              Google AI Studio
            </a>
          </li>
          <li>Sign in with your Google account</li>
          <li>Click "Create API Key"</li>
          <li>Copy the generated key (starts with "AIza")</li>
          <li>Paste it above and click "Test API Key"</li>
        </ol>
      </Card>
    </div>
  );
}
