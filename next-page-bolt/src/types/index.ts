export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover_url: string;
  description: string;
  isbn: string;
  publication_year: number;
  genres: string[];
}

export interface Rating {
  id: string;
  user_id: string;
  book_id: string;
  rating: number;
  review?: string;
  created_at: string;
}

export interface ReadingStatus {
  id: string;
  user_id: string;
  book_id: string;
  status: 'want_to_read' | 'read' | 'none';
  updated_at: string;
}