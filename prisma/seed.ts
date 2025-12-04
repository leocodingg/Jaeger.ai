// SEED SCRIPT - Populates database with test data
// Run with: npm run seed (or npx prisma db seed)

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================================
  // 1. CREATE USERS
  // ============================================================================
  console.log('Creating users...');

  const leo = await prisma.user.create({
    data: {
      email: 'leo.yu@example.com',
      name: 'Leo Yu',
      password: 'hashed_password_123', // In real app, use bcrypt to hash
      phoneNumber: '555-0101',
    },
  });

  const aadi = await prisma.user.create({
    data: {
      email: 'aadi.narayan@example.com',
      name: 'Aadi Narayan',
      password: 'hashed_password_456',
      phoneNumber: '555-0102',
    },
  });

  const test = await prisma.user.create({
    data: {
      email: 'test.user@example.com',
      name: 'Test User',
      password: 'hashed_password_789',
    },
  });

  console.log(`✅ Created ${3} users`);

  // ============================================================================
  // 2. CREATE JOB POSTINGS
  // ============================================================================
  console.log('Creating job postings...');

  await prisma.jobPosting.createMany({
    data: [
      {
        jobUrl: 'https://careers.google.com/swe-intern',
        companyName: 'Google',
        jobTitle: 'Software Engineer Intern',
        location: 'Mountain View, CA',
        locationType: 'HYBRID',
        salaryMin: 80000,
        salaryMax: 120000,
      },
      {
        jobUrl: 'https://careers.google.com/pm-intern',
        companyName: 'Google',
        jobTitle: 'Product Manager Intern',
        location: 'New York, NY',
        locationType: 'HYBRID',
        salaryMin: 85000,
        salaryMax: 130000,
      },
      {
        jobUrl: 'https://amazon.jobs/sde-intern',
        companyName: 'Amazon',
        jobTitle: 'Software Development Engineer Intern',
        location: 'Seattle, WA',
        locationType: 'ONSITE',
        salaryMin: 75000,
        salaryMax: 110000,
      },
      {
        jobUrl: 'https://careers.microsoft.com/explore-intern',
        companyName: 'Microsoft',
        jobTitle: 'Explore Intern',
        location: 'Redmond, WA',
        locationType: 'REMOTE',
        salaryMin: 70000,
        salaryMax: 100000,
      },
      {
        jobUrl: 'https://startup.com/backend-engineer',
        companyName: 'Tech Startup',
        jobTitle: 'Backend Engineer',
        location: 'San Francisco, CA',
        locationType: 'REMOTE',
        salaryMin: 120000,
        salaryMax: 180000,
      },
    ],
  });

  console.log(`✅ Created ${5} job postings`);

  // ============================================================================
  // 3. CREATE FOLDERS (for Leo)
  // ============================================================================
  console.log('Creating folders...');

  const bigTechFolder = await prisma.applicationFolder.create({
    data: {
      studentEmail: leo.email,
      folderName: 'Big Tech',
      color: '#4285F4', // Google blue
    },
  });

  const startupsFolder = await prisma.applicationFolder.create({
    data: {
      studentEmail: leo.email,
      folderName: 'Startups',
      color: '#34A853', // Green
    },
  });

  const remoteFolder = await prisma.applicationFolder.create({
    data: {
      studentEmail: leo.email,
      folderName: 'Remote Roles',
      color: '#FBBC05', // Yellow
    },
  });

  console.log(`✅ Created ${3} folders`);

  // ============================================================================
  // 4. CREATE APPLICATION ENTRIES
  // ============================================================================
  console.log('Creating application entries...');

  // Leo's applications
  const leoGoogleApp = await prisma.applicationEntry.create({
    data: {
      studentEmail: leo.email,
      jobUrl: 'https://careers.google.com/swe-intern',
      status: 'APPLIED',
      notes: 'Applied through referral from classmate',
    },
  });

  const leoAmazonApp = await prisma.applicationEntry.create({
    data: {
      studentEmail: leo.email,
      jobUrl: 'https://amazon.jobs/sde-intern',
      status: 'ONSITE',
      notes: 'Final round interview scheduled',
    },
  });

  const leoMicrosoftApp = await prisma.applicationEntry.create({
    data: {
      studentEmail: leo.email,
      jobUrl: 'https://careers.microsoft.com/explore-intern',
      status: 'OFFER',
      notes: 'Received offer! Need to respond by Dec 15',
    },
  });

  const leoStartupApp = await prisma.applicationEntry.create({
    data: {
      studentEmail: leo.email,
      jobUrl: 'https://startup.com/backend-engineer',
      status: 'INTERESTED',
      notes: 'Found on LinkedIn, need to tailor resume',
    },
  });

  // Aadi's applications
  const aadiGoogleApp = await prisma.applicationEntry.create({
    data: {
      studentEmail: aadi.email,
      jobUrl: 'https://careers.google.com/swe-intern',
      status: 'APPLIED',
    },
  });

  const aadiAmazonApp = await prisma.applicationEntry.create({
    data: {
      studentEmail: aadi.email,
      jobUrl: 'https://amazon.jobs/sde-intern',
      status: 'REJECTED',
      notes: 'Did not pass online assessment',
    },
  });

  // Test user's application
  await prisma.applicationEntry.create({
    data: {
      studentEmail: test.email,
      jobUrl: 'https://startup.com/backend-engineer',
      status: 'INTERESTED',
    },
  });

  console.log(`✅ Created ${7} application entries`);

  // ============================================================================
  // 5. ASSIGN APPLICATIONS TO FOLDERS (Many-to-many)
  // ============================================================================
  console.log('Assigning applications to folders...');

  await prisma.applicationFolderAssignment.createMany({
    data: [
      // Google app → Big Tech folder
      { applicationId: leoGoogleApp.id, folderId: bigTechFolder.id },
      // Amazon app → Big Tech folder
      { applicationId: leoAmazonApp.id, folderId: bigTechFolder.id },
      // Microsoft app → Big Tech folder AND Remote folder (multi-folder!)
      { applicationId: leoMicrosoftApp.id, folderId: bigTechFolder.id },
      { applicationId: leoMicrosoftApp.id, folderId: remoteFolder.id },
      // Startup app → Startups folder AND Remote folder
      { applicationId: leoStartupApp.id, folderId: startupsFolder.id },
      { applicationId: leoStartupApp.id, folderId: remoteFolder.id },
    ],
  });

  console.log(`✅ Assigned applications to folders`);

  // ============================================================================
  // 6. CREATE INTERVIEW
  // ============================================================================
  console.log('Creating interviews...');

  await prisma.interview.create({
    data: {
      applicationId: leoAmazonApp.id,
      interviewType: 'ONSITE',
      interviewDatetime: new Date('2025-12-10T14:00:00'),
      notes: 'Final round - system design + behavioral',
    },
  });

  console.log(`✅ Created ${1} interview`);

  // ============================================================================
  // 7. CREATE REMINDER
  // ============================================================================
  console.log('Creating reminders...');

  await prisma.reminder.create({
    data: {
      applicationId: leoStartupApp.id,
      reminderDatetime: new Date('2025-12-05T09:00:00'),
      reminderTitle: 'Follow up with recruiter',
      message: 'Send email asking about application status',
    },
  });

  console.log(`✅ Created ${1} reminder`);

  // ============================================================================
  // 8. CREATE DOCUMENT
  // ============================================================================
  console.log('Creating documents...');

  await prisma.applicationDocument.create({
    data: {
      applicationId: leoGoogleApp.id,
      documentType: 'RESUME',
      filePath: '/uploads/leo-yu-resume-v2.pdf',
    },
  });

  console.log(`✅ Created ${1} document`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nSummary:');
  console.log(`- ${3} users`);
  console.log(`- ${5} job postings`);
  console.log(`- ${3} folders`);
  console.log(`- ${7} application entries`);
  console.log(`- ${6} folder assignments (2 apps in multiple folders)`);
  console.log(`- ${1} interview`);
  console.log(`- ${1} reminder`);
  console.log(`- ${1} document`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
