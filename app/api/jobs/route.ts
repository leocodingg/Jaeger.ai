// API ROUTE: /api/jobs
// Handles GET requests to fetch all job applications

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// CONCEPT: This function handles GET /api/jobs requests
// Export name MUST be GET (Next.js convention)
export async function GET() {
  try {
    // PRISMA QUERY: Fetch all applications with related data
    // include: { job: true, user: true } means "also fetch related job and user data"
    // This is like a SQL JOIN
    const applications = await prisma.applicationEntry.findMany({
      include: {
        job: true,    // Include job posting details
        user: true,   // Include user details
      },
      orderBy: {
        appliedTime: 'desc', // Newest applications first
      },
    });

    // Return JSON response
    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

// EQUIVALENT SQL:
// SELECT
//   ae.*,
//   jp.*,
//   su.*
// FROM application_entry ae
// JOIN job_posting jp ON ae.job_url = jp.job_url
// JOIN student_user su ON ae.student_email = su.email
// ORDER BY ae.applied_time DESC;

// ============================================================================
// POST /api/jobs - Create new job application
// ============================================================================

export async function POST(request: Request) {
  try {
    // STEP 1: Parse request body (JSON data from the form)
    const body = await request.json();

    // CONCEPT: Destructure the data we need from the request
    // The form will send: { jobUrl, jobTitle, companyName, etc. }
    const {
      jobUrl,
      jobTitle,
      companyName,
      location,
      locationType,
      salaryMin,
      salaryMax,
      studentEmail,
      status,
      notes,
    } = body;

    // STEP 2: Create or update the job posting first
    // upsert = "update if exists, create if not"
    // WHY: Multiple users might apply to the same job
    await prisma.jobPosting.upsert({
      where: { jobUrl },
      update: {}, // Don't update if exists
      create: {
        jobUrl,
        jobTitle,
        companyName,
        location: location || null,
        locationType: locationType || null, // Convert empty string to null
        salaryMin: salaryMin ? parseInt(salaryMin) : null,
        salaryMax: salaryMax ? parseInt(salaryMax) : null,
      },
    });

    // STEP 3: Create the application entry
    // This links the user to the job posting
    const application = await prisma.applicationEntry.create({
      data: {
        studentEmail,
        jobUrl,
        status: status || 'INTERESTED', // Default to INTERESTED
        notes,
      },
      include: {
        job: true,   // Include the job data in response
        user: true,  // Include the user data in response
      },
    });

    // STEP 4: Return the created application
    return NextResponse.json(application, { status: 201 });

  } catch (error) {
    console.error('Error creating job application:', error);
    return NextResponse.json(
      { error: 'Failed to create job application' },
      { status: 500 }
    );
  }
}

// EQUIVALENT SQL for POST:
// -- First, insert job posting (if not exists)
// INSERT INTO job_posting (job_url, company_name, job_title, ...)
// VALUES (...)
// ON CONFLICT (job_url) DO NOTHING;
//
// -- Then, create application entry
// INSERT INTO application_entry (student_email, job_url, status, notes)
// VALUES (...)
// RETURNING *;
