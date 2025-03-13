import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star } from 'lucide-react';
import { Book } from '../types';
import { BookCard } from './BookCard';
import { getRecommendations } from '../lib/recommendations';
import { useAuth } from '../lib/auth';
import { getDismissedRecommendations, getReadingHistory } from '../lib/books';

interface RecommendationsSectionProps {
  selectedBooks: Book[];
  onStatusChange?: (book: Book, newStatus: 'want_to_read' | 'read') => void;
}

type Filter = 'All' | 'Fiction' | 'Non-Fiction';

export function RecommendationsSection({ selectedBooks, onStatusChange }: RecommendationsSectionProps) {
  const [filter, setFilter] = useState<Filter>('All');
  const [dismissedBooks, setDismissedBooks] = useState<string[]>([]);
  const [displayedBooks, setDisplayedBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [readHistory, setReadHistory] = useState<Book[]>([]);
  const { user } = useAuth();
  
  // Load user's reading history and dismissed recommendations
  useEffect(() => {
    if (user?.id) {
      Promise.all([
        getReadingHistory(user.id),
        getDismissedRecommendations(user.id)
      ])
        .then(([history, dismissed]) => {
          setReadHistory(history);
          setDismissedBooks(dismissed);
        })
        .catch(console.error);
    } else {
      setReadHistory([]);
      setDismissedBooks([]);
    }
  }, [user]);

  useEffect(() => {
    const loadRecommendations = async () => {
      if (readHistory.length === 0 && selectedBooks.length === 0) {
        setDisplayedBooks([]);
        setLoading(false);
        return;
      }

      try {
        const recommendations = await getRecommendations(
          user?.id || null,
          [...readHistory, ...selectedBooks], // Combine reading history with selected books
          dismissedBooks,
          filter === 'All' ? undefined : filter
        );
        
        setDisplayedBooks(recommendations);
      } catch (error) {
        console.error('Error loading recommendations:', error);
        setDisplayedBooks([]);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    loadRecommendations();
  }, [selectedBooks, filter, dismissedBooks, user, readHistory]);

  const handleDismiss = (bookId: string) => {
    setDisplayedBooks(books => books.filter(b => b.id !== bookId));
  };

  const handleStatusChange = (book: Book, newStatus: 'want_to_read' | 'read') => {
    // Remove the book from recommendations
    setDisplayedBooks(books => books.filter(b => b.id !== book.id));
    // Propagate the status change to parent
    onStatusChange?.(book, newStatus);
  };

  return (
    <section className="section-container mt-16">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-accent/10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-display font-bold text-primary">
                Recommended Books
              </h2>
              <p className="text-base text-primary/70 mt-1">
                Curated selections based on your taste
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            {(['All', 'Fiction', 'Non-Fiction'] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-primary text-white'
                    : 'bg-accent/10 text-primary hover:bg-accent/20'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="book-cover bg-accent/10" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-accent/10 rounded w-3/4" />
                  <div className="h-4 bg-accent/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : displayedBooks.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedBooks.map((book) => (
              <BookCard 
                key={book.id} 
                book={book}
                showActions={true}
                isRecommendation={true}
                onDismiss={() => handleDismiss(book.id)}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-accent/10 rounded-full mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-display font-bold text-primary mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-primary/70 max-w-md mx-auto">
              {readHistory.length === 0 && selectedBooks.length === 0
                ? "Add books to your reading history to get personalized recommendations based on your taste."
                : "We couldn't find any new recommendations based on your current selection. Try adjusting your filters or adding more books to your history."}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}