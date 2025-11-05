
import { FileSystemNode, Directory, File } from '../types';

declare const JSZip: any;

export const processUploadedFiles = (fileList: FileList): Promise<FileSystemNode[]> => {
  return new Promise((resolve, reject) => {
    const root: Directory = { name: 'root', path: '', children: [] };
    const filePromises: Promise<void>[] = [];

    for (const file of Array.from(fileList)) {
      const path = (file as any).webkitRelativePath;
      const parts = path.split('/').filter(Boolean);
      
      let currentLevel: FileSystemNode[] = root.children;
      
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const currentPath = parts.slice(0, i + 1).join('/');
        let directory = currentLevel.find(item => 'children' in item && item.name === part) as Directory | undefined;
        
        if (!directory) {
          directory = { name: part, path: currentPath, children: [] };
          currentLevel.push(directory);
        }
        currentLevel = directory.children;
      }
      
      const fileName = parts[parts.length - 1];
      const filePromise = file.text().then(content => {
          const fileNode: File = { name: fileName, path, content };
          currentLevel.push(fileNode);
      });
      filePromises.push(filePromise);
    }
    
    Promise.all(filePromises).then(() => resolve(root.children)).catch(reject);
  });
};


export const createZipFromTree = (nodes: FileSystemNode[], zipFolder: any) => {
  nodes.forEach(node => {
    if ('children' in node) { // It's a directory
      const newFolder = zipFolder.folder(node.name);
      createZipFromTree(node.children, newFolder);
    } else { // It's a file
      zipFolder.file(node.name, node.content);
    }
  });
};
