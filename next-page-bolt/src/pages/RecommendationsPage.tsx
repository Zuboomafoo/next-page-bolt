import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Filter, Search } from 'lucide-react';
import { Book } from '../types';
import { BookCard } from '../components/BookCard';
import { BookSearch } from '../components/BookSearch';
import { useAuth } from '../lib/auth';
import { getRecommendations } from '../lib/recommendations';
import { getReadingHistory, updateReadingStatus } from '../lib/books';

type FilterType = 'All' | 'Fiction' | 'Non-Fiction';

export function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');
  const [readHistory, setReadHistory] = useState<Book[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const { user } = useAuth();

  const loadRecommendations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const history = await getReadingHistory(user.id);
      setReadHistory(history);

      const recs = await getRecommendations(
        user.id,
        history,
        [],
        filter === 'All' ? undefined : filter
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecommendations();
    } else {
      setLoading(false);
    }
  }, [user, filter]);

  const handleStatusChange = async (book: Book, status: 'want_to_read' | 'read' | 'none') => {
    if (!user) return;

    try {
      await updateReadingStatus(book, user.id, status);
      setRecommendations(prev => prev.filter(b => b.id !== book.id));
      loadRecommendations();
    } catch (error) {
      console.error('Error updating book status:', error);
    }
  };

  const handleDismiss = (bookId: string) => {
    setRecommendations(prev => prev.filter(book => book.id !== bookId));
  };

  const handleBookSelect = async (book: Book) => {
    if (!user) return;

    try {
      await updateReadingStatus(book, user.id, 'want_to_read');
      loadRecommendations();
    } catch (error) {
      console.error('Error adding book:', error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Sparkles className="h-8 w-8 mr-3 text-orange-500" />
            Recommended for You
          </h1>
          <p className="mt-2 text-gray-600">
            Personalized book recommendations based on your reading history and preferences
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-orange-600 transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>Add New Books</span>
            </button>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {(['All', 'Fiction', 'Non-Fiction'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    filter === type
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Add New Books
                </h2>
                <BookSearch onSelect={handleBookSelect} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                showActions={true}
                isRecommendation={true}
                onStatusChange={handleStatusChange}
                onDismiss={() => handleDismiss(book.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="inline-block p-4 bg-orange-100 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-orange-500" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Recommendations Yet
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              {readHistory.length === 0
                ? "Add some books to your reading list to get personalized recommendations."
                : "We couldn't find any new recommendations based on your current preferences. Try adjusting your filters or adding more books to your list."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}