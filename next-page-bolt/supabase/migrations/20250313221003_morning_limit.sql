/*
  # Add feedback system tables and functions

  1. New Tables
    - `book_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `book_id` (uuid, references books)
      - `feedback_type` (text, 'negative' for thumbs down)
      - `created_at` (timestamp)
    - `genre_preferences`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `genre` (text)
      - `weight` (float, default 1.0)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on new tables
    - Add policies for authenticated users

  3. Functions
    - Add function to update genre weights based on feedback
*/

-- Create book feedback table
CREATE TABLE IF NOT EXISTS book_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  feedback_type text NOT NULL CHECK (feedback_type IN ('negative')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Create genre preferences table
CREATE TABLE IF NOT EXISTS genre_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  genre text NOT NULL,
  weight float NOT NULL DEFAULT 1.0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, genre)
);

-- Enable RLS
ALTER TABLE book_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE genre_preferences ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can manage their own feedback"
  ON book_feedback
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their genre preferences"
  ON genre_preferences
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_book_feedback_user ON book_feedback(user_id);
CREATE INDEX idx_book_feedback_book ON book_feedback(book_id);
CREATE INDEX idx_genre_preferences_user ON genre_preferences(user_id);
CREATE INDEX idx_genre_preferences_genre ON genre_preferences(genre);

-- Function to update genre weights based on negative feedback
CREATE OR REPLACE FUNCTION update_genre_weights_on_feedback()
RETURNS TRIGGER AS $$
BEGIN
  -- For negative feedback, decrease weights for the book's genres
  IF NEW.feedback_type = 'negative' THEN
    INSERT INTO genre_preferences (user_id, genre, weight)
    SELECT 
      NEW.user_id,
      unnest(b.genres),
      0.8 -- Decrease weight by 20%
    FROM books b
    WHERE b.id = NEW.book_id
    ON CONFLICT (user_id, genre)
    DO UPDATE SET 
      weight = LEAST(genre_preferences.weight * 0.8, 1.0),
      updated_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for feedback
CREATE TRIGGER on_book_feedback
  AFTER INSERT ON book_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_genre_weights_on_feedback();