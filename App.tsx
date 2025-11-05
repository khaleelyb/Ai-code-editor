
import React, { useState, useCallback, useMemo } from 'react';
import { FileExplorer } from './components/FileExplorer';
import { CodeEditor } from './components/CodeEditor';
import { AiPanel } from './components/AiPanel';
import { UploadIcon, DownloadIcon } from './components/Icons';
import { FileSystemNode, File } from './types';
import { processUploadedFiles, createZipFromTree } from './utils/fileUtils';
import { generateCode } from './services/geminiService';

const App: React.FC = () => {
  const [fileTree, setFileTree] = useState<FileSystemNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiPrompt, setAiPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const tree = await processUploadedFiles(files);
        setFileTree(tree);
        setSelectedFile(null);
        setError(null);
      } catch (e) {
        setError('Failed to process uploaded folder.');
        console.error(e);
      }
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const updateFileContent = useCallback((path: string, newContent: string) => {
    const updateNode = (nodes: FileSystemNode[]): FileSystemNode[] => {
      return nodes.map(node => {
        if ('children' in node) {
          return { ...node, children: updateNode(node.children) };
        }
        if (node.path === path) {
          return { ...node, content: newContent };
        }
        return node;
      });
    };

    setFileTree(prevTree => updateNode(prevTree));
    if (selectedFile && selectedFile.path === path) {
      setSelectedFile(prevFile => prevFile ? { ...prevFile, content: newContent } : null);
    }
  }, [selectedFile]);

  const handleCreateNode = useCallback((parentPath: string | null, name: string, type: 'file' | 'directory') => {
    if (!name || !name.trim()) {
        setError('Name cannot be empty.');
        return;
    }
    
    const trimmedName = name.trim();

    const addNodeRecursively = (nodes: FileSystemNode[]): FileSystemNode[] => {
        return nodes.map(node => {
            if ('children' in node && node.path === parentPath) {
                if (node.children.some(child => child.name === trimmedName)) {
                     setError(`Name "${trimmedName}" already exists.`);
                     throw new Error('Duplicate name');
                }
                const newPath = parentPath ? `${parentPath}/${trimmedName}` : trimmedName;
                const newNode = type === 'file'
                    ? { name: trimmedName, path: newPath, content: '' }
                    : { name: trimmedName, path: newPath, children: [] };

                const newChildren = [...node.children, newNode];
                newChildren.sort((a, b) => {
                    const aIsDir = 'children' in a;
                    const bIsDir = 'children' in b;
                    if (aIsDir && !bIsDir) return -1;
                    if (!aIsDir && bIsDir) return 1;
                    return a.name.localeCompare(b.name);
                });
                return { ...node, children: newChildren };
            } else if ('children' in node) {
                return { ...node, children: addNodeRecursively(node.children) };
            }
            return node;
        });
    };
    
    try {
        setError(null);
        if (parentPath === null) { // Creating at root
            if (fileTree.some(child => child.name === trimmedName)) {
                setError(`Name "${trimmedName}" already exists at the root.`);
                return;
            }
            const newNode = type === 'file'
                ? { name: trimmedName, path: trimmedName, content: '' }
                : { name: trimmedName, path: trimmedName, children: [] };
            
            const newTree = [...fileTree, newNode];
             newTree.sort((a, b) => {
                const aIsDir = 'children' in a;
                const bIsDir = 'children' in b;
                if (aIsDir && !bIsDir) return -1;
                if (!aIsDir && bIsDir) return 1;
                return a.name.localeCompare(b.name);
            });
            setFileTree(newTree);

        } else {
             setFileTree(prevTree => addNodeRecursively(prevTree));
        }
    } catch (e: any) {
         if (e.message !== 'Duplicate name') {
             console.error(e);
             setError('Failed to create item.');
         }
    }
}, [fileTree]);


  const handleCodeChange = (newContent: string) => {
    if (selectedFile) {
      updateFileContent(selectedFile.path, newContent);
    }
  };

  const handleAiSubmit = async () => {
    if (!selectedFile || !aiPrompt.trim()) {
      setError('Please select a file and enter a prompt.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const modifiedCode = await generateCode(selectedFile.content, aiPrompt);
      updateFileContent(selectedFile.path, modifiedCode);
    } catch (e) {
      setError('Failed to get response from AI. Please check your API key and try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (fileTree.length === 0) {
      setError('No files to download.');
      return;
    }
    try {
      // @ts-ignore - JSZip is loaded from CDN
      const zip = new JSZip();
      createZipFromTree(fileTree, zip);
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'edited-code.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      setError('Failed to create ZIP file.');
      console.error(e);
    }
  };

  const selectedFileContent = useMemo(() => selectedFile?.content ?? '', [selectedFile]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800 border-b border-gray-700 p-2 flex justify-between items-center z-10 shadow-md">
        <h1 className="text-xl font-bold text-cyan-400">AI Code Editor</h1>
        <div className="flex items-center space-x-4">
          <label htmlFor="folder-upload" className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md inline-flex items-center transition-colors">
            <UploadIcon />
            <span className="ml-2">Upload Folder</span>
          </label>
          <input
            id="folder-upload"
            type="file"
            // @ts-ignore
            webkitdirectory="true"
            directory="true"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
          <button onClick={handleDownload} disabled={fileTree.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md inline-flex items-center transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
            <DownloadIcon />
            <span className="ml-2">Download ZIP</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="bg-red-500 text-white p-2 text-center" onClick={() => setError(null)}>{error}</div>
      )}

      <main className="flex-grow grid grid-cols-1 md:grid-cols-[280px_1fr] lg:grid-cols-[280px_1fr_320px] overflow-hidden">
        {fileTree.length > 0 ? (
          <>
            <div className="bg-gray-800 border-r border-gray-700 overflow-y-auto">
              <FileExplorer tree={fileTree} onFileSelect={handleFileSelect} onCreateNode={handleCreateNode} selectedPath={selectedFile?.path} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <CodeEditor content={selectedFileContent} onChange={handleCodeChange} fileSelected={!!selectedFile} />
            </div>
            <div className="bg-gray-800 border-l border-gray-700 overflow-y-auto hidden lg:block">
              <AiPanel prompt={aiPrompt} onPromptChange={setAiPrompt} onSubmit={handleAiSubmit} isLoading={isLoading} />
            </div>
          </>
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center text-gray-500 h-full">
            <UploadIcon className="w-24 h-24 mb-4" />
            <h2 className="text-2xl">Upload a folder to get started</h2>
            <p>Click the "Upload Folder" button in the header.</p>
          </div>
        )}
      </main>
      
      {/* AI Panel for mobile/tablet */}
      {fileTree.length > 0 && (
          <div className="bg-gray-800 border-t border-gray-700 p-2 block lg:hidden">
               <AiPanel prompt={aiPrompt} onPromptChange={setAiPrompt} onSubmit={handleAiSubmit} isLoading={isLoading} />
          </div>
      )}
    </div>
  );
};

export default App;
