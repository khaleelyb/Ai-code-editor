
import React from 'react';

interface CodeEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  fileSelected: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ content, onChange, fileSelected }) => {
  if (!fileSelected) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-gray-500">
        <p>Select a file from the explorer to view its content.</p>
      </div>
    );
  }

  return (
    <div className="flex-grow w-full h-full bg-[#1e1e1e]">
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-4 bg-[#1e1e1e] text-gray-200 font-mono text-sm resize-none border-none focus:outline-none"
        spellCheck="false"
      />
    </div>
  );
};
