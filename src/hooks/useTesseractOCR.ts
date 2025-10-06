import { useState, useCallback } from "react";
import { createWorker, PSM, Worker } from "tesseract.js";

interface OCRResult {
  text: string;
  confidence: number;
}

interface UseTesseractOCRReturn {
  extractText: (imageUrl: string) => Promise<OCRResult>;
  isProcessing: boolean;
  error: string | null;
}

export const useTesseractOCR = (): UseTesseractOCRReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractText = useCallback(
    async (imageUrl: string): Promise<OCRResult> => {
      let worker: Worker | null = null;

      setIsProcessing(true);
      setError(null);

      try {
        console.log("Starting Tesseract OCR for image:", imageUrl);

        // Try different language configurations
        const languageConfigs = ["ben", "ben+eng", "eng+ben"];
        let bestResult: OCRResult | null = null;
        let bestConfidence = 0;

        for (const lang of languageConfigs) {
          try {
            console.log(`Trying language configuration: ${lang}`);

            // Create a Tesseract worker
            worker = await createWorker(lang);

            // Set worker parameters for better Bangla recognition
            await worker.setParameters({
              tessedit_pageseg_mode: PSM.AUTO, // Fully automatic page segmentation with OSD
              tessedit_ocr_engine_mode: "1", // Neural nets LSTM engine only
              preserve_interword_spaces: "1",
            });

            // Perform OCR on the image
            const { data } = await worker.recognize(imageUrl);

            console.log(`OCR result for ${lang}:`, {
              text: data.text,
              confidence: data.confidence,
            });

            // Keep the result with highest confidence
            if (data.confidence > bestConfidence) {
              bestResult = {
                text: data.text.trim(),
                confidence: data.confidence,
              };
              bestConfidence = data.confidence;
            }

            // Terminate current worker
            await worker.terminate();
            worker = null;
          } catch (langError) {
            console.warn(`Failed with language ${lang}:`, langError);
            if (worker) {
              await worker.terminate();
              worker = null;
            }
          }
        }

        if (!bestResult) {
          throw new Error("All language configurations failed");
        }

        console.log("Best OCR result:", bestResult);
        return bestResult;
      } catch (err: any) {
        console.error("Tesseract OCR error:", err);
        setError(err.message || "OCR processing failed");
        throw err;
      } finally {
        // Always terminate the worker to free up resources
        if (worker) {
          await (worker as Worker).terminate();
        }
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    extractText,
    isProcessing,
    error,
  };
};
