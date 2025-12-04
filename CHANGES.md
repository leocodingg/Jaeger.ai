# Project Changes Log

This document tracks all modifications made to the Jaeger.AI Job Application Tracking System.

---

## Session: December 4, 2025

### 1. Fixed Authentication Configuration
**Problem:** Server configuration error when signing in
**Root Causes:**
- `.env` file had `DATABASE_URL` and `AUTH_SECRET` on same line without newline
- NextAuth config missing explicit `secret` option

**Files Modified:**
- `/lib/auth.ts` - Added explicit `secret: process.env.AUTH_SECRET` to NextAuth config
- `/.env` - Fixed formatting (separated DATABASE_URL and AUTH_SECRET onto separate lines)

**Impact:** Authentication now works correctly, users can register and login successfully

---

### 2. Fixed Prisma Schema Field Name Mismatches
**Problem:** Prisma validation errors due to field name inconsistencies between code and database schema

**Issues Fixed:**

#### Issue A: `folderAssignments` vs `folders`
- **Schema Reality:** Relation field is named `folders` in ApplicationEntry model
- **Code Issue:** Multiple files referenced `folderAssignments`
- **Files Modified:**
  - `/app/jobs/page.tsx` - Changed `folderAssignments` to `folders` in include query
  - `/components/JobsPageClient.tsx` - Updated interface and all usages

#### Issue B: `name` vs `folderName`
- **Schema Reality:** Field is named `folderName` in ApplicationFolder model
- **Code Issue:** Multiple files referenced `name`
- **Files Modified:**
  - `/app/jobs/page.tsx` - Changed `orderBy: { name: 'asc' }` to `orderBy: { folderName: 'asc' }`
  - `/app/api/folders/route.ts` - Updated GET and POST handlers to use `folderName`
  - `/components/FolderList.tsx` - Updated interface and display to use `folderName`
  - `/components/JobsPageClient.tsx` - Updated interface to use `folderName`
  - `/components/AddToFolderButton.tsx` - Updated interface and display to use `folderName`
  - `/components/CreateFolderDialog.tsx` - Changed API payload from `{ name, description }` to `{ folderName: name, description }`

#### Issue C: `assignments` vs `applications`
- **Schema Reality:** Relation field is named `applications` in ApplicationFolder model
- **Code Issue:** Multiple files referenced `assignments` in `_count`
- **Files Modified:**
  - `/app/jobs/page.tsx` - Changed `_count.select.assignments` to `_count.select.applications`
  - `/app/api/folders/route.ts` - Updated GET handler count field
  - `/components/FolderList.tsx` - Updated interface `_count.applications`
  - `/components/JobsPageClient.tsx` - Updated interface `_count.applications`

**Impact:** Folder system now works correctly with proper database field names

---

### 3. Removed Manual Email Input from Application Form
**Problem:** Users could manually enter any email address when creating applications, allowing them to create applications for other users

**Solution:** Auto-populate email from authenticated session

**Files Modified:**
- `/app/jobs/page.tsx` - Pass `userEmail={session.user.email}` prop to CreateJobForm
- `/components/CreateJobForm.tsx`:
  - Added `CreateJobFormProps` interface with `userEmail: string`
  - Updated component to accept `userEmail` prop
  - Changed `studentEmail: formData.get('studentEmail')` to `studentEmail: userEmail`
  - Removed entire email input field from form (lines 202-213)

**Impact:** Applications are now automatically associated with the logged-in user's account, improving security and UX

---

### 4. Fixed Status Counter Logic (Cumulative Counts)
**Problem:** "Applied" counter only showed applications in "APPLIED" status, but logically if you're interviewing or have an offer, you've still applied

**Solution:** Changed "Applied" counter to include all forward progression statuses

**Files Modified:**
- `/components/JobsPageClient.tsx` - Updated Applied counter filter from:
  ```typescript
  filteredApplications.filter(a => a.status === 'APPLIED').length
  ```
  to:
  ```typescript
  filteredApplications.filter(a =>
    ['APPLIED', 'ONLINE_ASSESSMENT', 'PHONE_SCREEN', 'ONSITE', 'OFFER'].includes(a.status)
  ).length
  ```

**Impact:** Status counters now show cumulative progress (Applied includes everything except INTERESTED and REJECTED)

---

### 5. Implemented Interview Scheduling Feature ✅
**Feature:** Students can now schedule and track interviews for each application

**Implementation:**

#### API Route: `/app/api/applications/[id]/interviews/route.ts`
- **POST** - Create new interview for an application
  - Validates user owns the application
  - Stores interview type, datetime, notes, outcome
- **GET** - Retrieve all interviews for an application
  - Returns interviews sorted by date

**Important Fix:** Updated params handling for Next.js 15/16 compatibility:
- Changed `{ params }: { params: { id: string } }` to `{ params }: { params: Promise<{ id: string }> }`
- Added `const { id } = await params;` before accessing param values

#### UI Component: `/components/ScheduleInterviewButton.tsx`
- Modal form with fields:
  - Interview Type (phone, video, onsite, technical, behavioral)
  - Date & Time (datetime-local input)
  - Notes (optional - interviewer name, topics, etc.)
  - Outcome (optional - passed, rejected, waiting for feedback)
- Form validation ensures required fields are filled
- Auto-reloads page after successful scheduling

#### Display Updates: `/components/JobsPageClient.tsx`
- Added `Interview` interface to TypeScript definitions
- Updated `Application` interface to include `interviews: Interview[]`
- Added interview display section showing:
  - Interview type and datetime
  - Notes and outcome (if available)
  - Purple-themed card design for visual distinction
- Added `ScheduleInterviewButton` to application cards

#### Data Flow Updates: `/app/jobs/page.tsx`
- Added `interviews` include to Prisma query with `orderBy: { interviewDatetime: 'asc' }`
- Added interview date serialization for client component compatibility:
  ```typescript
  interviews: app.interviews.map(interview => ({
    ...interview,
    interviewDatetime: interview.interviewDatetime?.toISOString() || null,
  }))
  ```

**Impact:**
- Addresses Part 3 requirement for interview scheduling
- Enables Query 4a: "Show all upcoming interviews" (can now be filtered client-side)
- Users can track full interview pipeline for each application

---

### 6. Implemented Set Reminders Feature ✅
**Feature:** Students can create and track reminders for deadlines and follow-ups

**Implementation:**

#### API Route: `/app/api/applications/[id]/reminders/route.ts`
- **POST** - Create new reminder for an application
  - Validates user owns the application
  - Stores reminder type, datetime, message
- **GET** - Retrieve all reminders for an application
  - Returns reminders sorted by date

#### UI Component: `/components/SetReminderButton.tsx`
- Modal form with fields:
  - Reminder Type (deadline, follow_up, interview_prep, document_upload, other)
  - Date & Time (datetime-local input)
  - Message (required - what to remember)
- Form validation ensures all required fields are filled

#### Display Updates: `/components/JobsPageClient.tsx`
- Added `Reminder` interface to TypeScript definitions
- Updated `Application` interface to include `reminders: Reminder[]`
- Added reminder display section with overdue detection:
  - Yellow background for upcoming reminders
  - Red background with border for overdue reminders
  - Shows reminder type, datetime, and message
- Added `SetReminderButton` to application cards

#### Data Flow Updates: `/app/jobs/page.tsx`
- Added `reminders` include to Prisma query with `orderBy: { reminderDatetime: 'asc' }`
- Added reminder date serialization

**Impact:**
- Addresses Part 3 requirement for reminder management
- Visual overdue indicator helps users stay on top of deadlines

---

### 7. Implemented Upload Documents Feature ✅
**Feature:** Students can upload and manage documents (resume, cover letter, etc.) for each application

**Implementation:**

#### API Route: `/app/api/applications/[id]/documents/route.ts`
- **POST** - Upload document for an application
  - Validates user owns the application
  - Accepts multipart/form-data file upload
  - Creates `/public/uploads/` directory if needed
  - Generates unique filename: `{applicationId}_{timestamp}_{originalName}`
  - Stores file to disk
  - Saves file reference in database
- **GET** - Retrieve all documents for an application
  - Returns documents sorted by upload date (newest first)

#### UI Component: `/components/UploadDocumentButton.tsx`
- Modal form with fields:
  - Document Type (resume, cover_letter, transcript, portfolio, other)
  - File input with accept filter (`.pdf,.doc,.docx,.txt`)
- Shows supported file formats
- Handles file upload with FormData API

#### Display Updates: `/components/JobsPageClient.tsx`
- Added `Document` interface to TypeScript definitions
- Updated `Application` interface to include `documents: Document[]`
- Added document display section showing:
  - Clickable document badges
  - Opens in new tab for download/view
  - Blue-themed design
- Added `UploadDocumentButton` to application cards

#### Data Flow Updates: `/app/jobs/page.tsx`
- Added `documents` include to Prisma query with `orderBy: { uploadDate: 'desc' }`
- Added document upload date serialization

#### File System:
- Created `/public/uploads/` directory
- Added to `.gitignore` to exclude uploaded files from version control
- Files accessible via `/uploads/{filename}` URL

**Impact:**
- Addresses Part 3 requirement for document uploads
- Local file storage (simple approach suitable for course project)
- Users can attach resumes, cover letters, and other documents to applications

---

### 8. Fixed Logout Functionality
**Problem:** Logout button threw "Failed to fetch" error
**Solution:** Added redirect parameter to signOut function
**Files Modified:**
- `/app/jobs/page.tsx` - Changed `await signOut()` to `await signOut({ redirectTo: '/login' })`

**Impact:** Logout now properly redirects users to login page

---

## Summary of Key Improvements

1. **Authentication** - Now works reliably with proper configuration
2. **Folder System** - Fully functional with correct database field mappings
3. **Security** - Applications automatically tied to logged-in user
4. **UX** - Removed confusing email input field
5. **Data Accuracy** - Status counters reflect logical progression through application stages
6. **Interview Scheduling** ✅ - Full CRUD for interviews with proper Next.js 16 compatibility
7. **Set Reminders** ✅ - Create and track reminders with overdue detection
8. **Upload Documents** ✅ - File upload system for resumes, cover letters, etc.
9. **Logout Fix** ✅ - Properly redirects after logout

---

## Technical Debt / Known Issues

- None currently identified

---

## Part 3 Requirements Status

All core requirements from the PDF are now complete:

1. ~~**Public Job Postings View**~~ - ❌ **NOT NEEDED** (Users create job entries when tracking applications)
2. ~~**Upload Documents**~~ - ✅ **COMPLETED** (December 4, 2025)
3. ~~**Schedule Interview**~~ - ✅ **COMPLETED** (December 4, 2025)
4. ~~**Set Reminders**~~ - ✅ **COMPLETED** (December 4, 2025)

### Security Features ✅
- **Session Management**: NextAuth.js JWT-based sessions
- **Prepared Statements**: Prisma ORM automatically uses parameterized queries (prevents SQL injection)
- **Authorization Checks**: All API routes verify user owns the data they're accessing
- **Password Hashing**: bcrypt (stronger than MD5)
- **XSS Prevention**: React escapes user input by default

### Student Features ✅
- ✅ View applications
- ✅ Create applications
- ✅ Update application status
- ✅ Upload documents (resume, cover letter)
- ✅ Schedule interviews
- ✅ Set reminders
- ✅ Organize into folders
- ✅ Search applications
- ✅ Logout

**All Part 3 requirements have been implemented!**
