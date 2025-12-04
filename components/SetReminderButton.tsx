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

interface SetReminderButtonProps {
  applicationId: number;
}

export function SetReminderButton({ applicationId }: SetReminderButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDatetime, setReminderDatetime] = useState('');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/applications/${applicationId}/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reminderTitle,
          reminderDatetime,
          message: message || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to set reminder');
      }

      // Reset form and close
      setReminderTitle('');
      setReminderDatetime('');
      setMessage('');
      setIsOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Error setting reminder:', error);
      alert(error instanceof Error ? error.message : 'Failed to set reminder');
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
        ⏰ Set Reminder
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="font-semibold text-lg mb-4">Set Reminder</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reminder-title">Reminder Type *</Label>
            <Select value={reminderTitle} onValueChange={setReminderTitle} required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Application Deadline</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="interview_prep">Interview Prep</SelectItem>
                <SelectItem value="document_upload">Document Upload</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reminder-datetime">Date & Time *</Label>
            <Input
              id="reminder-datetime"
              type="datetime-local"
              value={reminderDatetime}
              onChange={(e) => setReminderDatetime(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What do you need to remember?"
              rows={3}
              required
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting || !reminderTitle || !reminderDatetime || !message}>
              {isSubmitting ? 'Setting...' : 'Set Reminder'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setReminderTitle('');
                setReminderDatetime('');
                setMessage('');
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
