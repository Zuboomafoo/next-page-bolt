/*
  # Update books table RLS policies

  1. Security
    - Enable RLS on books table (if not already enabled)
    - Add policies for books table (if they don't exist):
      - Public read access
      - Authenticated users can insert books
      - Authenticated users can update books
*/

DO $$ BEGIN
  -- Enable RLS if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'books' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE books ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create policies if they don't exist
DO $$ BEGIN
  -- Public read access policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'books' 
    AND policyname = 'Anyone can read books'
  ) THEN
    CREATE POLICY "Anyone can read books"
      ON books
      FOR SELECT
      TO public
      USING (true);
  END IF;

  -- Authenticated users insert policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'books' 
    AND policyname = 'Authenticated users can insert books'
  ) THEN
    CREATE POLICY "Authenticated users can insert books"
      ON books
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;

  -- Authenticated users update policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'books' 
    AND policyname = 'Authenticated users can update books'
  ) THEN
    CREATE POLICY "Authenticated users can update books"
      ON books
      FOR UPDATE
      TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;