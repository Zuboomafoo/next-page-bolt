import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { Book } from '../types';

interface SignUpPromptProps {
  onClose: () => void;
  selectedBooks: Book[];
}

export function SignUpPrompt({ onClose, selectedBooks }: SignUpPromptProps) {
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
        className="relative bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-4">
            <Sparkles className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready to Discover More?
          </h3>
          <p className="text-gray-600 mb-6">
            Create an account to save your recommendations, track your reading progress,
            and get personalized book suggestions based on your taste.
          </p>

          <button className="w-full bg-emerald-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-emerald-700 transition-colors">
            Create Free Account
          </button>
          <button className="w-full mt-3 text-gray-600 hover:text-gray-800">
            Already have an account? Sign in
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}