"use client";

import Image from "next/image";
import { Grid3X3, ImageIcon, Edit3 } from "lucide-react";
import { PixelLoader } from "@/components/ui/pixel-loader";

interface MemeGridProps {
  statusData: any;
  isLoadingStatus: boolean;
  statusError: string | null;
  selectedAnnotationId: string | null;
  onItemClick: (itemId: string) => void;
  getGridItems: () => any[];
  getStatusOverlay: (status: string) => string;
  getStatusColorOverlay: (status: string) => string;
  formatStatusBadge: (status: string) => string;
}

export default function MemeGrid({
  statusData,
  isLoadingStatus,
  statusError,
  selectedAnnotationId,
  onItemClick,
  getGridItems,
  getStatusOverlay,
  getStatusColorOverlay,
  formatStatusBadge,
}: MemeGridProps) {
  const gridItems = getGridItems();

  return (
    <div className="space-y-6">
      {/* Grid Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-foreground">Meme Grid View</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            Showing {gridItems.length} of {statusData?.memes?.length || 0} memes
          </span>
        </div>
      </div>

      {/* Grid Error Message */}
      {statusError && (
        <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <p className="text-sm text-red-500 font-medium">{statusError}</p>
          </div>
        </div>
      )}

      {/* Grid Loading State */}
      {isLoadingStatus && !statusData && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Loading memes...</p>
          </div>
        </div>
      )}

      {/* Meme Grid */}
      {statusData?.memes && gridItems.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {gridItems.map((item: any) => (
            <div
              key={item.id}
              className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                selectedAnnotationId === item.id
                  ? "border-primary shadow-lg scale-105"
                  : "border-border hover:border-primary/50"
              } ${getStatusOverlay(item.annotation_status)}`}
              onClick={() => onItemClick(item.id)}
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
                      <div className="text-xs mt-1">Image not available</div>
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
      {statusData?.memes && gridItems.length === 0 && (
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
        gridItems.length < (statusData.memes.length || 0) && (
          <div className="text-center py-4">
            <PixelLoader
              message="Scroll down to load more memes..."
              size="sm"
              variant="dots"
            />
          </div>
        )}
    </div>
  );
}
