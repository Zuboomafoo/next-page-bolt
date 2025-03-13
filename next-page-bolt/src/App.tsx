import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { BookOpen, LogOut, UserPlus } from 'lucide-react';
import { Navigation } from './components/Navigation';
import { BookManager } from './components/BookManager';
import { RecommendationsPage } from './pages/RecommendationsPage.tsx';
import { AuthModal } from './components/AuthModal';
import { useAuth } from './lib/auth';

function App() {
  const [showAuth, setShowAuth] = React.useState(false);
  const [authMode, setAuthMode] = React.useState<'signin' | 'signup'>('signup');
  const { user, signOut } = useAuth();

  const handleAuthClick = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <Router>
      <div className="min-h-screen bg-brand-cream">
        <header className="bg-brand-white border-b border-brand-sand sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-8">
                <div className="flex items-center space-x-3">
                  <BookOpen className="h-8 w-8 text-brand-orange" />
                  <h1 className="text-2xl font-semibold text-brand-brown">
                    Next Page
                  </h1>
                </div>
                {user && <Navigation />}
              </div>
              <div className="flex space-x-4">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-brand-brown/80">{user.email}</span>
                    <button
                      onClick={() => signOut()}
                      className="btn-secondary"
                    >
                      <LogOut className="h-4 w-4 inline-block mr-2" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => handleAuthClick('signin')}
                      className="btn-secondary"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => handleAuthClick('signup')}
                      className="btn-primary"
                    >
                      <UserPlus className="h-4 w-4 inline-block mr-2" />
                      Sign Up
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <main>
          {user ? (
            <Routes>
              <Route path="/" element={<RecommendationsPage />} />
              <Route path="/library" element={<BookManager />} />
            </Routes>
          ) : (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
              <h2 className="text-5xl sm:text-6xl font-semibold text-brand-brown mb-6 leading-tight">
                Your Personal Library Awaits
              </h2>
              <p className="text-xl text-brand-brown/80 max-w-2xl mx-auto leading-relaxed mb-8">
                Sign in to start tracking your reading journey, get personalized recommendations,
                and connect with fellow book lovers.
              </p>
              <button
                onClick={() => handleAuthClick('signup')}
                className="btn-primary text-lg"
              >
                Get Started
              </button>
            </div>
          )}
        </main>

        {showAuth && (
          <AuthModal
            onClose={() => setShowAuth(false)}
            initialMode={authMode}
          />
        )}
      </div>
    </Router>
  );
}

export default App;