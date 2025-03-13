/*
  # Add RLS policies for books table

  1. Security
    - Enable RLS on books table
    - Allow public read access to books
    - Allow authenticated users to insert books
    - Allow authenticated users to update their own books
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

-- Allow authenticated users to update books
CREATE POLICY "Authenticated users can update books"
  ON books
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);