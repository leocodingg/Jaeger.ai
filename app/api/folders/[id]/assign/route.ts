import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// POST - Assign application to folder
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

    const { id: paramId } = await params;
    const folderId = parseInt(paramId);
    const body = await request.json();
    const { applicationId } = body;

    if (isNaN(folderId) || !applicationId) {
      return NextResponse.json(
        { error: 'Invalid folder or application ID' },
        { status: 400 }
      );
    }

    // Verify folder belongs to user
    const folder = await prisma.applicationFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.studentEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Folder not found or unauthorized' },
        { status: 403 }
      );
    }

    // Verify application belongs to user
    const application = await prisma.applicationEntry.findUnique({
      where: { id: applicationId },
    });

    if (!application || application.studentEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Application not found or unauthorized' },
        { status: 403 }
      );
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.applicationFolderAssignment.findUnique({
      where: {
        applicationId_folderId: {
          applicationId,
          folderId,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Application already in this folder' },
        { status: 400 }
      );
    }

    // Create assignment
    const assignment = await prisma.applicationFolderAssignment.create({
      data: {
        applicationId,
        folderId,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error('Error assigning application to folder:', error);
    return NextResponse.json(
      { error: 'Failed to assign application to folder' },
      { status: 500 }
    );
  }
}

// DELETE - Remove application from folder
export async function DELETE(
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

    const { id: paramId } = await params;
    const folderId = parseInt(paramId);
    const { searchParams } = new URL(request.url);
    const applicationId = parseInt(searchParams.get('applicationId') || '');

    if (isNaN(folderId) || isNaN(applicationId)) {
      return NextResponse.json(
        { error: 'Invalid folder or application ID' },
        { status: 400 }
      );
    }

    // Verify folder belongs to user
    const folder = await prisma.applicationFolder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.studentEmail !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Delete assignment
    await prisma.applicationFolderAssignment.delete({
      where: {
        applicationId_folderId: {
          applicationId,
          folderId,
        },
      },
    });

    return NextResponse.json({ message: 'Removed from folder' });
  } catch (error) {
    console.error('Error removing application from folder:', error);
    return NextResponse.json(
      { error: 'Failed to remove application from folder' },
      { status: 500 }
    );
  }
}
