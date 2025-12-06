export interface Recording {
  id: string;
  title: string | null;
  audio_url: string;
  duration: number;
  file_size: number;
  file_type: string | null;
  created_at: string;
  analyzed: boolean;
}

export interface EmotionScore {
  name: string;
  score: number;
}

export interface EmotionAnalysis {
  id: string;
  recording_id: string;
  emotion: string;
  confidence: number;
  emotions_data: {
    emotions: EmotionScore[];
  };
  analysis_timestamp: string;
  model_version: string;
}

export interface RecordingWithAnalysis extends Recording {
  emotion_analyses: EmotionAnalysis[];
}
