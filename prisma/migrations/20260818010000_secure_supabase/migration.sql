-- The app accesses these tables only through its server-side Prisma connection.
-- Keep Supabase Data API roles from reading or mutating private resume data.
ALTER TABLE "Resume" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResumeItem" ENABLE ROW LEVEL SECURITY;
