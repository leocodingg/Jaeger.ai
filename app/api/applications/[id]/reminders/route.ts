import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST - Create a new reminder for an application
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const applicationId = parseInt(id);

    // Verify the application belongs to this user
    const application = await prisma.applicationEntry.findFirst({
      where: {
        id: applicationId,
        studentEmail: session.user.email,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { reminderDatetime, reminderTitle, message } = body;

    // Create the reminder
    const reminder = await prisma.reminder.create({
      data: {
        applicationId,
        reminderDatetime: new Date(reminderDatetime),
        reminderTitle,
        message,
      },
    });

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

// GET - Get all reminders for an application
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const applicationId = parseInt(id);

    // Verify the application belongs to this user
    const application = await prisma.applicationEntry.findFirst({
      where: {
        id: applicationId,
        studentEmail: session.user.email,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        reminderDatetime: 'asc',
      },
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}
