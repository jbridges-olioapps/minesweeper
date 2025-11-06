-- Create messages table for in-game chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id TEXT NOT NULL,
  player_role TEXT NOT NULL CHECK (player_role IN ('player1', 'player2')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient querying by game_id
CREATE INDEX messages_game_id_idx ON messages(game_id);

-- Create index for ordering by created_at
CREATE INDEX messages_created_at_idx ON messages(created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read messages for games they can see
CREATE POLICY "Anyone can read messages"
  ON messages FOR SELECT
  USING (true);

-- Policy: Players can insert messages for their games
CREATE POLICY "Players can insert messages"
  ON messages FOR INSERT
  WITH CHECK (true);

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

