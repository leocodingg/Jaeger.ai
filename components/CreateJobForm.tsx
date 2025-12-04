// CREATE JOB FORM - Client Component
// This form lets users add new job applications

'use client'; // ← Makes this a Client Component (can use useState, onClick, etc.)

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// CONCEPT: Client Component
// - Runs in the browser
// - Can use useState, event handlers
// - Can't directly access database (must use API)

interface CreateJobFormProps {
  userEmail: string;
}

export function CreateJobForm({ userEmail }: CreateJobFormProps) {
  // STATE: Track whether form is visible
  const [isOpen, setIsOpen] = useState(false);

  // STATE: Track form submission status
  const [isSubmitting, setIsSubmitting] = useState(false);

  // FUNCTION: Handle form submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    // Prevent default form behavior (page reload)
    e.preventDefault();

    setIsSubmitting(true);

    // STEP 1: Get form data
    // FormData API extracts all input values
    const formData = new FormData(e.currentTarget);

    // STEP 2: Convert FormData to plain object
    // IMPORTANT: Convert empty strings to null for optional fields
    const rawData = {
      jobUrl: formData.get('jobUrl'),
      jobTitle: formData.get('jobTitle'),
      companyName: formData.get('companyName'),
      location: formData.get('location'),
      locationType: formData.get('locationType'),
      salaryMin: formData.get('salaryMin'),
      salaryMax: formData.get('salaryMax'),
      studentEmail: userEmail, // Use logged-in user's email
      status: formData.get('status'),
      notes: formData.get('notes'),
    };

    // CONCEPT: Convert empty strings to null
    // WHY: Database enums don't accept empty strings, only valid values or null
    const data = {
      ...rawData,
      locationType: rawData.locationType || null,
      location: rawData.location || null,
      salaryMin: rawData.salaryMin || null,
      salaryMax: rawData.salaryMax || null,
      notes: rawData.notes || null,
    };

    try {
      // STEP 3: Send POST request to API
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create job');
      }

      // STEP 4: Success! Close form and refresh page
      alert('Job application created successfully!');
      setIsOpen(false);

      // Reload the page to show new job
      // (In a real app, we'd use React Query or state management)
      window.location.reload();

    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create job application');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mb-6">
      {/* Toggle Button */}
      {!isOpen && (
        <Button onClick={() => setIsOpen(true)} size="lg">
          + Add New Job Application
        </Button>
      )}

      {/* Form (shown when isOpen is true) */}
      {isOpen && (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">New Job Application</h2>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Job URL */}
            <div>
              <Label htmlFor="jobUrl">Job URL *</Label>
              <Input
                id="jobUrl"
                name="jobUrl"
                type="url"
                placeholder="https://careers.google.com/jobs/123"
                required
              />
            </div>

            {/* Job Title */}
            <div>
              <Label htmlFor="jobTitle">Job Title *</Label>
              <Input
                id="jobTitle"
                name="jobTitle"
                placeholder="Software Engineer"
                required
              />
            </div>

            {/* Company Name */}
            <div>
              <Label htmlFor="companyName">Company *</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Google"
                required
              />
            </div>

            {/* Location */}
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                name="location"
                placeholder="Mountain View, CA"
              />
            </div>

            {/* Location Type */}
            <div>
              <Label htmlFor="locationType">Location Type</Label>
              <Select name="locationType">
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REMOTE">Remote</SelectItem>
                  <SelectItem value="HYBRID">Hybrid</SelectItem>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="salaryMin">Min Salary</Label>
                <Input
                  id="salaryMin"
                  name="salaryMin"
                  type="number"
                  placeholder="80000"
                />
              </div>
              <div>
                <Label htmlFor="salaryMax">Max Salary</Label>
                <Input
                  id="salaryMax"
                  name="salaryMax"
                  type="number"
                  placeholder="120000"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue="INTERESTED">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERESTED">Interested</SelectItem>
                  <SelectItem value="APPLIED">Applied</SelectItem>
                  <SelectItem value="ONLINE_ASSESSMENT">Online Assessment</SelectItem>
                  <SelectItem value="PHONE_SCREEN">Phone Screen</SelectItem>
                  <SelectItem value="ONSITE">Onsite</SelectItem>
                  <SelectItem value="OFFER">Offer</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any additional notes..."
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Application'}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// CONCEPTS USED:
// 1. 'use client' - Makes this a Client Component
// 2. useState - React hook for managing state
// 3. Event handlers - onClick, onSubmit
// 4. FormData API - Extract form values
// 5. fetch() - Make HTTP request to API
// 6. Conditional rendering - {isOpen && <form>}
