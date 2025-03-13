import { Book } from '../types';

const AFFILIATE_CODE = 'zuboomafoo-20';

export function getAmazonLink(book: Book): string {
  // Always use search to ensure better results
  const searchQuery = encodeURIComponent(`${book.title} by ${book.author} book`);
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${AFFILIATE_CODE}`;
}