-- ═══════════════════════════════════════════════════════════════════
-- 001_init.sql — full schema for Skazka Vmeste
-- Safe to run multiple times (IF NOT EXISTS / OR REPLACE).
-- ═══════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────
-- USERS  (mirrors auth.users — id = auth.uid())
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT        UNIQUE NOT NULL,
  name        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'users_self'
  ) THEN
    CREATE POLICY users_self ON public.users
      USING (id = auth.uid())
      WITH CHECK (id = auth.uid());
  END IF;
END $$;

-- ───────────────────────────────────────
-- CHILDREN
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.children (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  age         INTEGER     NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS children_user_id_idx ON public.children(user_id);

ALTER TABLE public.children ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'children' AND policyname = 'children_owner'
  ) THEN
    CREATE POLICY children_owner ON public.children
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

-- ───────────────────────────────────────
-- CHARACTERS
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.characters (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name            TEXT        NOT NULL,
  description     TEXT        NOT NULL,
  portrait_url    TEXT,
  art_style       TEXT,
  companion_ids   UUID[]      NOT NULL DEFAULT '{}',
  stories_count   INTEGER     NOT NULL DEFAULT 0,
  total_choices   JSONB       NOT NULL DEFAULT '{}',
  story_arc       TEXT[]      NOT NULL DEFAULT '{}',
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS characters_child_id_idx ON public.characters(child_id);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'characters' AND policyname = 'characters_owner'
  ) THEN
    CREATE POLICY characters_owner ON public.characters
      USING (
        child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
      )
      WITH CHECK (
        child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ───────────────────────────────────────
-- BOOKS
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.books (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         UUID        NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  character_id     UUID        REFERENCES public.characters(id) ON DELETE SET NULL,
  title            TEXT,
  premise          TEXT,
  art_style        TEXT,
  lang             TEXT,
  ending_type      TEXT        CHECK (ending_type IN ('good', 'mixed', 'sad')),
  duration_seconds INTEGER,
  page_count       INTEGER     NOT NULL DEFAULT 0,
  cover_image_url  TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS books_child_id_idx ON public.books(child_id);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'books_owner'
  ) THEN
    CREATE POLICY books_owner ON public.books
      USING (
        child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
      )
      WITH CHECK (
        child_id IN (SELECT id FROM public.children WHERE user_id = auth.uid())
      );
  END IF;
END $$;

-- ───────────────────────────────────────
-- BOOK_PAGES
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_pages (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id        UUID        NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  page_number    INTEGER     NOT NULL,
  title          TEXT,
  text           TEXT,
  tts_text       TEXT,
  scene          TEXT,
  scene_summary  TEXT,
  action_summary TEXT,
  mood           TEXT,
  image_url      TEXT,
  sfx            TEXT,
  choice_label   TEXT,
  choice_value   TEXT,
  is_end         BOOLEAN     NOT NULL DEFAULT FALSE,
  UNIQUE (book_id, page_number)
);

ALTER TABLE public.book_pages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'book_pages' AND policyname = 'book_pages_owner'
  ) THEN
    CREATE POLICY book_pages_owner ON public.book_pages
      USING (
        book_id IN (
          SELECT b.id FROM public.books b
          JOIN public.children c ON c.id = b.child_id
          WHERE c.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ───────────────────────────────────────
-- BOOK_VALUES
-- ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.book_values (
  id        UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id   UUID    NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  value_key TEXT    NOT NULL,
  count     INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE public.book_values ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'book_values' AND policyname = 'book_values_owner'
  ) THEN
    CREATE POLICY book_values_owner ON public.book_values
      USING (
        book_id IN (
          SELECT b.id FROM public.books b
          JOIN public.children c ON c.id = b.child_id
          WHERE c.user_id = auth.uid()
        )
      );
  END IF;
END $$;
