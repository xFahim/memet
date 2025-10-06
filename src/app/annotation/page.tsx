"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Save,
  SkipForward,
  Image as ImageIcon,
  ZoomIn,
  X,
  Table,
  Grid3X3,
  Edit3,
  Download,
  FileText,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Loader2,
  Edit,
  Check,
} from "lucide-react";
import {
  PixelLoader,
  MemeLoader,
  DataLoader,
  ApiLoader,
  LoadingOverlay,
  LoadingSkeleton,
} from "@/components/ui/pixel-loader";
import { LightRays } from "@/components/ui/light-rays";
import { useState, useEffect, useCallback, Suspense } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useTesseractOCR } from "@/hooks/useTesseractOCR";

// Enum types matching the database
type RoleEnum = "hero" | "villain" | "victim" | "other";
type DomainEnum =
  | "politics"
  | "education"
  | "health"
  | "religion"
  | "society"
  | "pop_culture"
  | "economy"
  | "environment"
  | "others";

// Form data interface
interface AnnotationFormData {
  image_description: string;
  entity: string;
  role: RoleEnum | "";
  role_explanation: string;
  humor_explanation: string;
  context: string;
  domain: DomainEnum | "";
}

// Mock data - in real app this would come from API
const mockImageData = {
  id: "img_001",
  path: "/politics.jpeg", // This would be the actual image path from DB
  ocr_text: "Sample OCR text from the meme image",
  folder: "Political meme",
};

// Mock status data for the table
const mockStatusData = [
  {
    id: "img_001",
    name: "Political Meme 1",
    status: "in_progress",
    domain: "politics",
  },
  {
    id: "img_002",
    name: "Political Meme 2",
    status: "completed",
    domain: "politics",
  },
  {
    id: "img_003",
    name: "Political Meme 3",
    status: "pending",
    domain: "politics",
  },
  {
    id: "img_004",
    name: "Political Meme 4",
    status: "skipped",
    domain: "politics",
  },
  {
    id: "img_005",
    name: "Political Meme 5",
    status: "completed",
    domain: "politics",
  },
  {
    id: "img_006",
    name: "Political Meme 6",
    status: "pending",
    domain: "politics",
  },
  {
    id: "img_007",
    name: "Political Meme 7",
    status: "pending",
    domain: "politics",
  },
  {
    id: "img_008",
    name: "Political Meme 8",
    status: "completed",
    domain: "politics",
  },
  {
    id: "img_009",
    name: "Political Meme 9",
    status: "skipped",
    domain: "politics",
  },
  {
    id: "img_010",
    name: "Political Meme 10",
    status: "pending",
    domain: "politics",
  },
];

// Dynamic meme counter - will be calculated based on actual data

function AnnotationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<AnnotationFormData>({
    image_description: "",
    entity: "",
    role: "",
    role_explanation: "",
    humor_explanation: "",
    context: "",
    domain: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"workspace" | "status" | "grid">(
    "workspace"
  );
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [statusData, setStatusData] = useState<any>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [statusCache, setStatusCache] = useState<{
    [key: string]: { data: any; timestamp: number };
  }>({});
  const [gridPage, setGridPage] = useState(1);
  const [gridItemsPerPage] = useState(20); // Load 20 items at a time

  // Use the Tesseract OCR hook
  const {
    extractText,
    isProcessing: isExtractingOCR,
    error: ocrError,
  } = useTesseractOCR();

  // OCR text editing state
  const [isEditingOCR, setIsEditingOCR] = useState(false);
  const [editableOCRText, setEditableOCRText] = useState("");

  // Get user and folder from URL parameters
  const userName = searchParams.get("user") || "";
  const folderName = searchParams.get("folder") || "";

  const handleStartAnnotating = useCallback(async () => {
    if (!userName || !folderName) {
      setApiError("Missing user or folder information");
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);
    setApiResponse(null);

    try {
      const response = await fetch(
        `/api/next-annotation?annotator=${encodeURIComponent(
          userName
        )}&folder=${encodeURIComponent(folderName)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      setApiResponse(data);
    } catch (error: any) {
      setApiError(error.message || "Failed to fetch annotation data");
      console.error("API Error:", error);
    } finally {
      setIsLoadingApi(false);
    }
  }, [userName, folderName]);

  const fetchStatusData = useCallback(
    async (filter: string = "all", forceRefresh: boolean = false) => {
      if (!userName || !folderName) {
        setStatusError("Missing user or folder information");
        return;
      }

      // Create cache key
      const cacheKey = `${userName}-${folderName}-${filter}`;
      const now = Date.now();
      const cacheExpiry = 5 * 60 * 1000; // 5 minutes

      // Check cache first (unless force refresh)
      if (!forceRefresh && statusCache[cacheKey]) {
        const cached = statusCache[cacheKey];
        if (now - cached.timestamp < cacheExpiry) {
          setStatusData(cached.data);
          return;
        }
      }

      setIsLoadingStatus(true);
      setStatusError(null);
      setStatusData(null);

      try {
        let url = `/api/annotation-status?annotator=${encodeURIComponent(
          userName
        )}&folder=${encodeURIComponent(folderName)}`;

        if (filter !== "all") {
          url += `&status=${encodeURIComponent(filter)}`;
        }

        const response = await fetch(url);

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        // Cache the data
        setStatusCache((prev) => ({
          ...prev,
          [cacheKey]: {
            data,
            timestamp: now,
          },
        }));

        setStatusData(data);
      } catch (error: any) {
        setStatusError(error.message || "Failed to fetch status data");
        console.error("Status API Error:", error);
      } finally {
        setIsLoadingStatus(false);
      }
    },
    [userName, folderName, statusCache]
  );

  const loadSpecificAnnotation = useCallback(
    async (annotationId: string) => {
      if (!userName || !folderName) {
        setApiError("Missing user or folder information");
        return;
      }

      setIsLoadingApi(true);
      setApiError(null);
      setApiResponse(null);
      setSelectedAnnotationId(annotationId);

      try {
        const response = await fetch(
          `/api/get-annotation?id=${encodeURIComponent(
            annotationId
          )}&annotator=${encodeURIComponent(
            userName
          )}&folder=${encodeURIComponent(folderName)}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error || `HTTP error! status: ${response.status}`
          );
        }

        setApiResponse(data);
      } catch (error: any) {
        setApiError(error.message || "Failed to load annotation");
        console.error("Load Annotation Error:", error);
      } finally {
        setIsLoadingApi(false);
      }
    },
    [userName, folderName]
  );

  // Auto-load annotation data when page loads with user and folder parameters
  useEffect(() => {
    if (userName && folderName) {
      handleStartAnnotating();
    }
  }, [userName, folderName, handleStartAnnotating]);

  // Auto-load status data when switching to status tab
  useEffect(() => {
    if (
      (activeTab === "status" || activeTab === "grid") &&
      userName &&
      folderName &&
      !statusData
    ) {
      fetchStatusData(statusFilter);
    }
  }, [
    activeTab,
    userName,
    folderName,
    statusData,
    statusFilter,
    fetchStatusData,
  ]);

  // Refetch data when filter changes
  useEffect(() => {
    if (
      (activeTab === "status" || activeTab === "grid") &&
      userName &&
      folderName
    ) {
      fetchStatusData(statusFilter);
    }
  }, [statusFilter, activeTab, userName, folderName, fetchStatusData]);

  // Populate form with existing annotation data when API response comes back
  useEffect(() => {
    if (apiResponse?.annotation) {
      const annotation = apiResponse.annotation;
      setFormData({
        image_description: annotation.image_description || "",
        entity: annotation.entity || "",
        role: annotation.role || "",
        role_explanation: annotation.role_explanation || "",
        humor_explanation: annotation.humor_explanation || "",
        context: annotation.context || "",
        domain: annotation.domain || "",
      });

      // Also load status data to get accurate meme counter
      if (!statusData && userName && folderName) {
        fetchStatusData("all", false); // Load all data for counter
      }
    }
  }, [apiResponse, statusData, userName, folderName, fetchStatusData]);

  // Lazy loading for grid
  useEffect(() => {
    const handleScroll = () => {
      if (activeTab !== "grid") return;

      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.offsetHeight;

      // Load more when user is near bottom (100px from bottom)
      if (scrollTop + windowHeight >= docHeight - 100) {
        const totalItems = statusData?.memes?.length || 0;
        const currentItems = gridPage * gridItemsPerPage;

        if (currentItems < totalItems) {
          setGridPage((prev) => prev + 1);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [activeTab, gridPage, gridItemsPerPage, statusData?.memes?.length]);

  const handleInputChange = (
    field: keyof AnnotationFormData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.image_description.trim()) {
      errors.image_description = "Image description is required";
    }

    if (!formData.entity.trim()) {
      errors.entity = "Entity is required";
    }

    if (!formData.role) {
      errors.role = "Role is required";
    }

    if (!formData.role_explanation.trim()) {
      errors.role_explanation = "Role explanation is required";
    }

    if (!formData.humor_explanation.trim()) {
      errors.humor_explanation = "Humor explanation is required";
    }

    if (!formData.context.trim()) {
      errors.context = "Context is required";
    }

    if (!formData.domain) {
      errors.domain = "Domain is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setSaveSuccess(false);
    setSaveError(null);

    // Validate form
    if (!validateForm()) {
      return;
    }

    // Check if we have the required data
    if (!apiResponse?.annotation?.id || !userName) {
      setSaveError(
        "Missing annotation data or user information. Please refresh and try again."
      );
      return;
    }

    // No confirmation dialog - proceed directly

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/save-annotation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          annotatorName: userName,
          annotationId: apiResponse.annotation.id,
          ocr_text: apiResponse.annotation.ocr_text || "",
          image_description: formData.image_description,
          entity: formData.entity,
          role: formData.role,
          role_explanation: formData.role_explanation,
          humor_explanation: formData.humor_explanation,
          context: formData.context,
          domain: formData.domain,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Success
      setSaveSuccess(true);
      setSaveError(null);

      // Reset form after successful submission
      setFormData({
        image_description: "",
        entity: "",
        role: "",
        role_explanation: "",
        humor_explanation: "",
        context: "",
        domain: "",
      });

      // Clear validation errors
      setValidationErrors({});

      // Clear selected annotation ID to indicate we're moving to next
      setSelectedAnnotationId(null);

      // Only fetch the next annotation if the cursor moved (was in_progress)
      if (data.movedCursor) {
        try {
          const nextResponse = await fetch(
            `/api/next-annotation?annotator=${encodeURIComponent(
              userName
            )}&folder=${encodeURIComponent(folderName)}`
          );

          const nextData = await nextResponse.json();

          if (nextResponse.ok) {
            setApiResponse(nextData);
          } else {
            // If no more annotations, show a message
            if (nextData.message === "No more items") {
              setApiResponse(null);
              setApiError("No more annotations to process! 🎉");
            } else {
              setApiError(nextData.error || "Failed to fetch next annotation");
            }
          }
        } catch (nextError: any) {
          console.error("Error fetching next annotation:", nextError);
          setApiError("Annotation saved, but failed to load next item");
        }
      } else {
        // If cursor didn't move, fetch the current in-progress annotation
        try {
          const currentResponse = await fetch(
            `/api/next-annotation?annotator=${encodeURIComponent(
              userName
            )}&folder=${encodeURIComponent(folderName)}`
          );

          const currentData = await currentResponse.json();

          if (currentResponse.ok) {
            setApiResponse(currentData);
          } else {
            // If no current annotation, clear the response
            setApiResponse(null);
          }
        } catch (currentError: any) {
          console.error("Error fetching current annotation:", currentError);
        }

        // Show success message
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }

      // Always refresh status table data to reflect the changes
      fetchStatusData(statusFilter, true); // Force refresh after save
    } catch (error: any) {
      console.error("Error saving annotation:", error);
      setSaveError(
        error.message || "Error saving annotation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    // Check if we have the required data
    if (!apiResponse?.annotation?.id) {
      setApiError("No annotation selected to skip");
      return;
    }

    // No confirmation dialog - proceed directly

    setIsSubmitting(true);
    setApiError(null);

    try {
      // Skip the current annotation
      const response = await fetch("/api/skip-annotation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          annotation_id: apiResponse.annotation.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Clear selected annotation ID
      setSelectedAnnotationId(null);

      // Only fetch the next annotation if the cursor moved (was in_progress)
      if (data.movedCursor) {
        try {
          const nextResponse = await fetch(
            `/api/next-annotation?annotator=${encodeURIComponent(
              userName
            )}&folder=${encodeURIComponent(folderName)}`
          );

          const nextData = await nextResponse.json();

          if (nextResponse.ok) {
            setApiResponse(nextData);
            setSaveSuccess(true);
            setTimeout(() => {
              setSaveSuccess(false);
            }, 3000);
          } else {
            // If no more annotations, show a message
            if (nextData.message === "No more items") {
              setApiResponse(null);
              setApiError("No more annotations to process! 🎉");
            } else {
              setApiError(nextData.error || "Failed to fetch next annotation");
            }
          }
        } catch (nextError: any) {
          console.error("Error fetching next annotation:", nextError);
          setApiError("Annotation skipped, but failed to load next item");
        }
      } else {
        // If cursor didn't move, fetch the current in-progress annotation
        try {
          const currentResponse = await fetch(
            `/api/next-annotation?annotator=${encodeURIComponent(
              userName
            )}&folder=${encodeURIComponent(folderName)}`
          );

          const currentData = await currentResponse.json();

          if (currentResponse.ok) {
            setApiResponse(currentData);
          } else {
            // If no current annotation, clear the response
            setApiResponse(null);
          }
        } catch (currentError: any) {
          console.error("Error fetching current annotation:", currentError);
        }

        // Show success message
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);
      }

      // Always refresh status table data to reflect the changes
      fetchStatusData(statusFilter, true); // Force refresh after skip
    } catch (error: any) {
      console.error("Error skipping annotation:", error);
      setApiError(
        error.message || "Error skipping annotation. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToProfile = () => {
    // Navigate back to the user profile page
    router.back();
  };

  const handleExtractOCR = async () => {
    if (!apiResponse?.image_url) {
      return;
    }

    try {
      const result = await extractText(apiResponse.image_url);

      // Update the OCR text in the API response
      if (apiResponse?.annotation) {
        setApiResponse({
          ...apiResponse,
          annotation: {
            ...apiResponse.annotation,
            ocr_text: result.text || "No text detected",
          },
        });
      }
    } catch (error: any) {
      console.error("Tesseract OCR extraction error:", error);
      // Error is already handled by the hook
    }
  };

  const handleEditOCR = () => {
    const currentOCRText = apiResponse?.annotation?.ocr_text || "";
    setEditableOCRText(currentOCRText);
    setIsEditingOCR(true);
  };

  const handleSaveOCR = () => {
    if (apiResponse?.annotation) {
      setApiResponse({
        ...apiResponse,
        annotation: {
          ...apiResponse.annotation,
          ocr_text: editableOCRText,
        },
      });
    }
    setIsEditingOCR(false);
  };

  const handleCancelOCR = () => {
    setEditableOCRText("");
    setIsEditingOCR(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-500 border-green-500/30";
      case "in_progress":
        return "bg-blue-500/20 text-blue-500 border-blue-500/30";
      case "reviewed":
        return "bg-purple-500/20 text-purple-500 border-purple-500/30";
      case "skipped":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/30";
      case "pending":
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-500 border-gray-500/30";
    }
  };

  const formatStatusBadge = (status: string) => {
    switch (status) {
      case "in_progress":
        return "in-prog";
      case "completed":
        return "done";
      case "pending":
        return "pending";
      case "reviewed":
        return "reviewed";
      case "skipped":
        return "skipped";
      default:
        return status;
    }
  };

  const getStatusCounts = () => {
    if (statusData?.stats) {
      return {
        completed: statusData.stats.completed || 0,
        reviewed: statusData.stats.reviewed || 0,
        skipped: statusData.stats.skipped || 0,
        pending: statusData.stats.pending || 0,
        inProgress: statusData.stats.in_progress || 0,
        total: statusData.stats.total || 0,
      };
    }

    // Fallback to mock data if no real data available
    const completed = mockStatusData.filter(
      (item) => item.status === "completed"
    ).length;
    const reviewed = mockStatusData.filter(
      (item) => item.status === "reviewed"
    ).length;
    const skipped = mockStatusData.filter(
      (item) => item.status === "skipped"
    ).length;
    const pending = mockStatusData.filter(
      (item) => item.status === "pending"
    ).length;
    const inProgress = mockStatusData.filter(
      (item) => item.status === "in_progress"
    ).length;

    return {
      completed,
      reviewed,
      skipped,
      pending,
      inProgress,
      total: mockStatusData.length,
    };
  };

  const getMemeCounter = () => {
    // If we have status data, use it for accurate positioning
    if (statusData?.memes && apiResponse?.annotation) {
      const currentIndex = statusData.memes.findIndex(
        (meme: any) => meme.id === apiResponse.annotation.id
      );

      return {
        current: currentIndex >= 0 ? currentIndex + 1 : 0,
        total: statusData.memes.length,
      };
    }

    // Fallback: if we have annotation data but no status data yet, show basic info
    if (apiResponse?.annotation) {
      return {
        current: 1, // We know we have at least one annotation
        total: 0, // Will show as "Meme 1 of ?" until status data loads
      };
    }

    // No data at all
    return { current: 0, total: 0 };
  };

  const getGridItems = () => {
    if (!statusData?.memes) return [];

    const startIndex = 0;
    const endIndex = gridPage * gridItemsPerPage;
    return statusData.memes.slice(startIndex, endIndex);
  };

  const getStatusOverlay = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 border-green-500/30";
      case "skipped":
        return "bg-yellow-500/20 border-yellow-500/30";
      case "in_progress":
        return "bg-blue-500/20 border-blue-500/30";
      case "reviewed":
        return "bg-purple-500/20 border-purple-500/30";
      default:
        return "";
    }
  };

  const getStatusColorOverlay = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/40"; // Green overlay with 40% opacity
      case "skipped":
        return "bg-yellow-500/40"; // Yellow overlay with 40% opacity
      case "in_progress":
        return "bg-blue-500/40"; // Blue overlay with 40% opacity
      case "reviewed":
        return "bg-purple-500/40"; // Purple overlay with 40% opacity
      default:
        return ""; // No overlay for pending
    }
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log("Exporting to CSV...");
    alert("CSV export functionality will be implemented");
  };

  const handleExportJSON = () => {
    // TODO: Implement JSON export
    console.log("Exporting to JSON...");
    alert("JSON export functionality will be implemented");
  };

  const handleClearAll = async () => {
    if (!userName || !folderName) {
      setStatusError("Missing user or folder information");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all your annotation data for folder "${folderName}"?\n\nThis will:\n• Reset all your memes to "pending" status\n• Remove all your annotation text (OCR, descriptions, explanations)\n• Keep the meme assignments and system data\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setIsLoadingStatus(true);
    setStatusError(null);

    try {
      const response = await fetch("/api/clear-annotations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          annotator_name: userName,
          folder_name: folderName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error || `HTTP error! status: ${response.status}`;
        const availableAnnotators = data.availableAnnotators;

        if (availableAnnotators && availableAnnotators.length > 0) {
          throw new Error(
            `${errorMessage}\n\nAvailable annotators: ${availableAnnotators.join(
              ", "
            )}`
          );
        } else {
          throw new Error(errorMessage);
        }
      }

      // Show success message
      alert(
        `Successfully cleared annotations! All your memes have been reset to pending status, and the first meme is now ready for annotation.`
      );

      // Refresh the status data to reflect the changes
      await fetchStatusData(statusFilter, true); // Force refresh

      // If we're currently viewing an annotation, clear it
      if (apiResponse?.annotation) {
        setApiResponse(null);
        setFormData({
          image_description: "",
          entity: "",
          role: "",
          role_explanation: "",
          humor_explanation: "",
          context: "",
          domain: "",
        });
        setValidationErrors({});
        setSelectedAnnotationId(null);
      }
    } catch (error: any) {
      console.error("Error clearing annotations:", error);
      setStatusError(
        error.message || "Failed to clear annotations. Please try again."
      );
    } finally {
      setIsLoadingStatus(false);
    }
  };

  return (
    <LoadingOverlay
      isLoading={isLoadingApi && !apiResponse}
      message="Loading annotation workspace..."
    >
      <div className="min-h-screen bg-background p-8 relative">
        <LightRays />
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToProfile}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Profile
            </button>
            <h1 className="text-4xl md:text-6xl font-bebas-neue font-bold text-foreground">
              Annotation{" "}
              <span className="font-pixelify-sans text-primary">Workspace</span>
            </h1>
            <div className="flex items-center justify-between mt-2">
              <div className="flex flex-col gap-1">
                <p className="text-lg text-muted-foreground">
                  User:{" "}
                  <span className="font-semibold text-foreground">
                    {userName || "Unknown"}
                  </span>
                </p>
                <p className="text-lg text-muted-foreground">
                  Folder:{" "}
                  <span className="font-semibold text-foreground">
                    {folderName || "Unknown"}
                  </span>
                </p>
              </div>
              <div className="text-lg font-bold text-primary">
                {(() => {
                  const counter = getMemeCounter();
                  if (counter.current > 0 && counter.total > 0) {
                    return `Meme ${counter.current} of ${counter.total}`;
                  } else if (counter.current > 0 && counter.total === 0) {
                    return `Meme ${counter.current} of ?`;
                  } else {
                    return isLoadingApi ? (
                      <PixelLoader
                        message="Loading..."
                        size="sm"
                        variant="dots"
                      />
                    ) : (
                      "Loading..."
                    );
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Tab Header */}
          <div className="flex justify-center mb-8">
            <div className="flex bg-card/50 rounded-lg p-1 border">
              <button
                onClick={() => setActiveTab("workspace")}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "workspace"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Edit3 className="w-4 h-4" />
                Annotation Workspace
              </button>
              <button
                onClick={() => setActiveTab("status")}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "status"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Table className="w-4 h-4" />
                Status Table
              </button>
              <button
                onClick={() => setActiveTab("grid")}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "grid"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Meme Grid
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "workspace" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Side - Image and Guidelines */}
              <div className="space-y-6">
                {/* Image Display */}
                <div className="bg-card/50 rounded-lg border p-6">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                      <ImageIcon className="w-5 h-5" />
                      Image to Annotate
                    </h2>
                  </div>

                  {/* Image */}
                  <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden border group">
                    {isLoadingApi ? (
                      <div className="w-full h-full flex items-center justify-center bg-muted/50">
                        <MemeLoader />
                      </div>
                    ) : (
                      <>
                        <Image
                          src={apiResponse?.image_url || mockImageData.path}
                          alt="Meme to annotate"
                          fill
                          className="object-cover"
                        />
                        {/* Zoom Button */}
                        <button
                          onClick={() => setIsImageModalOpen(true)}
                          className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-black/70"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Image URL for debugging */}
                  {apiResponse?.image_url && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">
                        Image URL:
                      </h3>
                      <p className="text-xs text-muted-foreground bg-muted/50 p-3 rounded break-all">
                        {apiResponse.image_url}
                      </p>
                      <a
                        href={apiResponse.image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline"
                      >
                        Open image in new tab
                      </a>
                    </div>
                  )}

                  {/* OCR Text */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        Bangla OCR Text:
                      </h3>
                      <div className="flex items-center gap-2">
                        {!isEditingOCR && (
                          <button
                            onClick={handleEditOCR}
                            className="flex items-center gap-2 px-3 py-1 text-xs bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors"
                          >
                            <Edit className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                        <button
                          onClick={handleExtractOCR}
                          disabled={isExtractingOCR || !apiResponse?.image_url}
                          className="flex items-center gap-2 px-3 py-1 text-xs bg-primary/20 text-primary border border-primary/30 rounded-lg font-medium hover:bg-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExtractingOCR ? (
                            <PixelLoader
                              message="Extracting Bangla text..."
                              size="sm"
                              variant="dots"
                            />
                          ) : (
                            <>
                              <FileText className="w-3 h-3" />
                              Extract Bangla OCR
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isEditingOCR ? (
                      <div className="space-y-2">
                        <textarea
                          value={editableOCRText}
                          onChange={(e) => setEditableOCRText(e.target.value)}
                          placeholder="Edit the OCR text here..."
                          className="w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-y"
                          rows={4}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveOCR}
                            className="flex items-center gap-2 px-3 py-1 text-xs bg-green-500/20 text-green-500 border border-green-500/30 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={handleCancelOCR}
                            className="flex items-center gap-2 px-3 py-1 text-xs bg-gray-500/20 text-gray-500 border border-gray-500/30 rounded-lg font-medium hover:bg-gray-500/30 transition-colors"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="relative group">
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded min-h-[60px]">
                          {apiResponse?.annotation?.ocr_text ||
                            mockImageData.ocr_text ||
                            "No OCR text available"}
                        </p>
                        {apiResponse?.annotation?.ocr_text && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={handleEditOCR}
                              className="p-1 bg-black/50 text-white rounded hover:bg-black/70 transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {ocrError && (
                      <div className="p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                        <p className="text-xs text-red-500">
                          OCR Error: {ocrError}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Show API Error if any */}
                  {apiError && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-500">Error: {apiError}</p>
                    </div>
                  )}
                </div>

                {/* Annotation Guidelines */}
                <div className="bg-card/50 rounded-lg border p-6">
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Annotation Guidelines
                  </h3>

                  <div className="space-y-3 text-sm">
                    {/* Role Explanation Format */}
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <h4 className="font-bold text-blue-500 mb-1">
                        📝 Role Explanation
                      </h4>
                      <p className="text-muted-foreground">
                        Format:{" "}
                        <span className="font-bold text-foreground">
                          [Entity] [Action/Concept] [Brief Description]
                        </span>
                      </p>
                    </div>

                    {/* Humor Explanation Format */}
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                      <h4 className="font-bold text-yellow-500 mb-1">
                        😄 Humor Explanation
                      </h4>
                      <p className="text-muted-foreground">
                        Format:{" "}
                        <span className="font-bold text-foreground">
                          [Humor Type or Device] [Target/Entity] [Reason for
                          Humor]
                        </span>
                      </p>
                    </div>

                    {/* Context Format */}
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                      <h4 className="font-bold text-green-500 mb-1">
                        🌍 Context
                      </h4>
                      <p className="text-muted-foreground">
                        Format:{" "}
                        <span className="font-bold text-foreground">
                          [Entity/Event] [Situation/Background] [Relevance to
                          Meme]
                        </span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Quick Info and Detailed Explanations */}
              <div className="space-y-6">
                {/* Quick Info Section - Moved to top right */}
                <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    Quick Info
                  </h3>

                  {/* Entity */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Entity *
                    </label>
                    <input
                      type="text"
                      value={formData.entity}
                      onChange={(e) =>
                        handleInputChange("entity", e.target.value)
                      }
                      placeholder="Who or what is the main subject?"
                      className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                        validationErrors.entity
                          ? "border-red-500 focus:ring-red-500"
                          : "border-border focus:ring-primary"
                      }`}
                      required
                    />
                    {validationErrors.entity && (
                      <p className="text-sm text-red-500">
                        {validationErrors.entity}
                      </p>
                    )}
                  </div>

                  {/* Role */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) =>
                        handleInputChange("role", e.target.value as RoleEnum)
                      }
                      className={`w-full p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 ${
                        validationErrors.role
                          ? "border-red-500 focus:ring-red-500"
                          : "border-border focus:ring-primary"
                      }`}
                      required
                    >
                      <option value="">Select a role...</option>
                      <option value="hero">Hero</option>
                      <option value="villain">Villain</option>
                      <option value="victim">Victim</option>
                      <option value="other">Other</option>
                    </select>
                    {validationErrors.role && (
                      <p className="text-sm text-red-500">
                        {validationErrors.role}
                      </p>
                    )}
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      Domain *
                    </label>
                    <select
                      value={formData.domain}
                      onChange={(e) =>
                        handleInputChange(
                          "domain",
                          e.target.value as DomainEnum
                        )
                      }
                      className={`w-full p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 ${
                        validationErrors.domain
                          ? "border-red-500 focus:ring-red-500"
                          : "border-border focus:ring-primary"
                      }`}
                      required
                    >
                      <option value="">Select a domain...</option>
                      <option value="politics">Politics</option>
                      <option value="education">Education</option>
                      <option value="health">Health</option>
                      <option value="religion">Religion</option>
                      <option value="society">Society</option>
                      <option value="pop_culture">Pop Culture</option>
                      <option value="economy">Economy</option>
                      <option value="environment">Environment</option>
                      <option value="others">Others</option>
                    </select>
                    {validationErrors.domain && (
                      <p className="text-sm text-red-500">
                        {validationErrors.domain}
                      </p>
                    )}
                  </div>
                </div>

                {/* Detailed Explanations */}
                <div className="space-y-4">
                  {/* Success Message */}
                  {saveSuccess && (
                    <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-sm text-green-500 font-medium">
                          {selectedAnnotationId
                            ? "Annotation skipped! Loading next annotation... ⏭️"
                            : "Annotation saved successfully! 🎉"}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {saveError && (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm text-red-500 font-medium">
                          {saveError}
                        </p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Image Description */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Image Description *
                      </label>
                      <textarea
                        value={formData.image_description}
                        onChange={(e) =>
                          handleInputChange("image_description", e.target.value)
                        }
                        placeholder="Describe what you see in the image..."
                        className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                          validationErrors.image_description
                            ? "border-red-500 focus:ring-red-500"
                            : "border-border focus:ring-primary"
                        }`}
                        rows={4}
                        required
                      />
                      {validationErrors.image_description && (
                        <p className="text-sm text-red-500">
                          {validationErrors.image_description}
                        </p>
                      )}
                    </div>

                    {/* Role Explanation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Role Explanation *
                      </label>
                      <textarea
                        value={formData.role_explanation}
                        onChange={(e) =>
                          handleInputChange("role_explanation", e.target.value)
                        }
                        placeholder="Explain why this entity has this role..."
                        className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                          validationErrors.role_explanation
                            ? "border-red-500 focus:ring-red-500"
                            : "border-border focus:ring-primary"
                        }`}
                        rows={4}
                        required
                      />
                      {validationErrors.role_explanation && (
                        <p className="text-sm text-red-500">
                          {validationErrors.role_explanation}
                        </p>
                      )}
                    </div>

                    {/* Humor Explanation */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Humor Explanation *
                      </label>
                      <textarea
                        value={formData.humor_explanation}
                        onChange={(e) =>
                          handleInputChange("humor_explanation", e.target.value)
                        }
                        placeholder="What makes this meme funny? Explain the humor..."
                        className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                          validationErrors.humor_explanation
                            ? "border-red-500 focus:ring-red-500"
                            : "border-border focus:ring-primary"
                        }`}
                        rows={4}
                        required
                      />
                      {validationErrors.humor_explanation && (
                        <p className="text-sm text-red-500">
                          {validationErrors.humor_explanation}
                        </p>
                      )}
                    </div>

                    {/* Context */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">
                        Context *
                      </label>
                      <textarea
                        value={formData.context}
                        onChange={(e) =>
                          handleInputChange("context", e.target.value)
                        }
                        placeholder="What is the broader context or background?"
                        className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                          validationErrors.context
                            ? "border-red-500 focus:ring-red-500"
                            : "border-border focus:ring-primary"
                        }`}
                        rows={4}
                        required
                      />
                      {validationErrors.context && (
                        <p className="text-sm text-red-500">
                          {validationErrors.context}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <PixelLoader
                            message="Saving..."
                            size="sm"
                            variant="pulse"
                          />
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save Annotation
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSkip}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <PixelLoader
                            message="Skipping..."
                            size="sm"
                            variant="dots"
                          />
                        ) : (
                          <>
                            <SkipForward className="w-4 h-4" />
                            Skip
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Status Table Tab */}
          {activeTab === "status" && (
            <div className="space-y-6">
              {/* Status Summary */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {(() => {
                  const counts = getStatusCounts();
                  return (
                    <>
                      <div className="bg-card/50 rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">
                          {isLoadingStatus ? (
                            <div className="w-8 h-8 bg-green-500/20 rounded animate-pulse mx-auto" />
                          ) : (
                            counts.completed
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </div>
                      <div className="bg-card/50 rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-purple-500">
                          {isLoadingStatus ? (
                            <div className="w-8 h-8 bg-purple-500/20 rounded animate-pulse mx-auto" />
                          ) : (
                            counts.reviewed
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Reviewed
                        </div>
                      </div>
                      <div className="bg-card/50 rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-500">
                          {isLoadingStatus ? (
                            <div className="w-8 h-8 bg-yellow-500/20 rounded animate-pulse mx-auto" />
                          ) : (
                            counts.skipped
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Skipped
                        </div>
                      </div>
                      <div className="bg-card/50 rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-gray-500">
                          {isLoadingStatus ? (
                            <div className="w-8 h-8 bg-gray-500/20 rounded animate-pulse mx-auto" />
                          ) : (
                            counts.pending
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Pending
                        </div>
                      </div>
                      <div className="bg-card/50 rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold text-primary">
                          {isLoadingStatus ? (
                            <div className="w-8 h-8 bg-primary/20 rounded animate-pulse mx-auto" />
                          ) : (
                            counts.total
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Total
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              {/* Status Error Message */}
              {statusError && (
                <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm text-red-500 font-medium">
                      {statusError}
                    </p>
                  </div>
                  <button
                    onClick={() => fetchStatusData(statusFilter, true)}
                    disabled={isLoadingStatus}
                    className="mt-2 text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    {isLoadingStatus ? (
                      <PixelLoader
                        message="Retrying..."
                        size="sm"
                        variant="dots"
                      />
                    ) : (
                      "Retry"
                    )}
                  </button>
                </div>
              )}

              {/* Filter Options */}
              <div className="bg-card/50 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                    Annotation Status Table
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      Filter:
                    </span>
                    <div className="flex gap-2">
                      {[
                        { value: "all", label: "All" },
                        { value: "completed", label: "Completed" },
                        { value: "pending", label: "Pending" },
                        { value: "in_progress", label: "In Progress" },
                        { value: "skipped", label: "Skipped" },
                      ].map((filter) => (
                        <button
                          key={filter.value}
                          onClick={() => setStatusFilter(filter.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            statusFilter === filter.value
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Click on any row to jump to that meme
                </p>
              </div>

              {/* Status Table */}
              <div className="bg-card/50 rounded-lg border overflow-hidden">
                <div className="h-96 overflow-auto">
                  {isLoadingStatus ? (
                    <div className="flex items-center justify-center h-full">
                      <DataLoader />
                    </div>
                  ) : statusData?.memes && statusData.memes.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[400px]">
                        <thead className="bg-muted/50 sticky top-0 z-10">
                          <tr>
                            <th className="text-left p-3 text-sm font-medium text-foreground w-16">
                              #
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-foreground w-32">
                              Image ID
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-foreground w-24">
                              Status
                            </th>
                            <th className="text-left p-3 text-sm font-medium text-foreground w-28">
                              Updated
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {statusData.memes.map((item: any, index: number) => (
                            <tr
                              key={item.id}
                              className={`border-b border-border hover:bg-muted/30 cursor-pointer transition-colors ${
                                selectedAnnotationId === item.id
                                  ? "bg-primary/10 border-primary/30"
                                  : ""
                              }`}
                              onClick={() => {
                                loadSpecificAnnotation(item.id);
                                setActiveTab("workspace");
                              }}
                            >
                              <td className="p-3 text-sm text-muted-foreground">
                                {index + 1}
                              </td>
                              <td className="p-3 text-sm text-foreground font-medium">
                                {item.image_id}
                              </td>
                              <td className="p-3">
                                <span
                                  className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium border w-16 ${getStatusColor(
                                    item.annotation_status
                                  )}`}
                                >
                                  {formatStatusBadge(item.annotation_status)}
                                </span>
                              </td>
                              <td className="p-3 text-sm text-muted-foreground">
                                {new Date(item.updated_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          No annotation data available
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-primary/20 text-primary border border-primary/30 rounded-lg font-medium hover:bg-primary/30 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>

                <button
                  onClick={handleExportJSON}
                  className="flex items-center gap-2 px-4 py-2 bg-accent/20 text-accent border border-accent/30 rounded-lg font-medium hover:bg-accent/30 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Export JSON
                </button>

                <button
                  onClick={handleClearAll}
                  disabled={isLoadingStatus}
                  className="flex items-center gap-2 px-4 py-2 bg-destructive/20 text-destructive border border-destructive/30 rounded-lg font-medium hover:bg-destructive/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoadingStatus ? (
                    <PixelLoader
                      message="Clearing..."
                      size="sm"
                      variant="dots"
                    />
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Clear All
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8">
            <p className="text-sm text-muted-foreground text-center">
              made with ❤️ for thesis ig
            </p>
          </div>
        </div>

        {/* Image Modal */}
        {isImageModalOpen && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              {/* Close Button */}
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors z-10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Full Size Image */}
              <div className="relative w-full h-full">
                <Image
                  src={apiResponse?.image_url || mockImageData.path}
                  alt="Meme to annotate - Full Size"
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </div>
        )}

        {/* Meme Grid Tab */}
        {activeTab === "grid" && (
          <div className="space-y-6">
            {/* Grid Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-foreground">
                Meme Grid View
              </h3>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  Showing {getGridItems().length} of{" "}
                  {statusData?.memes?.length || 0} memes
                </span>
              </div>
            </div>

            {/* Grid Error Message */}
            {statusError && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-sm text-red-500 font-medium">
                    {statusError}
                  </p>
                </div>
              </div>
            )}

            {/* Grid Loading State */}
            {isLoadingStatus && !statusData && (
              <div className="flex items-center justify-center py-12">
                <MemeLoader />
              </div>
            )}

            {/* Meme Grid */}
            {statusData?.memes && getGridItems().length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {getGridItems().map((item: any) => (
                  <div
                    key={item.id}
                    className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      selectedAnnotationId === item.id
                        ? "border-primary shadow-lg scale-105"
                        : "border-border hover:border-primary/50"
                    } ${getStatusOverlay(item.annotation_status)}`}
                    onClick={() => {
                      loadSpecificAnnotation(item.id);
                      setActiveTab("workspace");
                    }}
                  >
                    {/* Image */}
                    <div className="aspect-square relative">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.image_id || "Meme"}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <div className="text-gray-500 text-sm text-center p-2">
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <div className="text-xs">
                              {item.image_id || "No Image"}
                            </div>
                            <div className="text-xs mt-1">
                              Image not available
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Status Color Overlay */}
                      {getStatusColorOverlay(item.annotation_status) && (
                        <div
                          className={`absolute inset-0 ${getStatusColorOverlay(
                            item.annotation_status
                          )} transition-opacity duration-300`}
                        />
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="bg-white/90 rounded-full p-2">
                            <Edit3 className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Meme Info */}
                    <div className="p-3 bg-card">
                      <div className="text-sm font-medium text-foreground truncate">
                        {item.image_id}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {formatStatusBadge(item.annotation_status)}
                      </div>
                      {item.updated_at && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(item.updated_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {statusData?.memes && getGridItems().length === 0 && (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <Grid3X3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No memes found</p>
                  <p className="text-sm">
                    Try adjusting your filter or check back later.
                  </p>
                </div>
              </div>
            )}

            {/* Load More Indicator */}
            {statusData?.memes &&
              getGridItems().length < (statusData.memes.length || 0) && (
                <div className="text-center py-4">
                  <PixelLoader
                    message="Scroll down to load more memes..."
                    size="sm"
                    variant="dots"
                  />
                </div>
              )}
          </div>
        )}
      </div>
    </LoadingOverlay>
  );
}

export default function AnnotationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <DataLoader size="lg" />
          </div>
        </div>
      }
    >
      <AnnotationPageContent />
    </Suspense>
  );
}
