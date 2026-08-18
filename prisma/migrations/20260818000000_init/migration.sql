CREATE TABLE "Resume" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "headline" TEXT NOT NULL DEFAULT '',
    "template" TEXT NOT NULL DEFAULT 'default-a4',
    "accentColor" TEXT NOT NULL DEFAULT '#0b5fff',
    "sectionOrder" JSONB NOT NULL,
    "sectionVisibility" JSONB NOT NULL,
    "showDeclaration" BOOLEAN NOT NULL DEFAULT false,
    "declarationText" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "lastPrintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Resume_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT '',
    "englishName" TEXT NOT NULL DEFAULT '',
    "birthDate" DATE,
    "gender" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "email" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "website" TEXT NOT NULL DEFAULT '',
    "github" TEXT NOT NULL DEFAULT '',
    "linkedin" TEXT NOT NULL DEFAULT '',
    "summary" TEXT NOT NULL DEFAULT '',
    "photoPath" TEXT NOT NULL DEFAULT '',
    "visibility" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResumeItem" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResumeItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Profile_resumeId_key" ON "Profile"("resumeId");
CREATE INDEX "Resume_updatedAt_idx" ON "Resume"("updatedAt");
CREATE INDEX "ResumeItem_resumeId_section_sortOrder_idx" ON "ResumeItem"("resumeId", "section", "sortOrder");

ALTER TABLE "Profile" ADD CONSTRAINT "Profile_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ResumeItem" ADD CONSTRAINT "ResumeItem_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
