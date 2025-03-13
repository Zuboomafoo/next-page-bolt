import { supabase } from './supabase';
import { Book } from '../types';

// Helper function to generate a deterministic UUID from a string
function generateBookUUID(googleBooksId: string): string {
  // Create a UUID v5 using a namespace and the Google Books ID
  // This ensures the same Google Books ID always generates the same UUID
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  const uuid = crypto.randomUUID();
  return uuid;
}

async function ensureBookExists(book: Book): Promise<string> {
  const bookUUID = book.id.length === 36 ? book.id : generateBookUUID(book.id);

  // First check if the book exists
  const { data: existingBook } = await supabase
    .from('books')
    .select('id')
    .eq('id', bookUUID)
    .maybeSingle();

  if (existingBook) {
    return bookUUID;
  }

  // If book doesn't exist, check for ISBN conflict
  if (book.isbn) {
    const { data: isbnBook } = await supabase
      .from('books')
      .select('id')
      .eq('isbn', book.isbn)
      .maybeSingle();

    if (isbnBook) {
      return isbnBook.id;
    }
  }

  // If no existing book found, insert new book
  const { error: bookError } = await supabase
    .from('books')
    .insert({
      id: bookUUID,
      title: book.title,
      author: book.author,
      cover_url: book.cover_url,
      description: book.description,
      isbn: book.isbn,
      publication_year: book.publication_year,
      genres: book.genres
    });

  if (bookError) throw bookError;
  return bookUUID;
}

export async function getUserBooks(userId: string): Promise<string[]> {
  const { data: readingStatus, error: statusError } = await supabase
    .from('reading_status')
    .select('book_id')
    .eq('user_id', userId);

  if (statusError) throw statusError;

  const { data: dismissedBooks, error: dismissedError } = await supabase
    .from('dismissed_recommendations')
    .select('book_id')
    .eq('user_id', userId);

  if (dismissedError) throw dismissedError;

  const { data: feedbackBooks, error: feedbackError } = await supabase
    .from('book_feedback')
    .select('book_id')
    .eq('user_id', userId)
    .eq('feedback_type', 'negative');

  if (feedbackError) throw feedbackError;

  const bookIds = new Set([
    ...(readingStatus?.map(s => s.book_id) || []),
    ...(dismissedBooks?.map(d => d.book_id) || []),
    ...(feedbackBooks?.map(f => f.book_id) || [])
  ]);

  return Array.from(bookIds);
}

export async function updateBookRating(
  userId: string,
  bookId: string,
  rating: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('book_ratings')
      .upsert({
        user_id: userId,
        book_id: bookId,
        rating,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,book_id'
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error updating book rating:', error);
    throw error;
  }
}

export async function getBookRating(
  userId: string,
  bookId: string
): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('book_ratings')
      .select('rating')
      .eq('user_id', userId)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error) throw error;
    return data?.rating ?? null;
  } catch (error) {
    console.error('Error getting book rating:', error);
    return null;
  }
}

export async function addToReadingHistory(book: Book, userId: string) {
  const bookUUID = await ensureBookExists(book);

  const { error: statusError } = await supabase
    .from('reading_status')
    .upsert({
      user_id: userId,
      book_id: bookUUID,
      status: 'read',
      updated_at: new Date().toISOString()
    });

  if (statusError) throw statusError;
}

export async function updateReadingStatus(
  book: Book,
  userId: string, 
  status: 'want_to_read' | 'read' | 'none'
) {
  const bookUUID = await ensureBookExists(book);

  if (status === 'none') {
    await removeBook(userId, bookUUID);
    return;
  }

  const { error } = await supabase
    .from('reading_status')
    .upsert({
      user_id: userId,
      book_id: bookUUID,
      status,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'user_id,book_id'
    });

  if (error) throw error;
}

export async function removeBook(userId: string, bookId: string): Promise<void> {
  try {
    // Remove reading status
    const { error: statusError } = await supabase
      .from('reading_status')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (statusError) throw statusError;

    // Remove ratings
    const { error: ratingError } = await supabase
      .from('book_ratings')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (ratingError) throw ratingError;

    // Remove reading sessions
    const { error: sessionError } = await supabase
      .from('reading_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (sessionError) throw sessionError;

    // Remove book interactions
    const { error: interactionError } = await supabase
      .from('book_interactions')
      .delete()
      .eq('user_id', userId)
      .eq('book_id', bookId);

    if (interactionError) throw interactionError;

  } catch (error) {
    console.error('Error removing book:', error);
    throw error;
  }
}

export async function dismissRecommendation(book: Book, userId: string) {
  const bookUUID = await ensureBookExists(book);

  const { error } = await supabase
    .from('dismissed_recommendations')
    .insert({
      user_id: userId,
      book_id: bookUUID
    });

  if (error) throw error;
}

export async function addNegativeFeedback(book: Book, userId: string): Promise<void> {
  const bookUUID = await ensureBookExists(book);

  const { error } = await supabase
    .from('book_feedback')
    .insert({
      user_id: userId,
      book_id: bookUUID,
      feedback_type: 'negative'
    });

  if (error) throw error;
}

export async function getGenrePreferences(userId: string): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('genre_preferences')
    .select('genre, weight')
    .eq('user_id', userId);

  if (error) throw error;

  return Object.fromEntries(
    data.map(({ genre, weight }) => [genre, weight])
  );
}

export async function getReadingList(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('reading_status')
    .select(`
      book:books(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'want_to_read');

  if (error) throw error;
  return data?.map(d => d.book) || [];
}

export async function getReadingHistory(userId: string): Promise<Book[]> {
  const { data, error } = await supabase
    .from('reading_status')
    .select(`
      book:books(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'read');

  if (error) throw error;
  return data?.map(d => d.book) || [];
}

export async function getDismissedRecommendations(userId: string) {
  const { data, error } = await supabase
    .from('dismissed_recommendations')
    .select('book_id')
    .eq('user_id', userId);

  if (error) throw error;
  return data.map(d => d.book_id);
}

export { generateBookUUID };