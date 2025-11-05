
import React from 'react';
import { SparklesIcon, SpinnerIcon } from './Icons';

interface AiPanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const AiPanel: React.FC<AiPanelProps> = ({ prompt, onPromptChange, onSubmit, isLoading }) => {
  return (
    <div className="p-4 flex flex-col h-full">
      <h2 className="text-lg font-bold mb-2 flex items-center text-cyan-400">
        <SparklesIcon />
        <span className="ml-2">AI Assistant</span>
      </h2>
      <p className="text-sm text-gray-400 mb-4">Enter a prompt to modify the selected file.</p>
      <textarea
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        placeholder="e.g., 'Refactor this function to be async/await' or 'Add comments explaining this code'"
        className="flex-grow p-2 bg-gray-700 text-gray-200 rounded-md resize-none border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        rows={8}
      />
      <button
        onClick={onSubmit}
        disabled={isLoading}
        className="mt-4 w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <SpinnerIcon />
            <span className="ml-2">Generating...</span>
          </>
        ) : (
          <>
            <SparklesIcon />
            <span className="ml-2">Generate Code</span>
          </>
        )}
      </button>
    </div>
  );
};
