/*
  # Enhanced Recommendations System

  1. New Tables
    - `reading_sessions`
      - Tracks when users start/finish reading sessions
      - Helps understand reading patterns and engagement
    - `book_interactions`
      - Records detailed user interactions with books
      - Captures time spent, pages read, re-reads
    - `recommendation_metrics`
      - Stores success metrics for recommendations
      - Tracks which recommendations led to engagement

  2. Views
    - `user_reading_patterns`
      - Aggregates reading behavior data
    - `book_similarity_scores`
      - Pre-calculates book similarities

  3. Functions
    - Enhanced recommendation scoring
    - Reading pattern analysis
*/

-- Track reading sessions
CREATE TABLE IF NOT EXISTS reading_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time timestamptz,
  pages_read integer,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_duration CHECK (end_time IS NULL OR end_time > start_time)
);

-- Track detailed book interactions
CREATE TABLE IF NOT EXISTS book_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  interaction_type text NOT NULL CHECK (
    interaction_type IN (
      'view_details',
      'add_to_list',
      'start_reading',
      'finish_reading',
      'abandon',
      'reread'
    )
  ),
  duration interval, -- For reading sessions
  context jsonb, -- Additional interaction data
  created_at timestamptz DEFAULT now()
);

-- Track recommendation effectiveness
CREATE TABLE IF NOT EXISTS recommendation_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id uuid REFERENCES books(id) ON DELETE CASCADE,
  recommended_at timestamptz DEFAULT now(),
  acted_on_at timestamptz,
  action_taken text CHECK (
    action_taken IN (
      'added_to_list',
      'started_reading',
      'dismissed',
      'ignored'
    )
  ),
  recommendation_source text NOT NULL CHECK (
    recommendation_source IN (
      'genre_based',
      'author_based',
      'similar_readers',
      'reading_pattern'
    )
  ),
  score float CHECK (score >= 0 AND score <= 1),
  context jsonb -- Additional recommendation context
);

-- Create indexes
CREATE INDEX idx_reading_sessions_user ON reading_sessions(user_id);
CREATE INDEX idx_reading_sessions_book ON reading_sessions(book_id);
CREATE INDEX idx_reading_sessions_time ON reading_sessions(start_time, end_time);

CREATE INDEX idx_book_interactions_user ON book_interactions(user_id);
CREATE INDEX idx_book_interactions_book ON book_interactions(book_id);
CREATE INDEX idx_book_interactions_type ON book_interactions(interaction_type);

CREATE INDEX idx_recommendation_metrics_user ON recommendation_metrics(user_id);
CREATE INDEX idx_recommendation_metrics_book ON recommendation_metrics(book_id);
CREATE INDEX idx_recommendation_metrics_score ON recommendation_metrics(score);

-- Enable RLS
ALTER TABLE reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_metrics ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can manage their reading sessions"
  ON reading_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their book interactions"
  ON book_interactions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their recommendation metrics"
  ON recommendation_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create view for user reading patterns
CREATE OR REPLACE VIEW user_reading_patterns AS
SELECT 
  user_id,
  COUNT(DISTINCT book_id) as total_books_read,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))/3600) as avg_reading_hours,
  MODE() WITHIN GROUP (SELECT unnest(b.genres)) as preferred_genre,
  AVG(pages_read) as avg_pages_per_session,
  COUNT(*) FILTER (WHERE end_time IS NOT NULL) as completed_sessions,
  COUNT(*) FILTER (WHERE end_time IS NULL) as abandoned_sessions
FROM reading_sessions rs
JOIN books b ON b.id = rs.book_id
GROUP BY user_id;

-- Create function to calculate book similarity score
CREATE OR REPLACE FUNCTION calculate_book_similarity(book1_id uuid, book2_id uuid)
RETURNS float AS $$
DECLARE
  similarity float;
BEGIN
  WITH book_data AS (
    SELECT 
      id,
      genres,
      author,
      publication_year,
      reading_level,
      themes
    FROM books
    WHERE id IN (book1_id, book2_id)
  ),
  metrics AS (
    SELECT
      -- Genre overlap
      (SELECT COUNT(*) FROM 
        (SELECT UNNEST(b1.genres) INTERSECT SELECT UNNEST(b2.genres)) g)::float /
      (SELECT COUNT(*) FROM 
        (SELECT UNNEST(b1.genres) UNION SELECT UNNEST(b2.genres)) g) * 0.4 +
      -- Author similarity (same author = 1, different = 0)
      CASE WHEN b1.author = b2.author THEN 0.2 ELSE 0 END +
      -- Publication year proximity (max 0.1)
      (1 - ABS(b1.publication_year - b2.publication_year)::float / 100) * 0.1 +
      -- Reading level match (same level = 0.1)
      CASE WHEN b1.reading_level = b2.reading_level THEN 0.1 ELSE 0 END +
      -- Theme overlap
      (SELECT COUNT(*) FROM 
        (SELECT UNNEST(b1.themes) INTERSECT SELECT UNNEST(b2.themes)) t)::float /
      NULLIF((SELECT COUNT(*) FROM 
        (SELECT UNNEST(b1.themes) UNION SELECT UNNEST(b2.themes)) t), 0) * 0.2
      as similarity_score
    FROM book_data b1
    CROSS JOIN book_data b2
    WHERE b1.id = book1_id AND b2.id = book2_id
  )
  SELECT similarity_score INTO similarity
  FROM metrics;

  RETURN COALESCE(similarity, 0);
END;
$$ LANGUAGE plpgsql;

-- Create materialized view for book similarities
CREATE MATERIALIZED VIEW book_similarity_scores AS
SELECT 
  b1.id as book1_id,
  b2.id as book2_id,
  calculate_book_similarity(b1.id, b2.id) as similarity_score
FROM books b1
CROSS JOIN books b2
WHERE b1.id < b2.id
AND calculate_book_similarity(b1.id, b2.id) > 0.5;

CREATE UNIQUE INDEX idx_book_similarity_scores ON book_similarity_scores(book1_id, book2_id);

-- Function to refresh similarity scores (run periodically)
CREATE OR REPLACE FUNCTION refresh_book_similarities()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY book_similarity_scores;
END;
$$ LANGUAGE plpgsql;