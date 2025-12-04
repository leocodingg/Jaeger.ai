// JOBS LIST PAGE - Server Component with Folder Organization
// Displays all job applications with folder management

import { prisma } from '@/lib/prisma';
import { CreateJobForm } from '@/components/CreateJobForm';
import { JobsPageClient } from '@/components/JobsPageClient';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function JobsPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect('/login');
  }

  // Fetch applications with folder assignments
  const applicationsRaw = await prisma.applicationEntry.findMany({
    where: {
      studentEmail: session.user.email,
    },
    include: {
      job: true,
      user: true,
      folders: {
        select: {
          folderId: true,
        },
      },
      interviews: {
        orderBy: {
          interviewDatetime: 'asc',
        },
      },
      reminders: {
        orderBy: {
          reminderDatetime: 'asc',
        },
      },
      documents: {
        orderBy: {
          uploadDate: 'desc',
        },
      },
    },
    orderBy: {
      appliedTime: 'desc',
    },
  });

  // Fetch user's folders
  const folders = await prisma.applicationFolder.findMany({
    where: {
      studentEmail: session.user.email,
    },
    include: {
      _count: {
        select: {
          applications: true,
        },
      },
    },
    orderBy: {
      folderName: 'asc',
    },
  });

  // Serialize dates for client component
  const applications = applicationsRaw.map(app => ({
    ...app,
    appliedTime: app.appliedTime.toISOString(),
    user: {
      ...app.user,
      dateRegistered: app.user.dateRegistered.toISOString(),
    },
    interviews: app.interviews.map(interview => ({
      ...interview,
      interviewDatetime: interview.interviewDatetime?.toISOString() || null,
    })),
    reminders: app.reminders.map(reminder => ({
      ...reminder,
      reminderDatetime: reminder.reminderDatetime?.toISOString() || null,
    })),
    documents: app.documents.map(doc => ({
      ...doc,
      uploadDate: doc.uploadDate.toISOString(),
    })),
  }));

  async function handleLogout() {
    'use server';
    const { signOut } = await import('@/lib/auth');
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Job Applications
            </h1>
            <p className="text-gray-600">
              Logged in as: {session.user.email}
            </p>
          </div>
          <form action={handleLogout}>
            <Button type="submit" variant="outline">
              Logout
            </Button>
          </form>
        </div>

        {/* Create Job Form */}
        <CreateJobForm userEmail={session.user.email} />

        {/* Client Component with Folder Management */}
        <JobsPageClient applications={applications} folders={folders} />
      </div>
    </div>
  );
}

// CONCEPTS USED:
// 1. Server Component - fetches data on server, passes to client
// 2. Client Component - handles interactivity (folder filtering)
// 3. M:N Relationship - Applications can be in multiple folders
// 4. Prisma include - fetches related data with _count aggregation
// 5. TypeScript - Type-safe props between server/client components
