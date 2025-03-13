import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Search, 
  Clock, 
  BookMarked,
  Timer,
  Filter,
  SortAsc,
  BookPlus,
  History,
  Sparkles
} from 'lucide-react';
import { Book } from '../types';
import { BookSearch } from './BookSearch';
import { BookCard } from './BookCard';
import { useAuth } from '../lib/auth';
import { getReadingList, getReadingHistory } from '../lib/books';
import { getRecommendations } from '../lib/recommendations'; // Import the recommendation function

type SortField = 'title' | 'author' | 'date' | 'rating';

interface BookWithMetadata extends Book {
  completionDate?: string;
  startDate?: string;
  rating?: number;
  notes?: string;
  pagesRead?: number;
  totalPages?: number;
  readingDuration?: number;
}

interface LibrarySection {
  title: string;
  icon: React.ReactNode;
  books: BookWithMetadata[];
  emptyMessage: string;
  loading?: boolean;
}

export function BookManager() {
  const [readingList, setReadingList] = useState<BookWithMetadata[]>([]);
  const [readHistory, setReadHistory] = useState<BookWithMetadata[]>([]);
  const [recommendations, setRecommendations] = useState<BookWithMetadata[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortAsc, setSortAsc] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const { user } = useAuth();

  // Load user's books and get recommendations
  useEffect(() => {
    if (user) {
      const loadBooks = async () => {
        try {
          const [list, history] = await Promise.all([
            getReadingList(user.id),
            getReadingHistory(user.id)
          ]);

          const formattedList = list.map(book => ({
            ...book,
            startDate: new Date().toISOString()
          }));

          const formattedHistory = history.map(book => ({
            ...book,
            completionDate: new Date().toISOString(),
            rating: Math.floor(Math.random() * 5) + 1,
            readingDuration: Math.floor(Math.random() * 1000) + 100
          }));

          setReadingList(formattedList);
          setReadHistory(formattedHistory);

          // Load recommendations based on reading history
          await loadRecommendations(formattedHistory, formattedList);
        } catch (error) {
          console.error('Error loading books:', error);
        }
      };

      loadBooks();
    }
  }, [user]);

  // Function to load recommendations
  const loadRecommendations = async (
    historyBooks: BookWithMetadata[],
    listBooks: BookWithMetadata[]
  ) => {
    if (!user) return;
    
    setLoadingRecommendations(true);
    try {
      // Get books to exclude (already in reading list or history)
      const excludeIds = [
        ...historyBooks.map(b => b.id),
        ...listBooks.map(b => b.id)
      ];
      
      // Get rated books for recommendation algorithm
      const ratedBooks = historyBooks
        .filter(book => book.rating !== undefined)
        .map(book => ({
          ...book,
          rating: book.rating
        }));
      
      console.log('Getting recommendations with:', {
        userId: user.id,
        ratedBooks: ratedBooks.length,
        excludeIds: excludeIds.length
      });
      
      // Call the recommendation function
      const recommendedBooks = await getRecommendations(
        user.id,
        ratedBooks,
        excludeIds
      );
      
      console.log('Received recommendations:', recommendedBooks.length);
      setRecommendations(recommendedBooks);
    } catch (error) {
      console.error('Error loading recommendations:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  // Refresh recommendations on demand
  const refreshRecommendations = () => {
    loadRecommendations(readHistory, readingList);
  };

  const handleStatusChange = (book: Book, newStatus: 'want_to_read' | 'read' | 'none') => {
    const now = new Date().toISOString();

    if (newStatus === 'none') {
      setReadingList(prev => prev.filter(b => b.id !== book.id));
      setReadHistory(prev => prev.filter(b => b.id !== book.id));
      return;
    }

    if (newStatus === 'want_to_read') {
      setReadHistory(prev => prev.filter(b => b.id !== book.id));
      setReadingList(prev => {
        if (!prev.find(b => b.id === book.id)) {
          return [...prev, { ...book, startDate: now }];
        }
        return prev;
      });
    } else {
      setReadingList(prev => prev.filter(b => b.id !== book.id));
      setReadHistory(prev => {
        if (!prev.find(b => b.id === book.id)) {
          return [...prev, { ...book, completionDate: now }];
        }
        return prev;
      });
      
      // Refresh recommendations when a book is marked as read
      setTimeout(() => refreshRecommendations(), 500);
    }
  };

  const handleBookSelect = (book: Book) => {
    setReadingList(prev => [...prev, { ...book, startDate: new Date().toISOString() }]);
    
    // Remove from recommendations if added to reading list
    setRecommendations(prev => prev.filter(b => b.id !== book.id));
  };

  const handleRemoveBook = (book: Book) => {
    setReadingList(prev => prev.filter(b => b.id !== book.id));
    setReadHistory(prev => prev.filter(b => b.id !== book.id));
    
    // Refresh recommendations when a book is removed
    setTimeout(() => refreshRecommendations(), 500);
  };

  const filterBooks = (books: BookWithMetadata[]): BookWithMetadata[] => {
    if (!searchQuery) return books;

    const query = searchQuery.toLowerCase();
    return books.filter(book => 
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query)
    );
  };

  const sortBooks = (books: BookWithMetadata[]): BookWithMetadata[] => {
    return [...books].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'author':
          comparison = a.author.localeCompare(b.author);
          break;
        case 'rating':
          comparison = (b.rating || 0) - (a.rating || 0);
          break;
        case 'date':
          const dateA = a.completionDate || a.startDate || '';
          const dateB = b.completionDate || b.startDate || '';
          comparison = dateB.localeCompare(dateA);
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  };

  const sections: LibrarySection[] = [
    {
      title: "Recommended for You",
      icon: <Sparkles className="h-6 w-6 text-amber-500" />,
      books: sortBooks(filterBooks(recommendations)),
      emptyMessage: "Add books to your reading history to get personalized recommendations",
      loading: loadingRecommendations
    },
    {
      title: "Reading List",
      icon: <BookPlus className="h-6 w-6 text-emerald-600" />,
      books: sortBooks(filterBooks(readingList)),
      emptyMessage: "Add books you want to read to your reading list"
    },
    {
      title: "Reading History",
      icon: <History className="h-6 w-6 text-purple-600" />,
      books: sortBooks(filterBooks(readHistory)),
      emptyMessage: "Books you've finished reading will appear here"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <BookOpen className="h-8 w-8 mr-3 text-brand-orange" />
          Your Library
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <div className="flex items-center space-x-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search your library..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-orange focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Filter className="h-5 w-5" />
          </button>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <SortAsc className={`h-5 w-5 transform ${!sortAsc ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sort by
                </label>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortField)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-brand-orange focus:border-brand-orange sm:text-sm rounded-md"
                >
                  <option value="date">Date</option>
                  <option value="title">Title</option>
                  <option value="author">Author</option>
                  <option value="rating">Rating</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Books</h2>
          <BookSearch onSelect={handleBookSelect} />
        </div>

        <div className="space-y-12">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  {section.icon}
                  <h2 className="text-xl font-semibold">{section.title}</h2>
                </div>
                
                {section.title === "Recommended for You" && (
                  <button
                    onClick={refreshRecommendations}
                    className="text-sm text-brand-orange hover:text-brand-orange-dark font-medium flex items-center space-x-1"
                    disabled={loadingRecommendations}
                  >
                    <span>Refresh</span>
                    {loadingRecommendations && (
                      <svg className="animate-spin h-4 w-4 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                  </button>
                )}
              </div>

              {section.loading ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-8 w-8 text-brand-orange" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                  <p className="mt-2 text-gray-600">Loading personalized recommendations...</p>
                </div>
              ) : section.books.length > 0 ? (
                <div className="space-y-6">
                  {section.books.map((book) => (
                    <div key={book.id} className="relative">
                      <BookCard
                        book={book}
                        showActions={true}
                        defaultStatus={book.completionDate ? 'read' : 'want_to_read'}
                        defaultRating={book.rating}
                        onStatusChange={handleStatusChange}
                        onRemove={handleRemoveBook}
                      />
                      
                      {(book.completionDate || book.startDate) && (
                        <div className="mt-2 pl-36 text-sm text-gray-500 space-y-1">
                          {book.startDate && !book.completionDate && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Added: {new Date(book.startDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {book.completionDate && (
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Completed: {new Date(book.completionDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {book.readingDuration && (
                            <div className="flex items-center">
                              <Timer className="h-4 w-4 mr-2" />
                              <span>Reading time: {Math.floor(book.readingDuration / 60)}h {book.readingDuration % 60}m</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <BookMarked className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-600">{section.emptyMessage}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}