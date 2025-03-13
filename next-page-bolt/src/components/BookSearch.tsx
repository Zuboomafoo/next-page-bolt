import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Book } from '../types';
import { searchBooks } from '../lib/google-books';
import { getUserBooks } from '../lib/books';
import { useAuth } from '../lib/auth';

interface BookSearchProps {
  onSelect: (book: Book) => void;
  disabled?: boolean;
}

export function BookSearch({ onSelect, disabled }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [userBookIds, setUserBookIds] = useState<string[]>([]);
  const debounceTimeout = useRef<number>();
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      getUserBooks(user.id)
        .then(setUserBookIds)
        .catch(console.error);
    } else {
      setUserBookIds([]);
    }
  }, [user]);

  useEffect(() => {
    if (!query.trim() || disabled) {
      setResults([]);
      return;
    }

    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const books = await searchBooks(query);
        const filteredBooks = books.filter(book => !userBookIds.includes(book.id));
        setResults(filteredBooks);
      } catch (error) {
        console.error('Error searching books:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimeout.current);
  }, [query, disabled, userBookIds]);

  const getDropdownPosition = () => {
    if (!inputRef.current) return null;
    const rect = inputRef.current.getBoundingClientRect();
    return {
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    };
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          placeholder="Search for a book..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
        />
        <Search className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
      </div>

      {typeof window !== 'undefined' && (results.length > 0 || loading) && !disabled && createPortal(
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed z-[100] bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden"
            style={getDropdownPosition() || {}}
          >
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Searching books...
              </div>
            ) : results.length > 0 ? (
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((book) => (
                  <button
                    key={book.id}
                    className="w-full px-4 py-3 text-left hover:bg-orange-50 flex items-center space-x-3 transition-colors border-b border-gray-100 last:border-0"
                    onClick={() => {
                      onSelect(book);
                      setQuery('');
                      setResults([]);
                      if (user) {
                        setUserBookIds(prev => [...prev, book.id]);
                      }
                    }}
                  >
                    {book.cover_url && (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="h-16 w-12 object-cover rounded shadow-sm flex-shrink-0"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=300&q=80';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {book.title}
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        {book.author}
                      </div>
                      {book.publication_year && (
                        <div className="text-xs text-gray-400">
                          {book.publication_year}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No books found
              </div>
            )}
          </motion.div>
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}