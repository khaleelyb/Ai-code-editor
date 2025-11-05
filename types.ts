
export interface File {
  name: string;
  path: string;
  content: string;
}

export interface Directory {
  name:string;
  path: string;
  children: FileSystemNode[];
}

export type FileSystemNode = File | Directory;
