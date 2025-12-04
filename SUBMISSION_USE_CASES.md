# Jaeger.AI - Use Cases and Database Queries
**Course Project - Part 3: Web Application**
**Team Members:** Leo Yu (zy3707), Aadi (arn8074)
**Date:** December 4, 2025

---

## TABLE OF CONTENTS
1. [User Registration & Authentication](#1-user-registration--authentication)
2. [Job Application Management](#2-job-application-management)
3. [Interview Scheduling](#3-interview-scheduling)
4. [Reminder Management](#4-reminder-management)
5. [Document Upload](#5-document-upload)
6. [Folder Organization](#6-folder-organization)
7. [Search & Filtering](#7-search--filtering)
8. [Part 2 Query Support](#8-part-2-query-support)

---

## 1. USER REGISTRATION & AUTHENTICATION

### Use Case 1.1: User Registration
**Description:** New student creates an account to start tracking job applications.

**User Actions:**
1. Navigate to `/register`
2. Fill form: name, email, password, phone number (optional)
3. Click "Register"

**Backend Query (via Prisma ORM):**
```sql
-- Check if email already exists
SELECT id, email, name, password, phone_number, date_registered
FROM student_user
WHERE email = $1
LIMIT 1;

-- If not exists, create new user with hashed password
INSERT INTO student_user (id, email, name, password, phone_number, date_registered)
VALUES ($1, $2, $3, $4, $5, NOW())
RETURNING id, email, name, password, phone_number, date_registered;
```

**Security:**
- Password hashed with bcrypt (10 salt rounds)
- Prepared statement prevents SQL injection ($1, $2 parameters)
- Email uniqueness constraint enforced

**API Endpoint:** `POST /api/register`

---

### Use Case 1.2: User Login
**Description:** Registered student logs in to access their dashboard.

**User Actions:**
1. Navigate to `/login`
2. Enter email and password
3. Click "Sign In"

**Backend Query:**
```sql
-- Retrieve user by email
SELECT id, email, name, password, phone_number, date_registered
FROM student_user
WHERE email = $1
LIMIT 1;

-- In application code: bcrypt.compare(inputPassword, storedPasswordHash)
```

**Security:**
- NextAuth.js JWT-based session management
- Password verified with bcrypt
- Session stored in HTTP-only cookie

**API Endpoint:** NextAuth.js `/api/auth/callback/credentials`

---

### Use Case 1.3: Session Validation
**Description:** Every protected route validates user session before granting access.

**Backend Query:**
```sql
-- Executed automatically by NextAuth on each protected route
-- Validates JWT token and retrieves session data
-- No direct SQL query - JWT verification in memory
```

**Security:**
- Middleware redirects unauthenticated users to `/login`
- Session expires after inactivity
- All API routes check `session.user.email` exists

---

## 2. JOB APPLICATION MANAGEMENT

### Use Case 2.1: Create New Application
**Description:** Student adds a new job application they're tracking.

**User Actions:**
1. On `/jobs` dashboard, click "Add Application"
2. Fill form: company name, job title, job URL, location, salary range, status
3. Click "Create Application"

**Backend Queries:**
```sql
-- Step 1: Create or update job posting (upsert)
INSERT INTO job_posting (job_url, company_name, job_title, location, location_type, salary_min, salary_max)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (job_url)
DO UPDATE SET
  company_name = $2,
  job_title = $3,
  location = $4,
  location_type = $5,
  salary_min = $6,
  salary_max = $7
RETURNING job_url, company_name, job_title, location, location_type, salary_min, salary_max;

-- Step 2: Create application entry
INSERT INTO application_entry (student_email, job_url, applied_time, status, notes)
VALUES ($1, $2, NOW(), $3, $4)
RETURNING application_id, student_email, job_url, applied_time, status, notes;
```

**Security:**
- User email auto-populated from session (can't create for other users)
- Unique constraint on (student_email, job_url) prevents duplicates

**API Endpoint:** `POST /api/jobs`

---

### Use Case 2.2: View All Applications
**Description:** Student sees dashboard with all their job applications.

**User Actions:**
1. Navigate to `/jobs` after login
2. View list of all applications with details

**Backend Query:**
```sql
-- Main query to fetch all applications with related data
SELECT
  ae.application_id, ae.student_email, ae.job_url, ae.applied_time, ae.status, ae.notes,
  jp.job_url, jp.company_name, jp.job_title, jp.location, jp.location_type, jp.salary_min, jp.salary_max,
  su.id, su.email, su.name, su.password, su.phone_number, su.date_registered
FROM application_entry ae
JOIN job_posting jp ON ae.job_url = jp.job_url
JOIN student_user su ON ae.student_email = su.email
WHERE ae.student_email = $1
ORDER BY ae.applied_time DESC;

-- Fetch folder assignments for each application
SELECT application_id, folder_id
FROM application_folder_assignment
WHERE application_id IN ($1, $2, $3, ...);

-- Fetch interviews for each application
SELECT interview_id, application_id, interview_type, interview_datetime, notes, outcome
FROM interview
WHERE application_id IN ($1, $2, $3, ...)
ORDER BY interview_datetime ASC;

-- Fetch reminders for each application
SELECT reminder_id, application_id, reminder_datetime, reminder_title, message
FROM reminder
WHERE application_id IN ($1, $2, $3, ...)
ORDER BY reminder_datetime ASC;

-- Fetch documents for each application
SELECT document_id, application_id, document_type, file_path, upload_date
FROM application_document
WHERE application_id IN ($1, $2, $3, ...)
ORDER BY upload_date DESC;

-- Fetch all folders with application counts
SELECT
  af.folder_id, af.student_email, af.folder_name, af.color,
  COUNT(afa.application_id) AS application_count
FROM application_folder af
LEFT JOIN application_folder_assignment afa ON af.folder_id = afa.folder_id
WHERE af.student_email = $1
GROUP BY af.folder_id, af.student_email, af.folder_name, af.color
ORDER BY af.folder_name ASC;
```

**Features Displayed:**
- Application stats (Total, Applied, Interviewing, Offers)
- Job details (company, title, location, salary)
- Current status with color coding
- Folder tags
- Interview information
- Reminders with overdue detection
- Document badges (clickable to download)

**Page:** `/jobs` (Server Component)

---

### Use Case 2.3: Update Application Status
**Description:** Student updates the status as they progress through the application pipeline.

**User Actions:**
1. On application card, click status dropdown
2. Select new status (e.g., APPLIED → PHONE_SCREEN)
3. Page refreshes with updated status

**Backend Query:**
```sql
-- Verify ownership and update status
UPDATE application_entry
SET status = $1
WHERE application_id = $2
  AND student_email = $3
RETURNING application_id, student_email, job_url, applied_time, status, notes;
```

**Status Workflow:**
- INTERESTED → APPLIED → ONLINE_ASSESSMENT → PHONE_SCREEN → ONSITE → OFFER
- Can mark as REJECTED at any stage

**Security:**
- Authorization check: user can only update their own applications
- Returns 404 if application doesn't belong to user

**API Endpoint:** `PATCH /api/jobs/[id]`

---

### Use Case 2.4: Delete Application
**Description:** Student removes an application they no longer want to track.

**User Actions:**
1. Click delete button on application card
2. Confirm deletion
3. Application removed from list

**Backend Query:**
```sql
-- Verify ownership
SELECT application_id, student_email, job_url, applied_time, status, notes
FROM application_entry
WHERE application_id = $1 AND student_email = $2
LIMIT 1;

-- Delete application (cascades to interviews, reminders, documents, folder assignments)
DELETE FROM application_entry
WHERE application_id = $1 AND student_email = $2
RETURNING application_id, student_email, job_url, applied_time, status, notes;
```

**Cascade Behavior:**
- Deletes all related interviews
- Deletes all related reminders
- Deletes all related documents (files remain in uploads folder)
- Removes all folder assignments

**API Endpoint:** `DELETE /api/jobs/[id]`

---

## 3. INTERVIEW SCHEDULING

### Use Case 3.1: Schedule Interview
**Description:** Student records an upcoming interview for a job application.

**User Actions:**
1. On application card, click "Schedule Interview"
2. Fill form: interview type, date/time, notes, outcome (optional)
3. Click "Schedule"

**Backend Queries:**
```sql
-- Step 1: Verify user owns the application
SELECT application_id, student_email, job_url, applied_time, status, notes
FROM application_entry
WHERE application_id = $1 AND student_email = $2
LIMIT 1;

-- Step 2: Create interview record
INSERT INTO interview (application_id, interview_type, interview_datetime, notes, outcome)
VALUES ($1, $2, $3, $4, $5)
RETURNING interview_id, application_id, interview_type, interview_datetime, notes, outcome;
```

**Interview Types:**
- PHONE - Phone screening
- VIDEO - Video interview (Zoom, Teams, etc.)
- ONSITE - In-person interview
- TECHNICAL - Coding/technical assessment
- BEHAVIORAL - Behavioral/cultural fit interview

**Security:**
- Authorization via parent application ownership
- Enum values validated (uppercase: PHONE, VIDEO, etc.)

**API Endpoint:** `POST /api/applications/[id]/interviews`

---

### Use Case 3.2: View Upcoming Interviews
**Description:** Student sees all scheduled interviews across all applications.

**User Actions:**
1. On dashboard, view interview sections on application cards
2. See upcoming interviews sorted by date

**Backend Query:**
```sql
-- Fetched as part of "View All Applications" query
SELECT interview_id, application_id, interview_type, interview_datetime, notes, outcome
FROM interview
WHERE application_id IN ($1, $2, $3, ...)
ORDER BY interview_datetime ASC;
```

**Display Features:**
- Interview type badge (color-coded)
- Date/time formatting
- Notes (interviewer name, topics to prepare)
- Outcome tracking (passed, rejected, waiting for feedback)

**Supports Part 2 Query 4a:** "Show all upcoming interviews" (filter client-side by datetime > now)

---

## 4. REMINDER MANAGEMENT

### Use Case 4.1: Set Reminder
**Description:** Student creates a reminder for deadlines or follow-ups.

**User Actions:**
1. On application card, click "Set Reminder"
2. Fill form: reminder type, date/time, message
3. Click "Create Reminder"

**Backend Queries:**
```sql
-- Step 1: Verify user owns the application
SELECT application_id, student_email, job_url, applied_time, status, notes
FROM application_entry
WHERE application_id = $1 AND student_email = $2
LIMIT 1;

-- Step 2: Create reminder
INSERT INTO reminder (application_id, reminder_datetime, reminder_title, message)
VALUES ($1, $2, $3, $4)
RETURNING reminder_id, application_id, reminder_datetime, reminder_title, message;
```

**Reminder Types:**
- DEADLINE - Application deadline
- FOLLOW_UP - Follow up on application status
- INTERVIEW_PREP - Prepare for upcoming interview
- DOCUMENT_UPLOAD - Upload required documents
- OTHER - Custom reminder

**API Endpoint:** `POST /api/applications/[id]/reminders`

---

### Use Case 4.2: View Reminders with Overdue Detection
**Description:** Student sees all reminders with visual indicators for overdue items.

**User Actions:**
1. View dashboard
2. See reminders on application cards with color coding

**Backend Query:**
```sql
-- Fetched as part of "View All Applications" query
SELECT reminder_id, application_id, reminder_datetime, reminder_title, message
FROM reminder
WHERE application_id IN ($1, $2, $3, ...)
ORDER BY reminder_datetime ASC;
```

**Client-Side Logic:**
```javascript
// Overdue detection in JobsPageClient.tsx
const reminderDate = new Date(reminder.reminderDatetime);
const isOverdue = reminderDate < new Date();

// Display with appropriate styling:
// - Yellow background: upcoming reminder
// - Red background + border: overdue reminder
```

**Display Features:**
- Visual overdue detection (red = overdue, yellow = upcoming)
- Reminder type and datetime
- Custom message

---

## 5. DOCUMENT UPLOAD

### Use Case 5.1: Upload Document
**Description:** Student uploads resume, cover letter, or other documents for an application.

**User Actions:**
1. On application card, click "Upload Document"
2. Select document type (resume, cover_letter, other)
3. Choose file (.pdf, .doc, .docx, .txt)
4. Click "Upload"

**Backend Queries:**
```sql
-- Step 1: Verify user owns the application
SELECT application_id, student_email, job_url, applied_time, status, notes
FROM application_entry
WHERE application_id = $1 AND student_email = $2
LIMIT 1;

-- Step 2: Save file to filesystem
-- File saved to: /public/uploads/{applicationId}_{timestamp}_{originalFilename}

-- Step 3: Create document record
INSERT INTO application_document (application_id, document_type, file_path, upload_date)
VALUES ($1, $2, $3, NOW())
RETURNING document_id, application_id, document_type, file_path, upload_date;
```

**File Handling:**
- Local storage in `/public/uploads/` directory
- Unique filename generation: `{appId}_{timestamp}_{originalName}`
- Accessible via URL: `/uploads/{filename}`

**Document Types:**
- RESUME - Resume/CV
- COVER_LETTER - Cover letter
- OTHER - Transcript, portfolio, etc.

**Security:**
- Authorization via parent application ownership
- File type validation (accepts .pdf, .doc, .docx, .txt)
- Enum validation (uppercase: RESUME, COVER_LETTER, OTHER)

**API Endpoint:** `POST /api/applications/[id]/documents`

---

### Use Case 5.2: View and Download Documents
**Description:** Student views all uploaded documents and can download them.

**User Actions:**
1. See document badges on application cards
2. Click badge to open/download document in new tab

**Backend Query:**
```sql
-- Fetched as part of "View All Applications" query
SELECT document_id, application_id, document_type, file_path, upload_date
FROM application_document
WHERE application_id IN ($1, $2, $3, ...)
ORDER BY upload_date DESC;
```

**Display Features:**
- Clickable badges with document type
- Opens in new tab for viewing/downloading
- Most recent documents shown first

---

## 6. FOLDER ORGANIZATION

### Use Case 6.1: Create Folder
**Description:** Student creates a custom folder to organize applications (e.g., "Dream Jobs", "Backup Options", "Remote Only").

**User Actions:**
1. On dashboard sidebar, click "Create Folder"
2. Enter folder name
3. Click "Create"

**Backend Query:**
```sql
-- Create new folder
INSERT INTO application_folder (student_email, folder_name)
VALUES ($1, $2)
RETURNING folder_id, student_email, folder_name, color;
```

**Security:**
- User email auto-populated from session
- User can only see their own folders

**API Endpoint:** `POST /api/folders`

---

### Use Case 6.2: Assign Application to Folder
**Description:** Student adds an application to one or more folders for organization.

**User Actions:**
1. On application card, click "Add to Folder" dropdown
2. Select folder(s)
3. Application now appears in folder filter

**Backend Queries:**
```sql
-- Step 1: Verify user owns the folder
SELECT folder_id, student_email, folder_name, color
FROM application_folder
WHERE folder_id = $1 AND student_email = $2
LIMIT 1;

-- Step 2: Verify user owns the application
SELECT application_id, student_email, job_url, applied_time, status, notes
FROM application_entry
WHERE application_id = $3 AND student_email = $2
LIMIT 1;

-- Step 3: Check if assignment already exists
SELECT application_id, folder_id
FROM application_folder_assignment
WHERE application_id = $1 AND folder_id = $2
LIMIT 1;

-- Step 4: Create assignment (M:N relationship)
INSERT INTO application_folder_assignment (application_id, folder_id)
VALUES ($1, $2)
RETURNING application_id, folder_id;
```

**M:N Relationship:**
- An application can be in multiple folders
- A folder can contain multiple applications

**API Endpoint:** `POST /api/folders/[id]/assign`

---

### Use Case 6.3: Filter Applications by Folder
**Description:** Student views only applications in a specific folder.

**User Actions:**
1. Click folder name in sidebar
2. Application list filters to show only apps in that folder

**Client-Side Filtering:**
```javascript
// No additional query - filtering happens client-side in JobsPageClient
const filteredApplications = applications.filter(app =>
  selectedFolderId === null ||
  app.folders.some(fa => fa.folderId === selectedFolderId)
);
```

**Display:**
- Folder sidebar shows count of apps in each folder
- Selected folder highlighted
- Click "All Applications" to clear filter

---

### Use Case 6.4: Remove Application from Folder
**Description:** Student removes an application from a folder.

**User Actions:**
1. On application card, click "Add to Folder" dropdown
2. Deselect folder (checkmark removed)
3. Application removed from that folder

**Backend Query:**
```sql
-- Delete M:N assignment
DELETE FROM application_folder_assignment
WHERE application_id = $1 AND folder_id = $2
RETURNING application_id, folder_id;
```

**API Endpoint:** `DELETE /api/folders/[id]/assign`

---

### Use Case 6.5: Delete Folder
**Description:** Student deletes a folder they no longer need.

**User Actions:**
1. In folder sidebar, click delete icon on folder
2. Folder removed (applications remain, only assignments deleted)

**Backend Queries:**
```sql
-- Step 1: Verify user owns the folder
SELECT folder_id, student_email, folder_name, color
FROM application_folder
WHERE folder_id = $1 AND student_email = $2
LIMIT 1;

-- Step 2: Delete folder (cascades to assignments)
DELETE FROM application_folder
WHERE folder_id = $1 AND student_email = $2
RETURNING folder_id, student_email, folder_name, color;
```

**Cascade Behavior:**
- Deletes all folder assignments in application_folder_assignment
- Applications remain intact

**API Endpoint:** `DELETE /api/folders/[id]`

---

## 7. SEARCH & FILTERING

### Use Case 7.1: Search Applications by Company or Job Title
**Description:** Student quickly finds specific applications using search.

**User Actions:**
1. On dashboard, type in search bar (e.g., "Google" or "Software Engineer")
2. Results filter in real-time

**Client-Side Filtering:**
```javascript
// No database query - filtering happens client-side in JobsPageClient
const filteredApplications = applications.filter(app => {
  const matchesSearch = searchQuery === '' ||
    app.job.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.job.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());

  return matchesSearch;
});
```

**Features:**
- Case-insensitive search
- Searches both company name and job title
- Shows result count
- Combines with folder filter (search within folder)

**Supports Part 2 Query 4d:** "Show all job postings from 'Google'" (type "Google" in search)

---

## 8. PART 2 QUERY SUPPORT

The web application supports all Part 2 queries through the UI:

### Query 4a: Show all upcoming interviews
**Implementation:**
```javascript
// Client-side filtering in JobsPageClient
const upcomingInterviews = applications.flatMap(app =>
  app.interviews.filter(interview =>
    new Date(interview.interviewDatetime) > new Date()
  )
);
```
**UI Location:** Interview sections on application cards, sorted by datetime

---

### Query 4b: Show all rejected applications
**Implementation:**
```javascript
// Client-side filtering
const rejectedApplications = applications.filter(app =>
  app.status === 'REJECTED'
);
```
**UI Location:** Dashboard - can manually filter or view in stats

---

### Query 4c: Show user names and jobs they are tracking
**SQL Query (executed on page load):**
```sql
SELECT
  su.name AS user_name,
  jp.company_name,
  jp.job_title,
  ae.status,
  ae.applied_time
FROM application_entry ae
JOIN student_user su ON ae.student_email = su.email
JOIN job_posting jp ON ae.job_url = jp.job_url
WHERE ae.student_email = $1
ORDER BY ae.applied_time DESC;
```
**UI Location:** Dashboard shows user name at top, each card shows job details

---

### Query 4d: Show all job postings from 'Google'
**Implementation:**
```javascript
// Use search bar to filter by company
const googleJobs = applications.filter(app =>
  app.job.companyName.toLowerCase().includes('google')
);
```
**UI Location:** Search bar - type "Google" to filter

---

## SECURITY IMPLEMENTATION SUMMARY

### 1. Prepared Statements
**All queries use Prisma ORM with parameterized queries:**
```sql
-- Example showing parameter placeholders
SELECT * FROM student_user WHERE email = $1;
INSERT INTO application_entry (student_email, job_url, status) VALUES ($1, $2, $3);
```
**Coverage:** 100% of database operations

---

### 2. Session Management
**NextAuth.js JWT-based sessions:**
- HTTP-only cookies
- Server-side validation on every protected route
- Auto-refresh
- Redirect to login on expiration

---

### 3. Authorization Checks
**Every API route validates ownership:**
```sql
-- Example pattern used in all API routes
SELECT * FROM application_entry
WHERE application_id = $1 AND student_email = $2;
-- Returns 404 if user doesn't own the resource
```

---

### 4. Password Hashing
**bcrypt with 10 salt rounds:**
```javascript
// Registration
const hashedPassword = await bcrypt.hash(password, 10);

// Login
const isValid = await bcrypt.compare(inputPassword, storedHash);
```

---

### 5. XSS Prevention
**React auto-escaping + validation:**
- All user input in JSX is automatically escaped
- No `dangerouslySetInnerHTML` used
- Form validation on client and server
- Next.js security headers

---

## TECHNOLOGY STACK

| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.0.3 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL (Neon Cloud) |
| ORM | Prisma 6.19.0 |
| Authentication | NextAuth.js v5 |
| Password Hashing | bcrypt |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (Radix UI) |
| State Management | React Server Components + Client Components |
| File Upload | Next.js FormData API |

---

## CONCLUSION

This web application provides a comprehensive job application tracking system with:
- **8 database tables** fully utilized
- **30+ source files** organized in Next.js App Router structure
- **20+ API endpoints** implementing RESTful patterns
- **15+ React components** for rich user interface
- **5 security measures** (prepared statements, sessions, authorization, bcrypt, XSS prevention)
- **Full CRUD operations** for applications, interviews, reminders, documents, and folders
- **M:N relationships** for flexible folder organization
- **Search and filtering** for easy navigation
- **Real-time updates** with overdue detection and status tracking

All Part 2 queries are supported through the UI, and all Part 3 requirements are implemented.
