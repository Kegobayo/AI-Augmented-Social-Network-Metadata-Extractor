CREATE TABLE public.instagram_connections (
  user_id uuid PRIMARY KEY,
  ig_user_id text,
  username text,
  followers integer,
  access_token text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT (user_id, ig_user_id, username, followers, updated_at) ON public.instagram_connections TO authenticated;
GRANT DELETE ON public.instagram_connections TO authenticated;
GRANT ALL ON public.instagram_connections TO service_role;
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own connection read" ON public.instagram_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own connection delete" ON public.instagram_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.saved_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'instagram',
  external_id text NOT NULL,
  author text NOT NULL,
  followers integer NOT NULL DEFAULT 0,
  media_type text NOT NULL DEFAULT 'image',
  caption text NOT NULL DEFAULT '',
  hashtags text[] NOT NULL DEFAULT '{}',
  mentions text[] NOT NULL DEFAULT '{}',
  permalink text,
  media_url text,
  posted_at timestamptz NOT NULL DEFAULT now(),
  likes integer NOT NULL DEFAULT 0,
  comments integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  shares integer NOT NULL DEFAULT 0,
  reach integer,
  views integer,
  comments_sample text[] NOT NULL DEFAULT '{}',
  topic text,
  sentiment real,
  emotion text,
  entities jsonb NOT NULL DEFAULT '[]'::jsonb,
  ai_insight text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, external_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_posts TO authenticated;
GRANT ALL ON public.saved_posts TO service_role;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own posts" ON public.saved_posts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX saved_posts_user_idx ON public.saved_posts (user_id, posted_at DESC);