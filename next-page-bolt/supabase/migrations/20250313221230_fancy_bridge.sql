/*
  # Add default user preferences trigger

  1. Changes
    - Add trigger to create default user preferences on user creation
    - Add function to handle default preference initialization
    
  2. Security
    - Maintain existing RLS policies
*/

-- Function to create default user preferences
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_preferences (
    user_id,
    favorite_genres,
    favorite_authors,
    reading_level
  ) VALUES (
    NEW.id,
    '{}',
    '{}',
    'intermediate'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();