
// Shim to make a standard FileList look like a FileSystemDirectoryHandle
// This allows the Agent to read files even when FileSystemAccessAPI is blocked (e.g. in iframes or Mobile)

export class VirtualFileHandle {
    kind = 'file';
    name: string;
    private file: File;

    constructor(file: File) {
        this.name = file.name;
        this.file = file;
    }

    async getFile() {
        return this.file;
    }

    // Mobile/Virtual handles cannot be written to directly.
    // We throw a specific error code that ToolExecutor will catch to trigger a download.
    async createWritable() {
        throw new Error("VIRTUAL_FS_WRITE_NOT_SUPPORTED");
    }
}

export class VirtualDirectoryHandle {
    kind = 'directory';
    name: string;
    children: Map<string, VirtualDirectoryHandle | VirtualFileHandle>;

    constructor(name: string) {
        this.name = name;
        this.children = new Map();
    }

    async getDirectoryHandle(name: string, options?: any) {
        // If creating a directory in virtual mode, we just return a new mock handle 
        // (It won't persist, but it stops the agent from crashing during logic checks)
        if (options?.create && !this.children.has(name)) {
             const newDir = new VirtualDirectoryHandle(name);
             this.children.set(name, newDir);
             return newDir;
        }

        const child = this.children.get(name);
        if (child && child.kind === 'directory') return child;
        throw new Error(`Directory '${name}' not found`);
    }

    async getFileHandle(name: string, options?: any) {
        // If creating a file in virtual mode, return a handle that throws on write
        // This forces the ToolExecutor to fall back to "Download"
        if (options?.create && !this.children.has(name)) {
            // Create a mock file
            const mockFile = new File([""], name);
            const newFileHandle = new VirtualFileHandle(mockFile);
            this.children.set(name, newFileHandle);
            return newFileHandle;
        }

        const child = this.children.get(name);
        if (child && child.kind === 'file') return child;
        throw new Error(`File '${name}' not found`);
    }

    async *entries() {
        for (const [name, handle] of this.children) {
            yield [name, handle];
        }
    }
}

export function createVirtualFileSystem(fileList: FileList): VirtualDirectoryHandle {
    // Determine a root name, defaulting to 'project' or the first folder name found
    const rootName = fileList[0]?.webkitRelativePath.split('/')[0] || 'project';
    const root = new VirtualDirectoryHandle(rootName);

    Array.from(fileList).forEach(file => {
        // webkitRelativePath example: "my-project/src/index.ts"
        // On mobile, webkitRelativePath might be empty, so we fallback to name
        const path = (file.webkitRelativePath || file.name).split('/');
        
        // Navigate or create directories down to the file
        let currentDir = root;
        
        // If webkitRelativePath exists, we traverse. If not (simple file upload), we just put it in root.
        const startIndex = file.webkitRelativePath ? 1 : 0;
        const endIndex = file.webkitRelativePath ? path.length - 1 : 0;

        for (let i = startIndex; i < endIndex; i++) {
            const segment = path[i];
            if (!currentDir.children.has(segment)) {
                currentDir.children.set(segment, new VirtualDirectoryHandle(segment));
            }
            const next = currentDir.children.get(segment);
            if (next instanceof VirtualDirectoryHandle) {
                currentDir = next;
            }
        }
        
        // Add the file leaf
        const fileName = path[path.length - 1];
        currentDir.children.set(fileName, new VirtualFileHandle(file));
    });

    return root;
}
