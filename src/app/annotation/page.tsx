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
  ChevronLeft,
  ChevronRight,
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
import StatusTable from "@/components/annotation/StatusTable";
import MemeGrid from "@/components/annotation/MemeGrid";
import APISetup from "@/components/annotation/APISetup";

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
  entity_2: string;
  role_2: RoleEnum | "";
  role_explanation_2: string;
  humor_explanation: string;
  context: string;
  domain: DomainEnum | "";
  free_form: string;
}

// Mock data - in real app this would come from API
const mockImageData = {
  id: "img_001",
  path: "/politics.jpeg", // This would be the actual image path from DB
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
    entity_2: "",
    role_2: "",
    role_explanation_2: "",
    humor_explanation: "",
    context: "",
    domain: "",
    free_form: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "workspace" | "status" | "grid" | "api-setup"
  >("workspace");
  const [formTab, setFormTab] = useState<"human" | "ai">("human");
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [skipSuccess, setSkipSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [aiFillupSuccess, setAiFillupSuccess] = useState(false);
  const [isGeneratingFillup, setIsGeneratingFillup] = useState(false);
  const [aiFillupError, setAiFillupError] = useState<string | null>(null);
  const [aiFillupRawResponse, setAiFillupRawResponse] = useState<string | null>(
    null
  );
  const [showRawResponse, setShowRawResponse] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
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

  // Get user and folder from URL parameters
  const userName = searchParams.get("user") || "";
  const folderName = searchParams.get("folder") || "";

  // Handle API key selection - only track if key exists, not the actual value
  const handleApiKeySelected = useCallback(
    (keyId: string, keyValue: string) => {
      // Only track if a key exists (keyId is not empty), never store the actual key value
      setHasApiKey(!!keyId);
    },
    []
  );

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
        entity_2: annotation.entity_2 || "",
        role_2: annotation.role_2 || "",
        role_explanation_2: annotation.role_explanation_2 || "",
        humor_explanation: annotation.humor_explanation || "",
        context: annotation.context || "",
        domain: annotation.domain || "",
        free_form: annotation.free_form || "",
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

  // Validation functions for each tab
  const validateEntitiesTab = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.entity.trim()) {
      errors.entity = "Entity is required";
    }

    if (!formData.role) {
      errors.role = "Role is required";
    }

    if (!formData.role_explanation.trim()) {
      errors.role_explanation = "Role explanation is required";
    }

    if (!formData.domain) {
      errors.domain = "Domain is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateAnalysisTab = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.image_description.trim()) {
      errors.image_description = "Image description is required";
    }

    if (!formData.humor_explanation.trim()) {
      errors.humor_explanation = "Humor explanation is required";
    }

    if (!formData.context.trim()) {
      errors.context = "Context is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Full form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // For human form, only validate free_form
    if (formTab === "human") {
      if (!formData.free_form.trim()) {
        errors.free_form = "Free form annotation is required";
      }
    } else {
      // For complex form, validate all fields
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
          image_description: formData.image_description,
          entity: formData.entity,
          role: formData.role,
          role_explanation: formData.role_explanation,
          entity_2: formData.entity_2,
          role_2: formData.role_2,
          role_explanation_2: formData.role_explanation_2,
          humor_explanation: formData.humor_explanation,
          context: formData.context,
          domain: formData.domain || null,
          free_form: formData.free_form,
          markAsCompleted: formTab === "ai", // Mark as completed only when saving from AI form
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      // Success
      setSaveSuccess(true);
      setSaveError(null);

      // Clear validation errors
      setValidationErrors({});

      // If saving from human form, switch to AI form tab
      if (formTab === "human") {
        // Don't reset form data - keep it for AI form
        // Don't clear selected annotation ID - stay on current annotation
        // Don't fetch next annotation - stay on current meme

        // Show success message
        setTimeout(() => {
          setSaveSuccess(false);
        }, 3000);

        // Switch to AI form tab to fill up extra details with AI
        setFormTab("ai");
      } else {
        // If saving from AI form, mark as completed and move to next meme
        // Reset form after successful submission
        setFormData({
          image_description: "",
          entity: "",
          role: "",
          role_explanation: "",
          entity_2: "",
          role_2: "",
          role_explanation_2: "",
          humor_explanation: "",
          context: "",
          domain: "",
          free_form: "",
        });

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
              // Switch back to human form for next annotation
              setFormTab("human");
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
              // Switch back to human form
              setFormTab("human");
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

  const handleNavigate = async (direction: "prev" | "next") => {
    // Check if we have the required data
    if (!apiResponse?.annotation?.id || !userName || !folderName) {
      setApiError("Missing annotation data or user information");
      return;
    }

    setIsLoadingApi(true);
    setApiError(null);
    setSaveError(null);
    setSaveSuccess(false);
    setSkipSuccess(false);

    try {
      const response = await fetch(
        `/api/navigate-annotation?annotationId=${encodeURIComponent(
          apiResponse.annotation.id
        )}&annotator=${encodeURIComponent(userName)}&folder=${encodeURIComponent(
          folderName
        )}&direction=${direction}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.message) {
        // No previous/next annotation available
        setApiError(data.message);
        return;
      }

      // Load the annotation data into form
      if (data.annotation) {
        setApiResponse(data);
        setSelectedAnnotationId(data.annotation.id);

        // Populate form with existing annotation data if available
        setFormData({
          image_description: data.annotation.image_description || "",
          entity: data.annotation.entity || "",
          role: (data.annotation.role as RoleEnum) || "",
          role_explanation: data.annotation.role_explanation || "",
          entity_2: data.annotation.entity_2 || "",
          role_2: (data.annotation.role_2 as RoleEnum) || "",
          role_explanation_2: data.annotation.role_explanation_2 || "",
          humor_explanation: data.annotation.humor_explanation || "",
          context: data.annotation.context || "",
          domain: (data.annotation.domain as DomainEnum) || "",
          free_form: data.annotation.free_form || "",
        });

        // Switch to human form tab when navigating
        setFormTab("human");
      }
    } catch (error: any) {
      console.error("Navigation Error:", error);
      setApiError(
        error.message || `Failed to navigate ${direction === "prev" ? "back" : "forward"}`
      );
    } finally {
      setIsLoadingApi(false);
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
            setSkipSuccess(true);
            setTimeout(() => {
              setSkipSuccess(false);
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
        setSkipSuccess(true);
        setTimeout(() => {
          setSkipSuccess(false);
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

  const handleAIFillup = async () => {
    if (!apiResponse?.image_url || !formData.free_form) {
      setAiFillupError(
        "Image and free form annotation are required for AI fillup"
      );
      return;
    }

    // Check if user has configured an API key (server will verify, but check here for UX)
    if (!hasApiKey) {
      setAiFillupError(
        "No API key configured. Please set up your Gemini API key in the API Setup tab first."
      );
      return;
    }

    if (!userName) {
      setAiFillupError("User name is required");
      return;
    }

    setIsGeneratingFillup(true);
    setAiFillupError(null);
    setAiFillupSuccess(false);
    setAiFillupRawResponse(null);

    try {
      const response = await fetch("/api/ai-fillup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageUrl: apiResponse.image_url,
          context: formData.free_form,
          for_user: userName, // Pass user name instead of API key
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI fillup failed");
      }

      // Store raw response for debugging
      setAiFillupRawResponse(
        data.rawResponse || JSON.stringify(data.data, null, 2)
      );

      // Auto-populate form fields with AI-generated data
      if (data.data) {
        setFormData((prev) => ({
          ...prev,
          entity: data.data.entity || prev.entity,
          role: data.data.role || prev.role,
          role_explanation: data.data.role_explanation || prev.role_explanation,
          entity_2: data.data.entity_2 || prev.entity_2,
          role_2: data.data.role_2 || prev.role_2,
          role_explanation_2:
            data.data.role_explanation_2 || prev.role_explanation_2,
          humor_explanation:
            data.data.humor_explanation || prev.humor_explanation,
          context: data.data.context || prev.context,
          domain: data.data.domain || prev.domain,
          image_description:
            data.data.image_description || prev.image_description,
        }));

        setAiFillupSuccess(true);
        // Clear success message after 3 seconds
        setTimeout(() => setAiFillupSuccess(false), 3000);
      } else {
        setAiFillupError("No structured data received from AI");
      }

      if (data.error) {
        setAiFillupError(data.error);
      }
    } catch (error: any) {
      console.error("AI Fillup Error:", error);
      setAiFillupError(error.message || "Failed to generate AI fillup");
    } finally {
      setIsGeneratingFillup(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-chart-3/20 text-chart-3 border-chart-3/30";
      case "in_progress":
        return "bg-chart-2/20 text-chart-2 border-chart-2/30";
      case "reviewed":
        return "bg-primary/20 text-primary border-primary/30";
      case "skipped":
        return "bg-chart-4/20 text-chart-4 border-chart-4/30";
      case "pending":
        return "bg-muted/20 text-muted-foreground border-muted/30";
      default:
        return "bg-muted/20 text-muted-foreground border-muted/30";
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

  const handleExportCSV = async () => {
    if (!userName || !folderName) {
      setStatusError("Missing user or folder information");
      return;
    }

    try {
      setIsLoadingStatus(true);
      setStatusError(null);

      const response = await fetch(
        `/api/export-annotations-csv?annotator=${encodeURIComponent(
          userName
        )}&folder=${encodeURIComponent(folderName)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export annotations");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${userName}_${folderName}_annotations.csv`;

      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("CSV Export error:", error);
      setStatusError(error.message || "Failed to export annotations");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleExportJSON = async () => {
    if (!userName || !folderName) {
      setStatusError("Missing user or folder information");
      return;
    }

    try {
      setIsLoadingStatus(true);
      setStatusError(null);

      const response = await fetch(
        `/api/export-annotations?annotator=${encodeURIComponent(
          userName
        )}&folder=${encodeURIComponent(folderName)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export annotations");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `${userName}_${folderName}_annotations.json`;

      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Export error:", error);
      setStatusError(error.message || "Failed to export annotations");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleExportImageCSV = async () => {
    if (!userName || !folderName) {
      setStatusError("Missing user or folder information");
      return;
    }

    try {
      setIsLoadingStatus(true);
      setStatusError(null);

      const response = await fetch(
        `/api/export-image-urls-csv?annotator=${encodeURIComponent(
          userName
        )}&folder=${encodeURIComponent(folderName)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to export image URLs");
      }

      // Get the filename from the Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filename = contentDisposition
        ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
        : `image-urls-${userName}_${folderName}.csv`;

      // Create a blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: any) {
      console.error("Export error:", error);
      setStatusError(error.message || "Failed to export image URLs");
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handleClearAll = async () => {
    if (!userName || !folderName) {
      setStatusError("Missing user or folder information");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to clear all your annotation data for folder "${folderName}"?\n\nThis will:\n• Reset all your memes to "pending" status\n• Remove all your annotation text (descriptions, explanations)\n• Keep the meme assignments and system data\n\nThis action cannot be undone.`
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
          entity_2: "",
          role_2: "",
          role_explanation_2: "",
          humor_explanation: "",
          context: "",
          domain: "",
          free_form: "",
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
              <button
                onClick={() => setActiveTab("api-setup")}
                className={`px-6 py-3 rounded-md font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === "api-setup"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded"></div>
                API Setup
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "workspace" && (
            <div className="max-w-4xl mx-auto">
              {/* Form Interface */}
              <div className="space-y-6">
                {/* Navigation Buttons */}
                {apiResponse?.annotation?.id && (
                  <div className="flex justify-center items-center gap-6">
                    <button
                      type="button"
                      onClick={() => handleNavigate("prev")}
                      disabled={isLoadingApi}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed underline-offset-4 hover:underline"
                    >
                      {isLoadingApi ? (
                        <PixelLoader
                          message=""
                          size="sm"
                          variant="dots"
                        />
                      ) : (
                        <>
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigate("next")}
                      disabled={isLoadingApi}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed underline-offset-4 hover:underline"
                    >
                      {isLoadingApi ? (
                        <PixelLoader
                          message=""
                          size="sm"
                          variant="dots"
                        />
                      ) : (
                        <>
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Form Tab Navigation */}
                <div className="bg-card/50 rounded-lg border p-1">
                  <div className="flex">
                    <button
                      onClick={() => setFormTab("human")}
                      className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        formTab === "human"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Human Form
                    </button>
                    <button
                      onClick={() => setFormTab("ai")}
                      className={`flex-1 px-4 py-3 rounded-md font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        formTab === "ai"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                      }`}
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      AI Form
                    </button>
                  </div>
                </div>

                {/* Success/Error Messages */}
                {saveSuccess && (
                  <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <p className="text-sm text-green-500 font-medium">
                        Annotation saved successfully! 🎉
                      </p>
                    </div>
                  </div>
                )}

                {skipSuccess && (
                  <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <p className="text-sm text-yellow-500 font-medium">
                        Annotation skipped! Loading next annotation... ⏭️
                      </p>
                    </div>
                  </div>
                )}

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

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Human Form Tab */}
                  {formTab === "human" && (
                    <div className="space-y-6">
                      {/* Side-by-side layout for Image and Free Form Annotation */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Image Display */}
                        <div className="bg-card/50 rounded-lg border p-6">
                          <div className="mb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                              <ImageIcon className="w-5 h-5" />
                              Image to Annotate
                            </h2>
                          </div>

                          {/* Image - Reduced width to fit meme better */}
                          <div className="relative w-full mb-4 rounded-lg overflow-hidden border group h-80 bg-muted/20">
                            {isLoadingApi ? (
                              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                <MemeLoader />
                              </div>
                            ) : (
                              <>
                                <Image
                                  src={
                                    apiResponse?.image_url || mockImageData.path
                                  }
                                  alt="Meme to annotate"
                                  fill
                                  className="object-contain"
                                  sizes="100vw"
                                  quality={75}
                                />
                                {/* Zoom Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsImageModalOpen(true);
                                  }}
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

                          {/* Show API Error if any */}
                          {apiError && (
                            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <p className="text-sm text-red-500">
                                Error: {apiError}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Free Form Annotation */}
                        <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Free Form Annotation
                          </h3>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-foreground">
                              Your Annotation *
                            </label>
                            <textarea
                              value={formData.free_form}
                              onChange={(e) =>
                                handleInputChange("free_form", e.target.value)
                              }
                              placeholder="Write your annotation here... Describe what you see, the humor, context, entities, or any other observations about this meme."
                              className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                                validationErrors.free_form
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-border focus:ring-primary"
                              }`}
                              rows={8}
                              required
                            />
                            {validationErrors.free_form && (
                              <p className="text-sm text-red-500">
                                {validationErrors.free_form}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Submit Buttons */}
                      <div className="flex justify-end gap-4">
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

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      </div>
                    </div>
                  )}

                  {/* AI Form Tab */}
                  {formTab === "ai" && (
                    <div className="space-y-6">
                      {/* Side-by-side layout for Image and Free Form Annotation */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Image Display */}
                        <div className="bg-card/50 rounded-lg border p-6">
                          <div className="mb-4">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                              <ImageIcon className="w-5 h-5" />
                              Image to Annotate
                            </h2>
                          </div>

                          {/* Image */}
                          <div className="relative w-full mb-4 rounded-lg overflow-hidden border group h-80 bg-muted/20">
                            {isLoadingApi ? (
                              <div className="w-full h-full flex items-center justify-center bg-muted/50">
                                <MemeLoader />
                              </div>
                            ) : (
                              <>
                                <Image
                                  src={
                                    apiResponse?.image_url || mockImageData.path
                                  }
                                  alt="Meme to annotate"
                                  fill
                                  className="object-contain"
                                  sizes="100vw"
                                  quality={75}
                                />
                                {/* Zoom Button */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setIsImageModalOpen(true);
                                  }}
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

                          {/* Show API Error if any */}
                          {apiError && (
                            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                              <p className="text-sm text-red-500">
                                Error: {apiError}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Right Column - Free Form Annotation Display */}
                        <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            Free Form Annotation
                          </h3>

                          {formData.free_form ? (
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                  Saved Annotation:
                                </label>
                                <div className="p-3 border rounded-lg bg-muted/20 text-foreground whitespace-pre-wrap">
                                  {formData.free_form}
                                </div>
                              </div>

                              {/* Generate AI fillup button */}
                              <div className="pt-2">
                                <button
                                  type="button"
                                  onClick={handleAIFillup}
                                  disabled={isGeneratingFillup}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {isGeneratingFillup ? (
                                    <>
                                      <PixelLoader
                                        message="Generating..."
                                        size="sm"
                                        variant="dots"
                                      />
                                      Generating AI fillup...
                                    </>
                                  ) : (
                                    <>
                                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                                      Generate AI fillup
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* AI Fillup Success Display */}
                              {aiFillupSuccess && (
                                <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <p className="text-sm text-green-500 font-medium">
                                      ✅ AI fillup successful! Form fields have
                                      been populated.
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* AI Fillup Error Display */}
                              {aiFillupError && (
                                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                    <p className="text-sm text-red-500 font-medium">
                                      ❌ {aiFillupError}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* AI Fillup Raw Response Display */}
                              {aiFillupRawResponse && (
                                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-semibold text-blue-500">
                                      Raw AI Response (for debugging):
                                    </h4>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setShowRawResponse(!showRawResponse);
                                      }}
                                      className="text-xs text-blue-500 hover:text-blue-400 underline"
                                    >
                                      {showRawResponse ? "Hide" : "Show"} Raw
                                      Response
                                    </button>
                                  </div>
                                  {showRawResponse && (
                                    <pre className="text-xs text-foreground whitespace-pre-wrap overflow-auto max-h-60 bg-muted/20 p-3 rounded">
                                      {aiFillupRawResponse}
                                    </pre>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                No annotation saved yet
                              </label>
                              <div className="p-3 border rounded-lg bg-muted/20 text-muted-foreground italic">
                                This annotation will appear here once it's saved
                                from the Human Form.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 2 Columns below image */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Entities */}
                        <div className="space-y-6">
                          {/* Primary Entity Section */}
                          <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full"></div>
                              Primary Entity
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
                                  handleInputChange(
                                    "role",
                                    e.target.value as RoleEnum
                                  )
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

                            {/* Role Explanation */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Role Explanation *
                              </label>
                              <textarea
                                value={formData.role_explanation}
                                onChange={(e) =>
                                  handleInputChange(
                                    "role_explanation",
                                    e.target.value
                                  )
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
                          </div>

                          {/* Secondary Entity Section */}
                          <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-secondary rounded-full"></div>
                              Secondary Entity
                            </h3>

                            {/* Entity 2 */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Secondary Entity
                              </label>
                              <input
                                type="text"
                                value={formData.entity_2}
                                onChange={(e) =>
                                  handleInputChange("entity_2", e.target.value)
                                }
                                placeholder="Second entity or subject (optional)"
                                className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                                  validationErrors.entity_2
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-border focus:ring-primary"
                                }`}
                              />
                              {validationErrors.entity_2 && (
                                <p className="text-sm text-red-500">
                                  {validationErrors.entity_2}
                                </p>
                              )}
                            </div>

                            {/* Role 2 */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Secondary Entity's Role
                              </label>
                              <select
                                value={formData.role_2}
                                onChange={(e) =>
                                  handleInputChange(
                                    "role_2",
                                    e.target.value as RoleEnum
                                  )
                                }
                                className={`w-full p-3 border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 ${
                                  validationErrors.role_2
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-border focus:ring-primary"
                                }`}
                              >
                                <option value="">Select a role...</option>
                                <option value="hero">Hero</option>
                                <option value="villain">Villain</option>
                                <option value="victim">Victim</option>
                                <option value="other">Other</option>
                              </select>
                              {validationErrors.role_2 && (
                                <p className="text-sm text-red-500">
                                  {validationErrors.role_2}
                                </p>
                              )}
                            </div>

                            {/* Secondary Role Explanation */}
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Secondary Entity's Explanation
                              </label>
                              <textarea
                                value={formData.role_explanation_2}
                                onChange={(e) =>
                                  handleInputChange(
                                    "role_explanation_2",
                                    e.target.value
                                  )
                                }
                                placeholder="Explain why the secondary entity has this role..."
                                className={`w-full p-3 border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                                  validationErrors.role_explanation_2
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-border focus:ring-primary"
                                }`}
                                rows={4}
                              />
                              {validationErrors.role_explanation_2 && (
                                <p className="text-sm text-red-500">
                                  {validationErrors.role_explanation_2}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Analysis Fields */}
                        <div className="space-y-6">
                          {/* Humor Explanation */}
                          <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                              Humor Analysis
                            </h3>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Humor Explanation *
                              </label>
                              <textarea
                                value={formData.humor_explanation}
                                onChange={(e) =>
                                  handleInputChange(
                                    "humor_explanation",
                                    e.target.value
                                  )
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
                          </div>

                          {/* Domain Section */}
                          <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              Classification
                            </h3>

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

                          {/* Image Description */}
                          <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                              <div className="w-2 h-2 bg-accent rounded-full"></div>
                              Image Analysis
                            </h3>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-foreground">
                                Image Description *
                              </label>
                              <textarea
                                value={formData.image_description}
                                onChange={(e) =>
                                  handleInputChange(
                                    "image_description",
                                    e.target.value
                                  )
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
                          </div>

                          {/* Context */}
                          <div className="bg-card/50 rounded-lg border p-6 space-y-4">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              Context Analysis
                            </h3>

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
                          </div>
                        </div>
                      </div>

                      {/* Submit Buttons - Full Width */}
                      <div className="flex justify-end gap-4">
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

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer for workspace tab */}
              <div className="mt-12 pt-8">
                <p className="text-sm text-muted-foreground text-center">
                  made with ❤️ for thesis ig
                </p>
              </div>
            </div>
          )}

          {/* Status Table Tab */}
          {activeTab === "status" && (
            <div className="space-y-6">
              {/* Action Buttons */}
              <div className="bg-card/50 rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-foreground">
                    Data Management
                  </h3>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportCSV}
                      disabled={isLoadingStatus}
                      className="flex items-center gap-2 px-4 py-2 bg-chart-3/20 text-chart-3 border border-chart-3/30 rounded-lg font-medium hover:bg-chart-3/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingStatus ? (
                        <PixelLoader
                          message="Exporting..."
                          size="sm"
                          variant="dots"
                        />
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Export CSV
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportJSON}
                      disabled={isLoadingStatus}
                      className="flex items-center gap-2 px-4 py-2 bg-chart-2/20 text-chart-2 border border-chart-2/30 rounded-lg font-medium hover:bg-chart-2/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingStatus ? (
                        <PixelLoader
                          message="Exporting..."
                          size="sm"
                          variant="dots"
                        />
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          Export JSON
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleExportImageCSV}
                      disabled={isLoadingStatus}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-500 border border-blue-500/30 rounded-lg font-medium hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoadingStatus ? (
                        <PixelLoader
                          message="Exporting..."
                          size="sm"
                          variant="dots"
                        />
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Get Image CSV
                        </>
                      )}
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
                <p className="text-sm text-muted-foreground mt-2">
                  Export your annotations or clear all data for this folder
                </p>
              </div>

              <StatusTable
                statusData={statusData}
                isLoadingStatus={isLoadingStatus}
                statusError={statusError}
                statusFilter={statusFilter}
                selectedAnnotationId={selectedAnnotationId}
                onFilterChange={setStatusFilter}
                onRetry={() => fetchStatusData(statusFilter, true)}
                onRowClick={(itemId) => {
                  loadSpecificAnnotation(itemId);
                  setActiveTab("workspace");
                }}
                getStatusCounts={getStatusCounts}
                getStatusColor={getStatusColor}
                formatStatusBadge={formatStatusBadge}
              />

              {/* Footer for status tab */}
              <div className="mt-12 pt-8">
                <p className="text-sm text-muted-foreground text-center">
                  made with ❤️ for thesis ig
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Image Modal */}
        {isImageModalOpen && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              e.stopPropagation();
              if (e.target === e.currentTarget) {
                setIsImageModalOpen(false);
              }
            }}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full">
              {/* Close Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsImageModalOpen(false);
                }}
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
                  quality={85}
                />
              </div>
            </div>
          </div>
        )}

        {/* API Setup Tab */}
        {activeTab === "api-setup" && (
          <APISetup
            userName={userName}
            folderName={folderName}
            onKeySelected={handleApiKeySelected}
          />
        )}

        {/* Meme Grid Tab */}
        {activeTab === "grid" && (
          <MemeGrid
            statusData={statusData}
            isLoadingStatus={isLoadingStatus}
            statusError={statusError}
            selectedAnnotationId={selectedAnnotationId}
            onItemClick={(itemId) => {
              loadSpecificAnnotation(itemId);
              setActiveTab("workspace");
            }}
            getGridItems={getGridItems}
            getStatusOverlay={getStatusOverlay}
            getStatusColorOverlay={getStatusColorOverlay}
            formatStatusBadge={formatStatusBadge}
          />
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
