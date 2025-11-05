
import React, { useState, useRef, useEffect } from 'react';
import { FileSystemNode, File } from '../types';
import { FolderIcon, FolderOpenIcon, FileIcon, FilePlusIcon, FolderPlusIcon } from './Icons';

interface CreatorInputProps {
  type: 'file' | 'directory';
  parentPath: string | null;
  onSubmit: (parentPath: string | null, name: string, type: 'file' | 'directory') => void;
  onCancel: () => void;
  level?: number;
}

const CreatorInput: React.FC<CreatorInputProps> = ({ type, parentPath, onSubmit, onCancel, level = 0 }) => {
    const [name, setName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(parentPath, name, type);
    };

    return (
        <form onSubmit={handleSubmit} style={{ paddingLeft: `${level * 1}rem` }} className="p-1">
            <div className="flex items-center">
                {type === 'file' ? <FileIcon /> : <FolderIcon />}
                <input
                    ref={inputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={onCancel}
                    onKeyDown={(e) => e.key === 'Escape' && onCancel()}
                    placeholder={type === 'file' ? 'New file name...' : 'New folder name...'}
                    className="ml-2 w-full bg-gray-600 text-white text-sm rounded px-1 outline-none focus:ring-1 focus:ring-cyan-500"
                />
            </div>
        </form>
    );
};

interface FileExplorerProps {
  tree: FileSystemNode[];
  onFileSelect: (file: File) => void;
  onCreateNode: (parentPath: string | null, name: string, type: 'file' | 'directory') => void;
  selectedPath?: string;
}

const TreeNode: React.FC<{ 
    node: FileSystemNode; 
    onFileSelect: (file: File) => void; 
    onCreateNode: (parentPath: string | null, name: string, type: 'file' | 'directory') => void;
    selectedPath?: string; 
    level?: number 
}> = ({ node, onFileSelect, onCreateNode, selectedPath, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCreating, setIsCreating] = useState<'file' | 'directory' | null>(null);

  const handleCreateSubmit = (parentPath: string | null, name: string, type: 'file' | 'directory') => {
      onCreateNode(parentPath, name, type);
      setIsCreating(null);
  };

  if ('children' in node) { // It's a directory
    return (
      <div style={{ paddingLeft: `${level * 1}rem` }}>
        <div className="group flex items-center justify-between p-1 rounded hover:bg-gray-700 transition-colors">
            <div 
              onClick={() => setIsOpen(!isOpen)} 
              className="flex items-center cursor-pointer flex-grow"
            >
              {isOpen ? <FolderOpenIcon /> : <FolderIcon />}
              <span className="ml-2 font-semibold">{node.name}</span>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <button onClick={() => setIsCreating('file')} title="New File" className="p-1 rounded hover:bg-gray-600"><FilePlusIcon /></button>
                <button onClick={() => setIsCreating('directory')} title="New Folder" className="p-1 rounded hover:bg-gray-600"><FolderPlusIcon /></button>
            </div>
        </div>
        {isOpen && (
          <div>
            {isCreating && (
                <CreatorInput 
                    type={isCreating}
                    parentPath={node.path}
                    onSubmit={handleCreateSubmit}
                    onCancel={() => setIsCreating(null)}
                    level={level + 1}
                />
            )}
            {node.children.map(child => (
              <TreeNode key={child.path} node={child} onFileSelect={onFileSelect} onCreateNode={onCreateNode} selectedPath={selectedPath} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  } else { // It's a file
    const isSelected = selectedPath === node.path;
    return (
      <div style={{ paddingLeft: `${level * 1}rem` }}>
        <div 
          onClick={() => onFileSelect(node)} 
          className={`flex items-center cursor-pointer p-1 rounded transition-colors ${isSelected ? 'bg-cyan-600 text-white' : 'hover:bg-gray-700'}`}
        >
          <FileIcon />
          <span className="ml-2">{node.name}</span>
        </div>
      </div>
    );
  }
};

export const FileExplorer: React.FC<FileExplorerProps> = ({ tree, onFileSelect, onCreateNode, selectedPath }) => {
  const [isCreatingRoot, setIsCreatingRoot] = useState<'file' | 'directory' | null>(null);

  const handleCreateRootSubmit = (parentPath: string | null, name: string, type: 'file' | 'directory') => {
      onCreateNode(parentPath, name, type);
      setIsCreatingRoot(null);
  }

  return (
    <div className="p-2 text-sm text-gray-300">
        <div className="flex items-center justify-between p-1 mb-2 border-b border-gray-700">
            <span className="font-bold">Project</span>
            <div className="flex items-center space-x-1">
                 <button onClick={() => setIsCreatingRoot('file')} title="New File at Root" className="p-1 rounded hover:bg-gray-600"><FilePlusIcon /></button>
                <button onClick={() => setIsCreatingRoot('directory')} title="New Folder at Root" className="p-1 rounded hover:bg-gray-600"><FolderPlusIcon /></button>
            </div>
        </div>
        {isCreatingRoot && (
            <CreatorInput 
                type={isCreatingRoot}
                parentPath={null}
                onSubmit={handleCreateRootSubmit}
                onCancel={() => setIsCreatingRoot(null)}
                level={0}
            />
        )}
      {tree.map(node => (
        <TreeNode key={node.path} node={node} onFileSelect={onFileSelect} onCreateNode={onCreateNode} selectedPath={selectedPath} />
      ))}
    </div>
  );
};
