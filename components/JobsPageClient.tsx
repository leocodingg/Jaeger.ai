'use client';

import { useState } from 'react';
import { StatusDropdown } from '@/components/StatusDropdown';
import { DeleteButton } from '@/components/DeleteButton';
import { CreateFolderDialog } from '@/components/CreateFolderDialog';
import { FolderList } from '@/components/FolderList';
import { AddToFolderButton } from '@/components/AddToFolderButton';
import { ScheduleInterviewButton } from '@/components/ScheduleInterviewButton';
import { SetReminderButton } from '@/components/SetReminderButton';
import { UploadDocumentButton } from '@/components/UploadDocumentButton';

interface Job {
  id: number;
  jobTitle: string;
  companyName: string;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  locationType: string | null;
}

interface User {
  id: number;
  name: string;
  email: string;
  dateRegistered: string;
  password: string;
  phoneNumber: string | null;
}

interface Interview {
  id: number;
  interviewType: string;
  interviewDatetime: string | null;
  notes: string | null;
  outcome: string | null;
}

interface Reminder {
  id: number;
  reminderDatetime: string | null;
  reminderTitle: string;
  message: string | null;
}

interface Document {
  id: number;
  documentType: string;
  filePath: string;
  uploadDate: string;
}

interface Application {
  id: number;
  status: string;
  notes: string | null;
  appliedTime: string;
  job: Job;
  user: User;
  folders: { folderId: number }[];
  interviews: Interview[];
  reminders: Reminder[];
  documents: Document[];
}

interface Folder {
  id: number;
  folderName: string;
  color: string | null;
  _count: {
    applications: number;
  };
}

interface JobsPageClientProps {
  applications: Application[];
  folders: Folder[];
}

export function JobsPageClient({ applications, folders }: JobsPageClientProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter applications based on selected folder AND search query
  const filteredApplications = applications.filter(app => {
    // Folder filter
    const matchesFolder = selectedFolderId === null ||
      app.folders.some(fa => fa.folderId === selectedFolderId);

    // Search filter (company name or job title)
    const matchesSearch = searchQuery === '' ||
      app.job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFolder && matchesSearch;
  });

  return (
    <div className="flex gap-6">
      {/* Sidebar - Folders */}
      <div className="w-64 flex-shrink-0">
        <div className="sticky top-8">
          <h2 className="text-xl font-bold mb-4">Folders</h2>
          <CreateFolderDialog />
          <FolderList
            folders={folders}
            selectedFolderId={selectedFolderId}
            onSelectFolder={setSelectedFolderId}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by company or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <p className="text-sm text-gray-600 mt-2">
              Found {filteredApplications.length} result{filteredApplications.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Total Applications</p>
            <p className="text-3xl font-bold">{filteredApplications.length}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Applied</p>
            <p className="text-3xl font-bold text-blue-600">
              {filteredApplications.filter(a =>
                ['APPLIED', 'ONLINE_ASSESSMENT', 'PHONE_SCREEN', 'ONSITE', 'OFFER', 'REJECTED'].includes(a.status)
              ).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Interviewing</p>
            <p className="text-3xl font-bold text-purple-600">
              {filteredApplications.filter(a => ['PHONE_SCREEN', 'ONSITE'].includes(a.status)).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm text-gray-600">Offers</p>
            <p className="text-3xl font-bold text-green-600">
              {filteredApplications.filter(a => a.status === 'OFFER').length}
            </p>
          </div>
        </div>

        {/* Job List */}
        <div className="space-y-4">
          {filteredApplications.map((app) => (
            <div
              key={app.id}
              className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Job Title & Company */}
                  <h3 className="text-xl font-semibold text-gray-900">
                    {app.job.jobTitle}
                  </h3>
                  <p className="text-gray-600 mb-2">{app.job.companyName}</p>

                  {/* Location & Salary */}
                  <div className="flex gap-4 text-sm text-gray-500 mb-3">
                    {app.job.location && <span>📍 {app.job.location}</span>}
                    {app.job.salaryMin && app.job.salaryMax && (
                      <span>
                        💰 ${app.job.salaryMin.toLocaleString()} - $
                        {app.job.salaryMax.toLocaleString()}
                      </span>
                    )}
                    {app.job.locationType && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {app.job.locationType}
                      </span>
                    )}
                  </div>

                  {/* Folder Tags */}
                  {app.folders.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {app.folders.map((fa) => {
                        const folder = folders.find(f => f.id === fa.folderId);
                        return folder ? (
                          <span
                            key={fa.folderId}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            📁 {folder.folderName}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {/* Notes */}
                  {app.notes && (
                    <p className="text-sm text-gray-600 mb-3">
                      📝 {app.notes}
                    </p>
                  )}

                  {/* Interviews */}
                  {app.interviews.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Interviews:</p>
                      {app.interviews.map((interview) => (
                        <div key={interview.id} className="text-sm text-gray-600 bg-purple-50 p-2 rounded mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium capitalize">{interview.interviewType}</span>
                            {interview.interviewDatetime && (
                              <span>• {new Date(interview.interviewDatetime).toLocaleString()}</span>
                            )}
                          </div>
                          {interview.notes && (
                            <p className="text-xs mt-1">{interview.notes}</p>
                          )}
                          {interview.outcome && (
                            <p className="text-xs mt-1 font-medium">Outcome: {interview.outcome}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reminders */}
                  {app.reminders?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Reminders:</p>
                      {app.reminders.map((reminder) => {
                        const reminderDate = reminder.reminderDatetime ? new Date(reminder.reminderDatetime) : null;
                        const isOverdue = reminderDate && reminderDate < new Date();
                        return (
                          <div
                            key={reminder.id}
                            className={`text-sm text-gray-600 p-2 rounded mb-1 ${
                              isOverdue ? 'bg-red-50 border border-red-200' : 'bg-yellow-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium capitalize">{reminder.reminderTitle.replace('_', ' ')}</span>
                              {reminderDate && (
                                <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                  • {reminderDate.toLocaleString()}
                                  {isOverdue && ' (Overdue)'}
                                </span>
                              )}
                            </div>
                            {reminder.message && (
                              <p className="text-xs mt-1">{reminder.message}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Documents */}
                  {app.documents?.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Documents:</p>
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((doc) => (
                          <a
                            key={doc.id}
                            href={doc.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100 transition-colors"
                          >
                            📄 {doc.documentType.replace('_', ' ').toUpperCase()}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Applied by */}
                  <p className="text-xs text-gray-400">
                    Applied by {app.user.name} on{' '}
                    {new Date(app.appliedTime).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2 relative">
                  {/* Status Dropdown */}
                  <StatusDropdown
                    applicationId={app.id}
                    currentStatus={app.status}
                  />

                  {/* Add to Folder Button */}
                  <AddToFolderButton
                    applicationId={app.id}
                    folders={folders}
                    currentFolderIds={app.folders.map(fa => fa.folderId)}
                  />

                  {/* Schedule Interview Button */}
                  <ScheduleInterviewButton applicationId={app.id} />

                  {/* Set Reminder Button */}
                  <SetReminderButton applicationId={app.id} />

                  {/* Upload Document Button */}
                  <UploadDocumentButton applicationId={app.id} />

                  {/* Delete Button */}
                  <DeleteButton applicationId={app.id} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {selectedFolderId === null
                ? 'No applications yet'
                : 'No applications in this folder'}
            </p>
            <p className="text-gray-400 mt-2">
              {selectedFolderId === null
                ? 'Start tracking your job search!'
                : 'Add some applications to this folder!'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
