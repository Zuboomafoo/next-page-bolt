/*
  # Enhanced Book Recommendation System

  1. New Tables
    - `user_preferences`
      - Stores user reading preferences and patterns
      - Links to auth.users
      - Tracks favorite genres, authors, and reading level
    
    - `book_ratings`
      - Stores detailed user ratings and reviews
      - Includes rating score, review text, and timestamp
      - Links to books and users tables

  2. Changes
    - Add new columns to books table for enhanced metadata
    - Add indexes for performance optimization
    
  3. Security
    - Enable RLS on new tables
    - Add policies for user data protection
*/

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  favorite_genres text[] DEFAULT '{}',
  favorite_authors text[] DEFAULT '{}',
  reading_level text DEFAULT 'intermediate',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id)
);

-- Create book_ratings table
CREATE TABLE IF NOT EXISTS book_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  review text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, book_id)
);

-- Add new columns to books table
ALTER TABLE books ADD COLUMN IF NOT EXISTS reading_level text;
ALTER TABLE books ADD COLUMN IF NOT EXISTS themes text[];
ALTER TABLE books ADD COLUMN IF NOT EXISTS similar_authors text[];

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_book_ratings_user_id ON book_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_book_ratings_book_id ON book_ratings(book_id);
CREATE INDEX IF NOT EXISTS idx_books_genres ON books USING gin(genres);
CREATE INDEX IF NOT EXISTS idx_books_themes ON books USING gin(themes);
CREATE INDEX IF NOT EXISTS idx_user_preferences_genres ON user_preferences USING gin(favorite_genres);

-- Enable RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can read their own preferences"
  ON user_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for book_ratings
CREATE POLICY "Users can read all ratings"
  ON book_ratings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage their own ratings"
  ON book_ratings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);