"use client";

import { useState } from "react";
import { PixelLoader } from "@/components/ui/pixel-loader";

interface StatusTableProps {
  statusData: any;
  isLoadingStatus: boolean;
  statusError: string | null;
  statusFilter: string;
  selectedAnnotationId: string | null;
  onFilterChange: (filter: string) => void;
  onRetry: () => void;
  onRowClick: (itemId: string) => void;
  getStatusCounts: () => {
    completed: number;
    reviewed: number;
    skipped: number;
    pending: number;
    inProgress: number;
    total: number;
  };
  getStatusColor: (status: string) => string;
  formatStatusBadge: (status: string) => string;
}

export default function StatusTable({
  statusData,
  isLoadingStatus,
  statusError,
  statusFilter,
  selectedAnnotationId,
  onFilterChange,
  onRetry,
  onRowClick,
  getStatusCounts,
  getStatusColor,
  formatStatusBadge,
}: StatusTableProps) {
  const counts = getStatusCounts();

  return (
    <div className="space-y-6">
      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card/50 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-chart-3">
            {isLoadingStatus ? (
              <div className="w-8 h-8 bg-chart-3/20 rounded animate-pulse mx-auto" />
            ) : (
              counts.completed
            )}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {isLoadingStatus ? (
              <div className="w-8 h-8 bg-primary/20 rounded animate-pulse mx-auto" />
            ) : (
              counts.reviewed
            )}
          </div>
          <div className="text-sm text-muted-foreground">Reviewed</div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-chart-4">
            {isLoadingStatus ? (
              <div className="w-8 h-8 bg-chart-4/20 rounded animate-pulse mx-auto" />
            ) : (
              counts.skipped
            )}
          </div>
          <div className="text-sm text-muted-foreground">Skipped</div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-muted-foreground">
            {isLoadingStatus ? (
              <div className="w-8 h-8 bg-muted/20 rounded animate-pulse mx-auto" />
            ) : (
              counts.pending
            )}
          </div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </div>
        <div className="bg-card/50 rounded-lg border p-4 text-center">
          <div className="text-2xl font-bold text-primary">
            {isLoadingStatus ? (
              <div className="w-8 h-8 bg-primary/20 rounded animate-pulse mx-auto" />
            ) : (
              counts.total
            )}
          </div>
          <div className="text-sm text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Status Error Message */}
      {statusError && (
        <div className="p-4 bg-destructive/20 border border-destructive/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-destructive rounded-full"></div>
            <p className="text-sm text-destructive font-medium">
              {statusError}
            </p>
          </div>
          <button
            onClick={onRetry}
            disabled={isLoadingStatus}
            className="mt-2 text-xs text-destructive hover:underline disabled:opacity-50"
          >
            {isLoadingStatus ? (
              <PixelLoader message="Retrying..." size="sm" variant="dots" />
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
            <span className="text-sm text-muted-foreground">Filter:</span>
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
                  onClick={() => onFilterChange(filter.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    statusFilter === filter.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
              <div className="text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Loading status data...
                </p>
              </div>
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
                      onClick={() => onRowClick(item.id)}
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
                <div className="text-muted-foreground">
                  <div className="w-12 h-12 mx-auto mb-4 opacity-50">
                    <svg
                      className="w-full h-full"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="text-lg font-medium">No annotations found</p>
                  <p className="text-sm">
                    Try adjusting your filter or check back later.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
