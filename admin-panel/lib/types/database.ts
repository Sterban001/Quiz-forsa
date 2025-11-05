export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'user'
          display_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'user'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'user'
          display_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tests: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string | null
          tags: string[]
          cover_image_url: string | null
          time_limit_minutes: number | null
          start_at: string | null
          end_at: string | null
          per_question_time_seconds: number | null
          visibility: 'public' | 'private' | 'unlisted'
          access_code: string | null
          max_attempts: number
          pass_score: number
          negative_marking: boolean
          shuffle_questions: boolean
          show_correct_answers: boolean
          show_explanations: boolean
          status: 'draft' | 'published' | 'archived'
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category?: string | null
          tags?: string[]
          cover_image_url?: string | null
          time_limit_minutes?: number | null
          start_at?: string | null
          end_at?: string | null
          per_question_time_seconds?: number | null
          visibility?: 'public' | 'private' | 'unlisted'
          access_code?: string | null
          max_attempts?: number
          pass_score?: number
          negative_marking?: boolean
          shuffle_questions?: boolean
          show_correct_answers?: boolean
          show_explanations?: boolean
          status?: 'draft' | 'published' | 'archived'
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string | null
          tags?: string[]
          cover_image_url?: string | null
          time_limit_minutes?: number | null
          start_at?: string | null
          end_at?: string | null
          per_question_time_seconds?: number | null
          visibility?: 'public' | 'private' | 'unlisted'
          access_code?: string | null
          max_attempts?: number
          pass_score?: number
          negative_marking?: boolean
          shuffle_questions?: boolean
          show_correct_answers?: boolean
          show_explanations?: boolean
          status?: 'draft' | 'published' | 'archived'
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      sections: {
        Row: {
          id: string
          test_id: string
          title: string
          description: string | null
          order_index: number
          per_section_time_seconds: number | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          title: string
          description?: string | null
          order_index?: number
          per_section_time_seconds?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          title?: string
          description?: string | null
          order_index?: number
          per_section_time_seconds?: number | null
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          test_id: string
          section_id: string | null
          type: 'mcq_single' | 'mcq_multi' | 'short_text' | 'number'
          prompt: string
          explanation: string | null
          order_index: number
          points: number
          tolerance_numeric: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          test_id: string
          section_id?: string | null
          type: 'mcq_single' | 'mcq_multi' | 'short_text' | 'number'
          prompt: string
          explanation?: string | null
          order_index?: number
          points?: number
          tolerance_numeric?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          section_id?: string | null
          type?: 'mcq_single' | 'mcq_multi' | 'short_text' | 'number'
          prompt?: string
          explanation?: string | null
          order_index?: number
          points?: number
          tolerance_numeric?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      question_options: {
        Row: {
          id: string
          question_id: string
          label: string
          is_correct: boolean
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          question_id: string
          label: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          question_id?: string
          label?: string
          is_correct?: boolean
          order_index?: number
          created_at?: string
        }
      }
      attempts: {
        Row: {
          id: string
          test_id: string
          user_id: string
          started_at: string
          submitted_at: string | null
          score: number
          max_score: number
          status: 'in_progress' | 'submitted' | 'graded'
          duration_seconds: number
          attempt_no: number
          device_info: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          user_id: string
          started_at?: string
          submitted_at?: string | null
          score?: number
          max_score?: number
          status?: 'in_progress' | 'submitted' | 'graded'
          duration_seconds?: number
          attempt_no?: number
          device_info?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          user_id?: string
          started_at?: string
          submitted_at?: string | null
          score?: number
          max_score?: number
          status?: 'in_progress' | 'submitted' | 'graded'
          duration_seconds?: number
          attempt_no?: number
          device_info?: Json | null
          created_at?: string
        }
      }
      attempt_answers: {
        Row: {
          id: string
          attempt_id: string
          question_id: string
          response_json: Json | null
          is_correct: boolean | null
          awarded_points: number
          time_spent_seconds: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          question_id: string
          response_json?: Json | null
          is_correct?: boolean | null
          awarded_points?: number
          time_spent_seconds?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          question_id?: string
          response_json?: Json | null
          is_correct?: boolean | null
          awarded_points?: number
          time_spent_seconds?: number
          created_at?: string
          updated_at?: string
        }
      }
      test_whitelist: {
        Row: {
          test_id: string
          user_id: string
          granted_at: string
          granted_by: string | null
        }
        Insert: {
          test_id: string
          user_id: string
          granted_at?: string
          granted_by?: string | null
        }
        Update: {
          test_id?: string
          user_id?: string
          granted_at?: string
          granted_by?: string | null
        }
      }
      leaderboards: {
        Row: {
          id: number
          test_id: string
          user_id: string
          best_score: number
          best_time_seconds: number | null
          attempt_count: number
          updated_at: string
        }
        Insert: {
          id?: number
          test_id: string
          user_id: string
          best_score?: number
          best_time_seconds?: number | null
          attempt_count?: number
          updated_at?: string
        }
        Update: {
          id?: number
          test_id?: string
          user_id?: string
          best_score?: number
          best_time_seconds?: number | null
          attempt_count?: number
          updated_at?: string
        }
      }
    }
    Views: {
      test_statistics: {
        Row: {
          test_id: string
          title: string
          category: string | null
          status: string
          total_attempts: number
          completed_attempts: number
          unique_users: number
          avg_score: number | null
          avg_duration_seconds: number | null
          pass_rate: number | null
        }
      }
      question_difficulty: {
        Row: {
          question_id: string
          test_id: string
          type: string
          prompt: string
          total_responses: number
          correct_responses: number
          correct_percentage: number | null
          avg_time_seconds: number | null
        }
      }
    }
    Functions: {
      is_test_available_to_user: {
        Args: { test_id_param: string; user_id_param: string }
        Returns: boolean
      }
      calculate_attempt_score: {
        Args: { attempt_id_param: string }
        Returns: void
      }
    }
  }
}

// Helper types
export type Test = Database['public']['Tables']['tests']['Row']
export type TestInsert = Database['public']['Tables']['tests']['Insert']
export type TestUpdate = Database['public']['Tables']['tests']['Update']

export type Question = Database['public']['Tables']['questions']['Row']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type QuestionUpdate = Database['public']['Tables']['questions']['Update']

export type QuestionOption = Database['public']['Tables']['question_options']['Row']
export type QuestionOptionInsert = Database['public']['Tables']['question_options']['Insert']
export type QuestionOptionUpdate = Database['public']['Tables']['question_options']['Update']

export type Section = Database['public']['Tables']['sections']['Row']
export type SectionInsert = Database['public']['Tables']['sections']['Insert']
export type SectionUpdate = Database['public']['Tables']['sections']['Update']

export type Attempt = Database['public']['Tables']['attempts']['Row']
export type AttemptAnswer = Database['public']['Tables']['attempt_answers']['Row']

export type TestStatistics = Database['public']['Views']['test_statistics']['Row']
export type QuestionDifficulty = Database['public']['Views']['question_difficulty']['Row']

// Combined types for forms
export interface QuestionWithOptions extends Question {
  question_options: QuestionOption[]
}

export interface TestWithDetails extends Test {
  questions: QuestionWithOptions[]
  sections: Section[]
}
