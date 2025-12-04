import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST - Create a new interview for an application
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
    const { interviewType, interviewDatetime, notes, outcome } = body;

    // Create the interview
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        interviewType,
        interviewDatetime: new Date(interviewDatetime),
        notes,
        outcome,
      },
    });

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    console.error('Error creating interview:', error);
    return NextResponse.json(
      { error: 'Failed to create interview' },
      { status: 500 }
    );
  }
}

// GET - Get all interviews for an application
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

    const interviews = await prisma.interview.findMany({
      where: {
        applicationId,
      },
      orderBy: {
        interviewDatetime: 'asc',
      },
    });

    return NextResponse.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interviews' },
      { status: 500 }
    );
  }
}
