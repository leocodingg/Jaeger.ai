// API ROUTE: /api/jobs/[id]
// Handles PATCH requests to update job application status
// [id] is a dynamic route parameter - Next.js captures it automatically

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CONCEPT: Dynamic Route Parameters
// The file path [id] means this route handles /api/jobs/1, /api/jobs/2, etc.
// Next.js passes the id value in the params object

// TYPE DEFINITION: Define the shape of our params
type Params = {
  params: {
    id: string;  // Route parameter from [id] in filename
  };
};

// ============================================================================
// PATCH /api/jobs/[id] - Update application status
// ============================================================================

export async function PATCH(
  request: Request,
  { params }: Params  // Destructure params from second argument
) {
  try {
    // STEP 1: Get the application ID from the URL
    // Example: /api/jobs/123 → params.id = "123"
    // IMPORTANT: In Next.js 15+, params is a Promise and must be awaited
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    // Validate ID is a valid number
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // STEP 2: Parse request body to get new status
    const body = await request.json();
    const { status } = body;

    // Validate status is provided
    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    // STEP 3: Update the application in database
    // Prisma's update() finds by id and updates the fields
    const updatedApplication = await prisma.applicationEntry.update({
      where: {
        id: id,  // Find application by id
      },
      data: {
        status: status,  // Update status field
      },
      include: {
        job: true,   // Include related job data in response
        user: true,  // Include related user data in response
      },
    });

    // STEP 4: Return updated application
    return NextResponse.json(updatedApplication);

  } catch (error) {
    console.error('Error updating job application:', error);

    // Check if error is because application not found
    // Prisma throws error with code P2025 when record not found
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update job application' },
      { status: 500 }
    );
  }
}

// EQUIVALENT SQL:
// UPDATE application_entry
// SET status = 'APPLIED'
// WHERE id = 123
// RETURNING *;
//
// -- Then JOINs to get related data:
// SELECT
//   ae.*,
//   jp.*,
//   su.*
// FROM application_entry ae
// JOIN job_posting jp ON ae.job_url = jp.job_url
// JOIN student_user su ON ae.student_email = su.email
// WHERE ae.id = 123;

// ============================================================================
// DELETE /api/jobs/[id] - Delete application (bonus feature)
// ============================================================================

export async function DELETE(
  request: Request,
  { params }: Params
) {
  try {
    // Await params in Next.js 15+
    const { id: paramId } = await params;
    const id = parseInt(paramId);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid application ID' },
        { status: 400 }
      );
    }

    // Prisma's delete() removes the record
    await prisma.applicationEntry.delete({
      where: { id },
    });

    // Return success (204 No Content is standard for successful DELETE)
    return new NextResponse(null, { status: 204 });

  } catch (error) {
    console.error('Error deleting job application:', error);

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete job application' },
      { status: 500 }
    );
  }
}

// EQUIVALENT SQL for DELETE:
// DELETE FROM application_entry
// WHERE id = 123;
