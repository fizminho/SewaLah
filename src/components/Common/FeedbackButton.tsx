import React, { useState } from 'react';
import FeedbackModal from './FeedbackModal';

const FeedbackButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 font-medium z-50 hover:scale-105 text-sm sm:text-base"
      >
        💬 Feedback
      </button>
      <FeedbackModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};

export default FeedbackButton;
