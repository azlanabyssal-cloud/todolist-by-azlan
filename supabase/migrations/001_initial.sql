-- ─────────────────────────────────────────────────────────────────────────────
-- ZenDone — Initial Database Schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New query
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extensions ───────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- fast text search

-- ── Profiles (extends auth.users) ────────────────────────────────────────────
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: users read own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: users update own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── Lists ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.lists (
  id          UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title       TEXT NOT NULL,
  color       TEXT DEFAULT '#6366f1' NOT NULL,
  icon        TEXT DEFAULT 'list' NOT NULL,
  is_shared   BOOLEAN DEFAULT FALSE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT  lists_title_length CHECK (char_length(title) BETWEEN 1 AND 100)
);

CREATE INDEX idx_lists_owner ON public.lists(owner_id);

ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lists: owner full access"
  ON public.lists
  USING (auth.uid() = owner_id);

-- ── Tasks ─────────────────────────────────────────────────────────────────────
CREATE TABLE public.tasks (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id          UUID REFERENCES public.lists(id) ON DELETE CASCADE,
  parent_task_id   UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  owner_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  due_date         TIMESTAMPTZ,
  reminder_at      TIMESTAMPTZ,
  priority         SMALLINT DEFAULT 0 NOT NULL CHECK (priority IN (0, 1, 2, 3)),
  completed        BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at     TIMESTAMPTZ,
  is_recurring     BOOLEAN DEFAULT FALSE NOT NULL,
  recurrence_rule  TEXT,
  position         INTEGER DEFAULT 0 NOT NULL,
  pinned_to_today  BOOLEAN DEFAULT FALSE NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT tasks_title_length CHECK (char_length(title) BETWEEN 1 AND 500),
  CONSTRAINT tasks_desc_length  CHECK (description IS NULL OR char_length(description) <= 2000)
);

CREATE INDEX idx_tasks_owner        ON public.tasks(owner_id);
CREATE INDEX idx_tasks_list_id      ON public.tasks(list_id);
CREATE INDEX idx_tasks_due_date     ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_completed    ON public.tasks(completed);
CREATE INDEX idx_tasks_parent       ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
CREATE INDEX idx_tasks_title_trgm   ON public.tasks USING GIN (title gin_trgm_ops);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks: owner full access"
  ON public.tasks
  USING (auth.uid() = owner_id);

-- Shared list members can read tasks
CREATE POLICY "tasks: shared list members can read"
  ON public.tasks FOR SELECT
  USING (
    list_id IS NOT NULL AND
    list_id IN (
      SELECT list_id FROM public.list_shares WHERE user_id = auth.uid()
    )
  );

-- ── Tags ──────────────────────────────────────────────────────────────────────
CREATE TABLE public.tags (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name       TEXT NOT NULL,
  color      TEXT DEFAULT '#6366f1' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  CONSTRAINT tags_name_length CHECK (char_length(name) BETWEEN 1 AND 50),
  UNIQUE (owner_id, name)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags: owner full access"
  ON public.tags
  USING (auth.uid() = owner_id);

-- ── Task Tags (many-to-many) ───────────────────────────────────────────────────
CREATE TABLE public.task_tags (
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  tag_id  UUID REFERENCES public.tags(id)  ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (task_id, tag_id)
);

ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_tags: owner access via task"
  ON public.task_tags
  USING (
    task_id IN (SELECT id FROM public.tasks WHERE owner_id = auth.uid())
  );

-- ── List Shares ───────────────────────────────────────────────────────────────
CREATE TABLE public.list_shares (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id    UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('viewer', 'member', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (list_id, user_id)
);

ALTER TABLE public.list_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "list_shares: list owner manages"
  ON public.list_shares
  USING (
    list_id IN (SELECT id FROM public.lists WHERE owner_id = auth.uid())
  );

CREATE POLICY "list_shares: shared user reads own"
  ON public.list_shares FOR SELECT
  USING (auth.uid() = user_id);

-- ── updated_at trigger (applied to tasks and lists) ───────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER lists_updated_at
  BEFORE UPDATE ON public.lists
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Realtime: enable publications ─────────────────────────────────────────────
-- Run in Supabase Dashboard → Database → Replication → Realtime
-- Or uncomment to run directly (requires superuser):
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.lists;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.tags;
