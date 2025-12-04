// STATUS DROPDOWN - Client Component
// Allows users to update job application status

'use client'; // ← Client Component (needs interactivity)

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// CONCEPT: TypeScript Props Interface
// Define what data this component expects to receive
interface StatusDropdownProps {
  applicationId: number;      // ID of the application to update
  currentStatus: string;      // Current status value
  onStatusChange?: () => void; // Optional callback after update
}

// CONCEPT: Status to Color Mapping
// This maps each status to its Tailwind CSS color classes
const STATUS_COLORS = {
  INTERESTED: 'bg-gray-100 text-gray-800',
  APPLIED: 'bg-yellow-100 text-yellow-800',
  ONLINE_ASSESSMENT: 'bg-blue-100 text-blue-800',
  PHONE_SCREEN: 'bg-blue-100 text-blue-800',
  ONSITE: 'bg-purple-100 text-purple-800',
  OFFER: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
} as const;

// CONCEPT: Status Display Names
// Convert database enum values to user-friendly text
const STATUS_LABELS = {
  INTERESTED: 'Interested',
  APPLIED: 'Applied',
  ONLINE_ASSESSMENT: 'Online Assessment',
  PHONE_SCREEN: 'Phone Screen',
  ONSITE: 'Onsite Interview',
  OFFER: 'Offer Received',
  REJECTED: 'Rejected',
} as const;

export function StatusDropdown({
  applicationId,
  currentStatus,
  onStatusChange,
}: StatusDropdownProps) {
  // STATE: Track if we're currently updating
  const [isUpdating, setIsUpdating] = useState(false);

  // FUNCTION: Handle status change
  async function handleStatusChange(newStatus: string) {
    // Prevent duplicate updates
    if (newStatus === currentStatus || isUpdating) {
      return;
    }

    setIsUpdating(true);

    try {
      // STEP 1: Send PATCH request to API
      const response = await fetch(`/api/jobs/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // STEP 2: Success! Optionally call callback
      if (onStatusChange) {
        onStatusChange();
      } else {
        // Default behavior: reload page to show updated data
        window.location.reload();
      }

    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  }

  // Get color classes for current status
  const colorClass = STATUS_COLORS[currentStatus as keyof typeof STATUS_COLORS] || STATUS_COLORS.INTERESTED;

  return (
    <Select
      value={currentStatus}
      onValueChange={handleStatusChange}
      disabled={isUpdating}
    >
      <SelectTrigger
        className={`${colorClass} border-0 font-medium min-w-[180px]`}
      >
        <SelectValue>
          {isUpdating ? 'Updating...' : STATUS_LABELS[currentStatus as keyof typeof STATUS_LABELS]}
        </SelectValue>
      </SelectTrigger>

      <SelectContent>
        <SelectItem value="INTERESTED">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-500" />
            Interested
          </span>
        </SelectItem>

        <SelectItem value="APPLIED">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
            Applied
          </span>
        </SelectItem>

        <SelectItem value="ONLINE_ASSESSMENT">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Online Assessment
          </span>
        </SelectItem>

        <SelectItem value="PHONE_SCREEN">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Phone Screen
          </span>
        </SelectItem>

        <SelectItem value="ONSITE">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            Onsite Interview
          </span>
        </SelectItem>

        <SelectItem value="OFFER">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            Offer Received
          </span>
        </SelectItem>

        <SelectItem value="REJECTED">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Rejected
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}

// CONCEPTS USED:
// 1. TypeScript Interface - Define component props
// 2. 'as const' - Make object values literal types (not just 'string')
// 3. keyof typeof - Get keys of an object as a type
// 4. Optional callback - onStatusChange?: () => void
// 5. Conditional rendering - Show "Updating..." when loading
// 6. fetch() with PATCH method - Update data via HTTP
// 7. Template literals - Dynamic className strings
// 8. Object lookup - STATUS_COLORS[currentStatus]
