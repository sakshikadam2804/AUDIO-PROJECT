/*
  # Audio Emotion Analysis Database Schema

  1. New Tables
    - `recordings`
      - `id` (uuid, primary key)
      - `title` (text) - Optional title for the recording
      - `audio_url` (text) - URL to the audio file in storage
      - `duration` (integer) - Duration in seconds
      - `file_size` (integer) - File size in bytes
      - `file_type` (text) - MIME type of the audio file
      - `created_at` (timestamptz) - When the recording was created
      - `analyzed` (boolean) - Whether analysis is complete
      
    - `emotion_analyses`
      - `id` (uuid, primary key)
      - `recording_id` (uuid, foreign key) - Links to recordings table
      - `emotion` (text) - Primary detected emotion
      - `confidence` (decimal) - Confidence score (0-1)
      - `emotions_data` (jsonb) - Full emotion breakdown with all scores
      - `analysis_timestamp` (timestamptz) - When analysis was performed
      - `model_version` (text) - Version of the model used

  2. Security
    - Enable RLS on both tables
    - Public access for reading (for demo purposes)
    - Note: In production, you would restrict this to authenticated users
*/

CREATE TABLE IF NOT EXISTS recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  audio_url text NOT NULL,
  duration integer DEFAULT 0,
  file_size integer DEFAULT 0,
  file_type text,
  created_at timestamptz DEFAULT now(),
  analyzed boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS emotion_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recording_id uuid NOT NULL REFERENCES recordings(id) ON DELETE CASCADE,
  emotion text NOT NULL,
  confidence decimal(5,4) NOT NULL,
  emotions_data jsonb NOT NULL,
  analysis_timestamp timestamptz DEFAULT now(),
  model_version text DEFAULT 'hume-ai-v1'
);

ALTER TABLE recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to recordings"
  ON recordings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to recordings"
  ON recordings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to recordings"
  ON recordings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from recordings"
  ON recordings FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public read access to emotion_analyses"
  ON emotion_analyses FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Allow public insert to emotion_analyses"
  ON emotion_analyses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Allow public update to emotion_analyses"
  ON emotion_analyses FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete from emotion_analyses"
  ON emotion_analyses FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_emotion_analyses_recording_id ON emotion_analyses(recording_id);
CREATE INDEX IF NOT EXISTS idx_recordings_created_at ON recordings(created_at DESC);