import React, { useState, useEffect, useCallback } from 'react';
import { Star, BookPlus, Check, ThumbsDown, ShoppingCart, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Book } from '../types';
import { useAuth } from '../lib/auth';
import { updateReadingStatus, dismissRecommendation, addNegativeFeedback, updateBookRating, getBookRating, removeBook } from '../lib/books';
import { getAmazonLink } from '../lib/amazon';

interface BookCardProps {
  book: Book;
  showActions?: boolean;
  isRecommendation?: boolean;
  onDismiss?: () => void;
  defaultStatus?: 'none' | 'want_to_read' | 'read';
  onStatusChange?: (book: Book, newStatus: 'want_to_read' | 'read' | 'none') => void;
  onRemove?: (book: Book) => void;
}

export function BookCard({
  book,
  showActions = false,
  isRecommendation = false,
  onDismiss,
  defaultStatus = 'none',
  onStatusChange,
  onRemove
}: BookCardProps) {
  const [status, setStatus] = useState<'none' | 'want_to_read' | 'read'>(defaultStatus);
  const [rating, setRating] = useState<number>(0);
  const [isUpdatingRating, setIsUpdatingRating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFeedbackConfirmation, setShowFeedbackConfirmation] = useState(false);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user && book.id) {
      getBookRating(user.id, book.id)
        .then(savedRating => {
          if (savedRating !== null) {
            setRating(savedRating);
          }
        })
        .catch(console.error);
    }
  }, [user, book.id]);

  const handleRatingChange = useCallback(async (newRating: number) => {
    if (!user) return;

    try {
      setIsUpdatingRating(true);
      await updateBookRating(user.id, book.id, newRating);
      setRating(newRating);
    } catch (error) {
      console.error('Error updating rating:', error);
    } finally {
      setIsUpdatingRating(false);
    }
  }, [user, book.id]);

  const handleStatusChange = useCallback(async (newStatus: 'want_to_read' | 'read' | 'none') => {
    if (!user) return;
    
    try {
      await updateReadingStatus(book, user.id, newStatus);
      setStatus(newStatus);
      onStatusChange?.(book, newStatus);
    } catch (error) {
      console.error('Error updating reading status:', error);
    }
  }, [book, user, onStatusChange]);

  const handleDismiss = async () => {
    if (!user || !onDismiss) return;

    try {
      await addNegativeFeedback(book, user.id);
      setShowFeedbackConfirmation(true);
      setTimeout(() => {
        setShowFeedbackConfirmation(false);
        onDismiss();
      }, 2000);
    } catch (error) {
      console.error('Error processing negative feedback:', error);
    }
  };

  const handleRemove = async () => {
    if (!user || !onRemove) return;

    try {
      setIsRemoving(true);
      await removeBook(user.id, book.id);
      setShowRemoveConfirmation(false);
      onRemove(book);
    } catch (error) {
      console.error('Error removing book:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const amazonLink = getAmazonLink(book);

  return (
    <motion.div
      className="bg-white rounded-lg shadow p-4 relative"
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <AnimatePresence>
        {showFeedbackConfirmation && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 bg-red-100 text-red-700 px-4 py-2 rounded-t-lg text-sm text-center"
          >
            Thanks for your feedback! We'll improve your recommendations.
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start space-x-4">
        {book.cover_url && (
          <img
            src={book.cover_url}
            alt={book.title}
            className="h-32 w-24 object-cover rounded shadow"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=60';
            }}
          />
        )}
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">{book.title}</h3>
              <p className="text-sm text-gray-500">{book.author}</p>
            </div>
            {isRecommendation && showActions && (
              <button
                onClick={handleDismiss}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Not interested"
              >
                <ThumbsDown className="h-4 w-4" />
              </button>
            )}
            {showActions && !isRecommendation && (
              <button
                onClick={() => setShowRemoveConfirmation(true)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                title="Remove book"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {showActions && (
            <>
              <div className="mt-2 flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRatingChange(star)}
                    disabled={isUpdatingRating}
                    className="focus:outline-none transition-opacity disabled:opacity-50"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        star <= rating
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => handleStatusChange('want_to_read')}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                    status === 'want_to_read'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <BookPlus className="h-4 w-4" />
                  <span>Want to Read</span>
                </button>
                <button
                  onClick={() => handleStatusChange('read')}
                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-sm ${
                    status === 'read'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>Read</span>
                </button>
                {isRecommendation && status === 'want_to_read' && (
                  <a
                    href={amazonLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 px-2 py-1 rounded text-sm bg-orange-100 text-orange-700 hover:bg-orange-200 transition-colors"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    <span>Buy on Amazon</span>
                  </a>
                )}
              </div>
            </>
          )}

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm text-emerald-600 hover:text-emerald-700"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-2">
                  {book.description && (
                    <p className="text-sm text-gray-600">{book.description}</p>
                  )}
                  {book.genres && book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.genres.map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  {book.publication_year && (
                    <p className="text-sm text-gray-500">
                      Published: {book.publication_year}
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showRemoveConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[var(--z-modal)]"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-sm w-full mx-4"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Remove Book
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to remove "{book.title}" from your list?
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRemoveConfirmation(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
                  disabled={isRemoving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
                  disabled={isRemoving}
                >
                  {isRemoving ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}