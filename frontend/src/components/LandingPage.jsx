import React from 'react';
import { MessageSquare } from 'lucide-react';

export const LandingPage = ({ onOpenAuthModal }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
      <div className="text-center text-white">
        <MessageSquare className="w-20 h-20 mx-auto mb-6" />
        <h1 className="text-4xl font-bold mb-4">ChatFlow</h1>
        <p className="text-xl mb-8">Real-time Chat Application</p>
        <button
          onClick={onOpenAuthModal}
          className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100"
        >
          Get Started
        </button>
      </div>
    </div>
  );
};
