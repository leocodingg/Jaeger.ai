'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface DeleteButtonProps {
  applicationId: number;
}

export function DeleteButton({ applicationId }: DeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm('Delete this application? This cannot be undone.')) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/jobs/${applicationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      // Reload page to show updated list
      window.location.reload();
    } catch (error) {
      console.error('Error deleting application:', error);
      alert('Failed to delete application');
      setIsDeleting(false);
    }
  }

  return (
    <Button
      onClick={handleDelete}
      disabled={isDeleting}
      variant="outline"
      className="w-full text-red-600 border-red-300 hover:bg-red-50"
      size="sm"
    >
      {isDeleting ? 'Deleting...' : 'Delete'}
    </Button>
  );
}
