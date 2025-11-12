-- ================================================
-- CLASSNOTES - COMPLETE DATABASE SCHEMA
-- ================================================
-- Run this entire file in Supabase SQL Editor
-- ================================================

-- Clean up any existing tables (optional - only if rebuilding)
-- DROP TABLE IF EXISTS public.notifications CASCADE;
-- DROP TABLE IF EXISTS public.edit_history CASCADE;
-- DROP TABLE IF EXISTS public.activity_logs CASCADE;
-- DROP TABLE IF EXISTS public.note_shares CASCADE;
-- DROP TABLE IF EXISTS public.note_urls CASCADE;
-- DROP TABLE IF EXISTS public.note_images CASCADE;
-- DROP TABLE IF EXISTS public.comments CASCADE;
-- DROP TABLE IF EXISTS public.notes CASCADE;
-- DROP TABLE IF EXISTS public.subjects CASCADE;
-- DROP TABLE IF EXISTS public.class_members CASCADE;
-- DROP TABLE IF EXISTS public.classes CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- ================================================
-- 1. USERS TABLE (Links to Supabase Auth)
-- ================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ================================================
-- 2. CLASSES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_classes_invite_code ON public.classes(invite_code);
CREATE INDEX IF NOT EXISTS idx_classes_created_by ON public.classes(created_by);

-- ================================================
-- 3. CLASS MEMBERS (Who belongs to which class)
-- ================================================
CREATE TABLE IF NOT EXISTS public.class_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(class_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user ON public.class_members(user_id);

-- ================================================
-- 4. SUBJECTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  color TEXT DEFAULT 'blue',
  icon TEXT DEFAULT '📚',
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subjects_class ON public.subjects(class_id);

-- ================================================
-- 5. NOTES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notes_subject ON public.notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_author ON public.notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON public.notes(updated_at DESC);

-- ================================================
-- 6. NOTE IMAGES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.note_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_images_note ON public.note_images(note_id);

-- ================================================
-- 7. NOTE URLS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.note_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  added_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_note_urls_note ON public.note_urls(note_id);

-- ================================================
-- 8. NOTE SHARES TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.note_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with_user UUID REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with_class UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  share_type TEXT DEFAULT 'view' CHECK (share_type IN ('view', 'edit')),
  shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT check_share_target CHECK (
    (shared_with_user IS NOT NULL AND shared_with_class IS NULL) OR
    (shared_with_user IS NULL AND shared_with_class IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_note_shares_note ON public.note_shares(note_id);
CREATE INDEX IF NOT EXISTS idx_note_shares_user ON public.note_shares(shared_with_user);
CREATE INDEX IF NOT EXISTS idx_note_shares_class ON public.note_shares(shared_with_class);

-- ================================================
-- 9. COMMENTS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_note ON public.comments(note_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);

-- ================================================
-- 10. ACTIVITY LOGS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- ================================================
-- 11. EDIT HISTORY TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.edit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  edited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content_before TEXT,
  content_after TEXT,
  edited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_edit_history_note ON public.edit_history(note_id);
CREATE INDEX IF NOT EXISTS idx_edit_history_edited_at ON public.edit_history(edited_at DESC);

-- ================================================
-- 12. NOTIFICATIONS TABLE
-- ================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);

-- ================================================
-- TRIGGERS FOR AUTO-UPDATE timestamps
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_updated_at ON public.users;
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS classes_updated_at ON public.classes;
CREATE TRIGGER classes_updated_at BEFORE UPDATE ON public.classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS subjects_updated_at ON public.subjects;
CREATE TRIGGER subjects_updated_at BEFORE UPDATE ON public.subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS notes_updated_at ON public.notes;
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS comments_updated_at ON public.comments;
CREATE TRIGGER comments_updated_at BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- ROW LEVEL SECURITY (RLS) - Optional for now
-- ================================================
-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies (Allow all for now - tighten later)
CREATE POLICY "Allow all for authenticated users" ON public.users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.classes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.class_members
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.subjects
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.notes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON public.comments
  FOR ALL USING (auth.role() = 'authenticated');

-- ================================================
-- VERIFICATION
-- ================================================
SELECT 
  tablename,
  CASE WHEN tablename IN (
    'users', 'classes', 'class_members', 'subjects', 'notes',
    'comments', 'note_images', 'note_urls', 'note_shares',
    'activity_logs', 'edit_history', 'notifications'
  ) THEN '✅' ELSE '❌' END as status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
