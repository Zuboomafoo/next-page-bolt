import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, BookPlus, LogIn } from 'lucide-react';
import { Book } from '../types';
import { BookCard } from './BookCard';
import { getRecommendations } from '../lib/recommendations';
import { sampleBooks } from '../data/sample-books';

interface RecommendationsListProps {
  onClose: () => void;
  selectedBooks: Book[];
  onSignUpClick: () => void;
  onSignInClick: () => void;
}

export function RecommendationsList({ 
  onClose, 
  selectedBooks, 
  onSignUpClick,
  onSignInClick 
}: RecommendationsListProps) {
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        const books = await getRecommendations(selectedBooks, sampleBooks);
        setRecommendations(books);
      } catch (error) {
        console.error('Error loading recommendations:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [selectedBooks]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative bg-white rounded-xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>

        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Books You Might Love
          </h3>
          <p className="text-gray-600 mb-6">
            Based on your selected books, we think you'll enjoy these recommendations
          </p>

          {loading ? (
            <div className="space-y-4 mb-8">
              <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
              <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
              <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {recommendations.map((book) => (
                <BookCard 
                  key={book.id} 
                  book={book}
                  isRecommendation={true}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={onSignUpClick}
              className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              <BookPlus className="h-5 w-5" />
              <span>Sign up to save your recommendations</span>
            </button>
            <button
              onClick={onSignInClick}
              className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              <LogIn className="h-5 w-5" />
              <span>Already have an account? Sign in</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}