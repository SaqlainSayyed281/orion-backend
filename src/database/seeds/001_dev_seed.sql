-- ORION Dev Seed: Test user for local/dev environment
-- Password: 'orion_test_123' (bcrypt hash, cost=10)

INSERT INTO users (username, email, password_hash)
VALUES (
  'orion_dev',
  'dev@orion.local',
  '$2b$10$abcdefghijklmnopqrstuuVjXkL5pLq3RfD1EtE9bFTslQczWj9Gy'
)
ON CONFLICT (email) DO NOTHING;

-- Seed a few test messages
INSERT INTO messages (user_id, role, content, message_type, tokens_used, processing_time_ms)
VALUES
  (1, 'user', 'Hello ORION', 'text', NULL, NULL),
  (1, 'assistant', 'Hey! I am ORION. How can I help you today?', 'text', 42, 320);
