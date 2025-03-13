import * as tf from '@tensorflow/tfjs';
import { supabase } from './supabase';
import { Book } from '../types';
import { getBookRecommendations } from './google-books';
import { getGenrePreferences } from './books';

interface RatedBook extends Book {
  rating?: number;
  review?: string;
}

interface UserPreferences {
  favorite_genres: string[];
  favorite_authors: string[];
  reading_level: string;
}

interface ReadingPattern {
  total_books_read: number;
  avg_reading_hours: number;
  preferred_genre: string;
  avg_pages_per_session: number;
  completed_sessions: number;
  abandoned_sessions: number;
}

// Get user's reading preferences
async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return {
        favorite_genres: [],
        favorite_authors: [],
        reading_level: 'intermediate'
      };
    }

    return data || {
      favorite_genres: [],
      favorite_authors: [],
      reading_level: 'intermediate'
    };
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return {
      favorite_genres: [],
      favorite_authors: [],
      reading_level: 'intermediate'
    };
  }
}

// Get user's reading patterns
async function getUserReadingPatterns(userId: string): Promise<ReadingPattern | null> {
  try {
    const { data, error } = await supabase
      .from('user_reading_patterns')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching reading patterns:', error);
      return {
        total_books_read: 0,
        avg_reading_hours: 0,
        preferred_genre: '',
        avg_pages_per_session: 0,
        completed_sessions: 0,
        abandoned_sessions: 0
      };
    }

    return data || {
      total_books_read: 0,
      avg_reading_hours: 0,
      preferred_genre: '',
      avg_pages_per_session: 0,
      completed_sessions: 0,
      abandoned_sessions: 0
    };
  } catch (error) {
    console.error('Error in getUserReadingPatterns:', error);
    return null;
  }
}

// Get similar books based on pre-calculated similarities
async function getSimilarBooks(bookIds: string[]): Promise<Book[]> {
  if (bookIds.length === 0) return [];

  try {
    const { data: books, error } = await supabase
      .from('books')
      .select('*')
      .in('id', bookIds)
      .limit(10);

    if (error) {
      console.error('Error fetching similar books:', error);
      return [];
    }

    return books || [];
  } catch (error) {
    console.error('Error in getSimilarBooks:', error);
    return [];
  }
}

// Calculate personalized score for a book
function calculatePersonalizedScore(
  book: Book,
  userPreferences: UserPreferences,
  readingPatterns: ReadingPattern | null,
  genreWeights: Record<string, number>
): number {
  let score = 0;
  const weights = {
    genreMatch: 0.4,
    authorMatch: 0.3,
    readingLevel: 0.2,
    publicationYear: 0.1
  };

  try {
    // Genre matching with weights
    if (book.genres && userPreferences.favorite_genres) {
      const genreMatches = book.genres.filter(g => 
        userPreferences.favorite_genres.includes(g)
      );
      const weightedGenreScore = genreMatches.reduce((acc, genre) => 
        acc + (genreWeights[genre] || 1), 0
      ) / Math.max(book.genres.length, 1);
      score += weightedGenreScore * weights.genreMatch;
    }

    // Author matching
    if (userPreferences.favorite_authors?.includes(book.author)) {
      score += weights.authorMatch;
    }

    // Reading level compatibility
    if (book.reading_level === userPreferences.reading_level) {
      score += weights.readingLevel;
    }

    // Publication year recency (prefer newer books slightly)
    if (book.publication_year) {
      const yearScore = Math.min(
        (book.publication_year - 1900) / (new Date().getFullYear() - 1900),
        1
      );
      score += yearScore * weights.publicationYear;
    }

    // If no specific matches were found, give a small base score
    if (score === 0) {
      score = 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  } catch (error) {
    console.error('Error calculating personalized score:', error);
    return 0.1; // Return a small base score instead of 0
  }
}

export async function getRecommendations(
  userId: string | null,
  recentBooks: RatedBook[],
  excludeIds: string[] = [],
  filter?: 'Fiction' | 'Non-Fiction'
): Promise<Book[]> {
  try {
    console.log('Getting recommendations for user:', userId);
    console.log('Recent books:', recentBooks.length);

    // Get user data
    const [userPreferences, readingPatterns, genreWeights] = await Promise.all([
      userId ? getUserPreferences(userId) : null,
      userId ? getUserReadingPatterns(userId) : null,
      userId ? getGenrePreferences(userId) : {}
    ]);

    console.log('User preferences:', userPreferences);
    console.log('Genre weights:', genreWeights);

    // Get genre-based recommendations
    const genres = userPreferences?.favorite_genres || 
      recentBooks.flatMap(b => b.genres || []);

    console.log('Using genres for recommendations:', genres);

    const genreRecommendations = genres.length > 0 ?
      await getBookRecommendations(
        Array.from(new Set(genres)),
        excludeIds,
        20
      ) : [];

    console.log('Genre recommendations found:', genreRecommendations.length);

    // Get similar books based on recent reads
    const similarBooks = recentBooks.length > 0 ? 
      await getSimilarBooks(recentBooks.map(b => b.id)) : 
      [];

    console.log('Similar books found:', similarBooks.length);

    // Combine all potential recommendations
    const candidates = [...similarBooks, ...genreRecommendations]
      .filter((book, index, self) => 
        index === self.findIndex(b => b.id === book.id) && // Remove duplicates
        !excludeIds.includes(book.id) // Remove excluded books
      );

    console.log('Total candidate books:', candidates.length);

    // Score and rank recommendations
    const scoredRecommendations = candidates.map(book => {
      const score = calculatePersonalizedScore(
        book,
        userPreferences || {
          favorite_genres: [],
          favorite_authors: [],
          reading_level: 'intermediate'
        },
        readingPatterns,
        genreWeights
      );

      return { book, score };
    });

    console.log('Scored recommendations:', scoredRecommendations.length);

    // Filter and sort recommendations
    const filteredRecommendations = scoredRecommendations
      .filter(({ book, score }) => {
        // Apply fiction/non-fiction filter if specified
        if (filter) {
          const isFiction = book.genres?.some(g => 
            ['Fantasy', 'Science Fiction', 'Fiction', 'Romance', 'Mystery']
              .some(fg => g.toLowerCase().includes(fg.toLowerCase()))
          );
          if (filter === 'Fiction' && !isFiction) return false;
          if (filter === 'Non-Fiction' && isFiction) return false;
        }

        // Lower the score threshold to show more recommendations
        return score > 0.1;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ book }) => book);

    console.log('Final filtered recommendations:', filteredRecommendations.length);

    return filteredRecommendations;
  } catch (error) {
    console.error('Error in getRecommendations:', error);
    return [];
  }
}