export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      annotators: {
        Row: {
          id: string;
          name: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          name: string;
          bucket: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bucket?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          bucket?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      annotations: {
        Row: {
          id: string;
          image_id: string;
          image_path: string;
          folder_id: string;
          assigned_to: string;
          annotation_status:
            | "pending"
            | "in_progress"
            | "completed"
            | "skipped"
            | "reviewed";
          image_description: string | null;
          entity: string | null;
          role: "hero" | "villain" | "victim" | "other" | null;
          role_explanation: string | null;
          entity_2: string | null;
          role_2: "hero" | "villain" | "victim" | "other" | null;
          role_explanation_2: string | null;
          humor_explanation: string | null;
          context: string | null;
          domain:
            | "politics"
            | "education"
            | "health"
            | "religion"
            | "society"
            | "pop_culture"
            | "economy"
            | "environment"
            | "others"
            | null;
          ocr_text: string | null;
          free_form: string | null;
          in_progress_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          image_id: string;
          image_path: string;
          folder_id: string;
          assigned_to: string;
          annotation_status?:
            | "pending"
            | "in_progress"
            | "completed"
            | "skipped"
            | "reviewed";
          image_description?: string | null;
          entity?: string | null;
          role?: "hero" | "villain" | "victim" | "other" | null;
          role_explanation?: string | null;
          entity_2?: string | null;
          role_2?: "hero" | "villain" | "victim" | "other" | null;
          role_explanation_2?: string | null;
          humor_explanation?: string | null;
          context?: string | null;
          domain?:
            | "politics"
            | "education"
            | "health"
            | "religion"
            | "society"
            | "pop_culture"
            | "economy"
            | "environment"
            | "others"
            | null;
          ocr_text?: string | null;
          free_form?: string | null;
          in_progress_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          image_id?: string;
          image_path?: string;
          folder_id?: string;
          assigned_to?: string;
          annotation_status?:
            | "pending"
            | "in_progress"
            | "completed"
            | "skipped"
            | "reviewed";
          image_description?: string | null;
          entity?: string | null;
          role?: "hero" | "villain" | "victim" | "other" | null;
          role_explanation?: string | null;
          entity_2?: string | null;
          role_2?: "hero" | "villain" | "victim" | "other" | null;
          role_explanation_2?: string | null;
          humor_explanation?: string | null;
          context?: string | null;
          domain?:
            | "politics"
            | "education"
            | "health"
            | "religion"
            | "society"
            | "pop_culture"
            | "economy"
            | "environment"
            | "others"
            | null;
          ocr_text?: string | null;
          free_form?: string | null;
          in_progress_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      geminikeys: {
        Row: {
          id: string;
          name: string;
          for_user: string;
          key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          for_user: string;
          key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          for_user?: string;
          key?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      annotator_summary: {
        Row: {
          id: string;
          name: string;
          total_memes_assigned: number;
          completed_annotations: number;
          folders_assigned: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          total_memes_assigned: number;
          completed_annotations: number;
          folders_assigned: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          total_memes_assigned?: number;
          completed_annotations?: number;
          folders_assigned?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      folder_stats: {
        Row: {
          id: string;
          name: string;
          total_memes: number;
          completed_memes: number;
          pending_memes: number;
          in_progress_memes: number;
          skipped_memes: number;
          reviewed_memes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          total_memes: number;
          completed_memes: number;
          pending_memes: number;
          in_progress_memes: number;
          skipped_memes: number;
          reviewed_memes: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          total_memes?: number;
          completed_memes?: number;
          pending_memes?: number;
          in_progress_memes?: number;
          skipped_memes?: number;
          reviewed_memes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
