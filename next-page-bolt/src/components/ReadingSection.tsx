import React from 'react';
import { Book, Clock } from 'lucide-react';
import { Book as BookType } from '../types';
import { BookCard } from './BookCard';

interface ReadingSectionProps {
  title: string;
  icon: 'list' | 'history';
  description: string;
  books: BookType[];
  showActions?: boolean;
  onStatusChange?: (book: BookType, newStatus: 'want_to_read' | 'read') => void;
}

export function ReadingSection({ 
  title, 
  icon, 
  description, 
  books, 
  showActions = false,
  onStatusChange
}: ReadingSectionProps) {
  const handleStatusChange = (book: BookType, newStatus: 'want_to_read' | 'read') => {
    // Only propagate the status change if it's different from the current section
    const isCurrentSection = (icon === 'list' && newStatus === 'want_to_read') ||
                           (icon === 'history' && newStatus === 'read');
    
    if (!isCurrentSection) {
      onStatusChange?.(book, newStatus);
    }
  };

  const handleRemove = (book: BookType) => {
    onStatusChange?.(book, 'none');
  };

  return (
    <div className="bg-white rounded-xl p-6 mt-8">
      <div className="flex items-center space-x-2 mb-6">
        {icon === 'list' ? (
          <Book className="h-5 w-5 text-primary" />
        ) : (
          <Clock className="h-5 w-5 text-primary" />
        )}
        <h2 className="text-xl font-semibold text-primary">{title}</h2>
      </div>

      {books.length > 0 ? (
        <div className="space-y-4">
          {books.map((book) => (
            <BookCard 
              key={book.id} 
              book={book}
              showActions={showActions}
              defaultStatus={icon === 'list' ? 'want_to_read' : 'read'}
              onStatusChange={handleStatusChange}
              onRemove={handleRemove}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-primary/70">
          <p>{description}</p>
        </div>
      )}
    </div>
  );
}