-- 멀티유저 대비: userId 컬럼 추가
-- 현재는 nullable로 싱글유저 호환, 나중에 인증 추가 시 활용

ALTER TABLE spaces ADD COLUMN userId TEXT;
CREATE INDEX IF NOT EXISTS spaces_user_id_idx ON spaces(userId);

ALTER TABLE chats ADD COLUMN userId TEXT;
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(userId);

ALTER TABLE memories ADD COLUMN userId TEXT;
CREATE INDEX IF NOT EXISTS memories_user_id_idx ON memories(userId);

ALTER TABLE tasks ADD COLUMN userId TEXT;
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON tasks(userId);
