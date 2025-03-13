/*
  # Initial Schema Setup for Book Recommendation System

  1. New Tables
    - users (extends auth.users)
      - username
      - bio
      - avatar_url
    - books
      - Basic book information
      - Metadata for recommendations
    - ratings
      - User ratings and reviews
    - reading_status
      - Track reading progress
    - user_preferences
      - Store genre preferences
      
  2. Security
    - RLS enabled on all tables
    - Policies for user access
*/

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Books table
CREATE TABLE public.books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  cover_url TEXT,
  description TEXT,
  isbn TEXT UNIQUE,
  publication_year INTEGER,
  genres TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Ratings table
CREATE TABLE public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Reading Status table
CREATE TABLE public.reading_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('want_to_read', 'reading', 'read')) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_status ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can read all books" ON public.books
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read all public ratings" ON public.ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can manage their own ratings" ON public.ratings
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their reading status" ON public.reading_status
  FOR ALL TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own profile" ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Functions
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, username, avatar_url)
  VALUES (new.id, new.email, null);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();