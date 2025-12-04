'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Folder {
  id: number;
  folderName: string;
}

interface AddToFolderButtonProps {
  applicationId: number;
  folders: Folder[];
  currentFolderIds: number[];
}

export function AddToFolderButton({ applicationId, folders, currentFolderIds }: AddToFolderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleAssign(folderId: number) {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/folders/${folderId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add to folder');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error adding to folder:', error);
      alert(error instanceof Error ? error.message : 'Failed to add to folder');
      setIsProcessing(false);
    }
  }

  async function handleRemove(folderId: number) {
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/folders/${folderId}/assign?applicationId=${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove from folder');
      }

      window.location.reload();
    } catch (error) {
      console.error('Error removing from folder:', error);
      alert('Failed to remove from folder');
      setIsProcessing(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        📁 Folders
      </Button>
    );
  }

  return (
    <div className="absolute right-0 top-0 mt-10 bg-white border rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-sm">Manage Folders</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {folders.length === 0 ? (
        <p className="text-sm text-gray-500">No folders available</p>
      ) : (
        <div className="space-y-1">
          {folders.map((folder) => {
            const isInFolder = currentFolderIds.includes(folder.id);
            return (
              <button
                key={folder.id}
                onClick={() => (isInFolder ? handleRemove(folder.id) : handleAssign(folder.id))}
                disabled={isProcessing}
                className={`w-full text-left px-2 py-1 rounded text-sm transition-colors ${
                  isInFolder
                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    : 'hover:bg-gray-100'
                }`}
              >
                {isInFolder ? '✓ ' : ''}
                {folder.folderName}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
