'use client';

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

interface ScheduleInterviewButtonProps {
  applicationId: number;
}

export function ScheduleInterviewButton({ applicationId }: ScheduleInterviewButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [interviewType, setInterviewType] = useState('');
  const [interviewDatetime, setInterviewDatetime] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/applications/${applicationId}/interviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewType: interviewType.toUpperCase(),
          interviewDatetime,
          notes: notes || null,
          outcome: outcome || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to schedule interview');
      }

      // Reset form and close
      setInterviewType('');
      setInterviewDatetime('');
      setNotes('');
      setOutcome('');
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error scheduling interview:', error);
      alert(error instanceof Error ? error.message : 'Failed to schedule interview');
    } finally {
      setIsSubmitting(false);
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
        📅 Schedule Interview
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-4">Schedule Interview</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="interview-type">Interview Type *</Label>
            <Select value={interviewType} onValueChange={setInterviewType} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="onsite">Onsite</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="interview-datetime">Date & Time *</Label>
            <Input
              id="interview-datetime"
              type="datetime-local"
              value={interviewDatetime}
              onChange={(e) => setInterviewDatetime(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interviewer name, topics to prepare, etc."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="outcome">Outcome (optional)</Label>
            <Input
              id="outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              placeholder="e.g., Passed, Rejected, Waiting for feedback"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !interviewType || !interviewDatetime}>
              {isSubmitting ? 'Scheduling...' : 'Schedule'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setInterviewType('');
                setInterviewDatetime('');
                setNotes('');
                setOutcome('');
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
