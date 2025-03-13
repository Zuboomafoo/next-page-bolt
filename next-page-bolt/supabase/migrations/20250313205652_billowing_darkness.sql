/*
  # Add dismissed recommendations table

  1. New Tables
    - `dismissed_recommendations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `book_id` (uuid, references books)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `dismissed_recommendations` table
    - Add policy for authenticated users to manage their dismissed recommendations
*/

CREATE TABLE IF NOT EXISTS dismissed_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_id)
);

ALTER TABLE dismissed_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their dismissed recommendations"
  ON dismissed_recommendations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);