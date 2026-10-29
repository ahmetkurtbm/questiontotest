-- QuestionToTest şeması. Yerelde `npm run db:setup`, demo modunda açılışta uygulanır.

CREATE TABLE IF NOT EXISTS users (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_user_id text NOT NULL UNIQUE,
  display_name     text NOT NULL,
  email            text,
  created_at       timestamptz NOT NULL DEFAULT NOW(),
  updated_at       timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Kullanıcıya özel görünen sıra numarası (1, 2, 3 ...)
  no            integer NOT NULL,
  question_url  text NOT NULL,
  solution_url  text,
  subject       text NOT NULL,
  difficulty    text NOT NULL CHECK (difficulty IN ('Kolay', 'Orta', 'Zor')),
  answer        char(1) NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D', 'E')),
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (owner_id, no)
);

CREATE INDEX IF NOT EXISTS questions_owner_created_idx
  ON questions (owner_id, created_at DESC);

CREATE INDEX IF NOT EXISTS questions_owner_subject_difficulty_idx
  ON questions (owner_id, subject, difficulty);

-- Soru ve çözüm görselleri. Ayrı bir dosya deposu (Blob/S3) gerektirmesin diye
-- veritabanında tutulur; /api/images/<id> adresinden sunulur.
CREATE TABLE IF NOT EXISTS images (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type  text NOT NULL,
  data          bytea NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT NOW()
);
