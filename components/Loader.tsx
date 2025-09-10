
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center my-12 text-center">
      <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-gray-300">AI is analyzing your code...</p>
      <p className="text-sm text-gray-500">This may take a moment.</p>
    </div>
  );
};

export default Loader;
