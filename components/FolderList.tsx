'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Folder {
  id: number;
  folderName: string;
  color: string | null;
  _count: {
    applications: number;
  };
}

interface FolderListProps {
  folders: Folder[];
  selectedFolderId: number | null;
  onSelectFolder: (folderId: number | null) => void;
}

export function FolderList({ folders, selectedFolderId, onSelectFolder }: FolderListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleDelete(folderId: number) {
    if (!confirm('Delete this folder? Applications will not be deleted, only removed from the folder.')) {
      return;
    }

    setDeletingId(folderId);

    try {
      const response = await fetch(`/api/folders/${folderId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete folder');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting folder:', error);
      alert('Failed to delete folder');
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-2">
      {/* All Applications */}
      <button
        onClick={() => onSelectFolder(null)}
        className={`w-full text-left p-3 rounded-lg transition-colors ${
          selectedFolderId === null
            ? 'bg-blue-100 text-blue-900 font-medium'
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        <div className="flex justify-between items-center">
          <span>📋 All Applications</span>
        </div>
      </button>

      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder.id}
          className={`p-3 rounded-lg transition-colors ${
            selectedFolderId === folder.id
              ? 'bg-blue-100 text-blue-900'
              : 'bg-white hover:bg-gray-50'
          }`}
        >
          <button
            onClick={() => onSelectFolder(folder.id)}
            className="w-full text-left"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">📁 {folder.folderName}</span>
              <span className="text-sm text-gray-500">
                {folder._count.applications}
              </span>
            </div>
          </button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(folder.id)}
            disabled={deletingId === folder.id}
            className="mt-2 w-full text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {deletingId === folder.id ? 'Deleting...' : 'Delete Folder'}
          </Button>
        </div>
      ))}

      {folders.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">
          No folders yet. Create one to organize your applications!
        </p>
      )}
    </div>
  );
}
