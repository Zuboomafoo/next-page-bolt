import axios from 'axios';
import { Book } from '../types';
import { generateBookUUID } from './books';

const API_BASE_URL = 'https://www.googleapis.com/books/v1';
const MAX_RESULTS = 40;

interface GoogleBooksResponse {
  items: any[];
  totalItems: number;
}

export async function searchBooks(query: string, startIndex = 0): Promise<Book[]> {
  try {
    const response = await axios.get<GoogleBooksResponse>(`${API_BASE_URL}/volumes`, {
      params: {
        q: query,
        startIndex,
        maxResults: MAX_RESULTS,
        fields: 'items(id,volumeInfo),totalItems'
      }
    });

    if (!response.data.items) {
      return [];
    }

    return response.data.items.map(item => ({
      id: generateBookUUID(item.id),
      title: item.volumeInfo.title,
      author: item.volumeInfo.authors?.[0] || 'Unknown Author',
      cover_url: item.volumeInfo.imageLinks?.thumbnail || '',
      description: item.volumeInfo.description || '',
      isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier || '',
      publication_year: item.volumeInfo.publishedDate ? 
        parseInt(item.volumeInfo.publishedDate.substring(0, 4)) : 
        null,
      genres: item.volumeInfo.categories || []
    }));
  } catch (error) {
    console.error('Error searching books:', error);
    throw new Error('Failed to search books');
  }
}

export async function getBookRecommendations(
  genres: string[],
  excludeIds: string[] = [],
  limit = 10
): Promise<Book[]> {
  try {
    console.log('Getting recommendations for genres:', genres);
    
    if (genres.length === 0) {
      console.log('No genres provided for recommendations');
      return [];
    }

    // Create a search query that includes multiple genres
    const query = genres
      .slice(0, 3) // Take up to 3 genres to avoid too specific queries
      .map(genre => `subject:"${genre}"`)
      .join(' OR ');
    
    console.log('Search query:', query);

    const response = await axios.get<GoogleBooksResponse>(`${API_BASE_URL}/volumes`, {
      params: {
        q: query,
        maxResults: limit * 2,
        fields: 'items(id,volumeInfo)'
      }
    });

    if (!response.data.items) {
      console.log('No books found for the given genres');
      return [];
    }

    const books = response.data.items
      .map(item => ({
        id: generateBookUUID(item.id),
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.[0] || 'Unknown Author',
        cover_url: item.volumeInfo.imageLinks?.thumbnail || '',
        description: item.volumeInfo.description || '',
        isbn: item.volumeInfo.industryIdentifiers?.[0]?.identifier || '',
        publication_year: item.volumeInfo.publishedDate ? 
          parseInt(item.volumeInfo.publishedDate.substring(0, 4)) : 
          null,
        genres: item.volumeInfo.categories || []
      }))
      .filter(book => !excludeIds.includes(book.id));

    return books.slice(0, limit);
  } catch (error) {
    console.error('Error getting book recommendations:', error);
    return [];
  }
}