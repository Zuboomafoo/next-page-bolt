/*
  # Add RLS policies for books table

  1. Security Changes
    - Enable RLS on books table
    - Add policies to allow:
      - Anyone to read books
      - Authenticated users to insert books
      - No one can update or delete books (read-only)
*/

-- Enable RLS
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read books
CREATE POLICY "Anyone can read books"
  ON books
  FOR SELECT
  TO public
  USING (true);

-- Allow authenticated users to insert books
CREATE POLICY "Authenticated users can insert books"
  ON books
  FOR INSERT
  TO authenticated
  WITH CHECK (true);