import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Library, Sparkles } from 'lucide-react';

export function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="flex space-x-8">
      <Link
        to="/"
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isActive('/') 
            ? 'text-brand-orange bg-brand-orange/10' 
            : 'text-brand-brown/60 hover:text-brand-brown hover:bg-brand-sand/20'
        }`}
      >
        <Sparkles className="h-5 w-5" />
        <span>Recommendations</span>
      </Link>
      <Link
        to="/library"
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
          isActive('/library')
            ? 'text-brand-orange bg-brand-orange/10'
            : 'text-brand-brown/60 hover:text-brand-brown hover:bg-brand-sand/20'
        }`}
      >
        <Library className="h-5 w-5" />
        <span>Your Library</span>
      </Link>
    </nav>
  );
}