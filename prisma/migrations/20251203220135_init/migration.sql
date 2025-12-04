-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('INTERESTED', 'APPLIED', 'ONLINE_ASSESSMENT', 'PHONE_SCREEN', 'ONSITE', 'OFFER', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterviewType" AS ENUM ('PHONE', 'VIDEO', 'ONSITE', 'TECHNICAL', 'BEHAVIORAL');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('RESUME', 'COVER_LETTER', 'OTHER');

-- CreateTable
CREATE TABLE "student_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "phone_number" TEXT,
    "date_registered" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_posting" (
    "job_url" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_title" TEXT NOT NULL,
    "location" TEXT,
    "location_type" "LocationType",
    "salary_min" INTEGER,
    "salary_max" INTEGER,

    CONSTRAINT "job_posting_pkey" PRIMARY KEY ("job_url")
);

-- CreateTable
CREATE TABLE "application_entry" (
    "application_id" SERIAL NOT NULL,
    "student_email" TEXT NOT NULL,
    "job_url" TEXT NOT NULL,
    "applied_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ApplicationStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "application_entry_pkey" PRIMARY KEY ("application_id")
);

-- CreateTable
CREATE TABLE "application_folder" (
    "folder_id" SERIAL NOT NULL,
    "student_email" TEXT NOT NULL,
    "folder_name" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "application_folder_pkey" PRIMARY KEY ("folder_id")
);

-- CreateTable
CREATE TABLE "application_folder_assignment" (
    "application_id" INTEGER NOT NULL,
    "folder_id" INTEGER NOT NULL,

    CONSTRAINT "application_folder_assignment_pkey" PRIMARY KEY ("application_id","folder_id")
);

-- CreateTable
CREATE TABLE "interview" (
    "interview_id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "interview_type" "InterviewType",
    "interview_datetime" TIMESTAMP(3),
    "notes" TEXT,
    "outcome" TEXT,

    CONSTRAINT "interview_pkey" PRIMARY KEY ("interview_id")
);

-- CreateTable
CREATE TABLE "reminder" (
    "reminder_id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "reminder_datetime" TIMESTAMP(3) NOT NULL,
    "reminder_title" TEXT NOT NULL,
    "message" TEXT,

    CONSTRAINT "reminder_pkey" PRIMARY KEY ("reminder_id")
);

-- CreateTable
CREATE TABLE "application_document" (
    "document_id" SERIAL NOT NULL,
    "application_id" INTEGER NOT NULL,
    "document_type" "DocumentType" NOT NULL,
    "file_path" TEXT NOT NULL,
    "upload_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "application_document_pkey" PRIMARY KEY ("document_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_user_email_key" ON "student_user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "application_entry_student_email_job_url_key" ON "application_entry"("student_email", "job_url");

-- AddForeignKey
ALTER TABLE "application_entry" ADD CONSTRAINT "application_entry_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "student_user"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_entry" ADD CONSTRAINT "application_entry_job_url_fkey" FOREIGN KEY ("job_url") REFERENCES "job_posting"("job_url") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_folder" ADD CONSTRAINT "application_folder_student_email_fkey" FOREIGN KEY ("student_email") REFERENCES "student_user"("email") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_folder_assignment" ADD CONSTRAINT "application_folder_assignment_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application_entry"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_folder_assignment" ADD CONSTRAINT "application_folder_assignment_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "application_folder"("folder_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interview" ADD CONSTRAINT "interview_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application_entry"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reminder" ADD CONSTRAINT "reminder_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application_entry"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "application_document" ADD CONSTRAINT "application_document_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "application_entry"("application_id") ON DELETE CASCADE ON UPDATE CASCADE;
