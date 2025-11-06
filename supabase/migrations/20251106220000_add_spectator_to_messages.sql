-- Drop the old check constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_player_role_check;

-- Add new check constraint that includes 'spectator'
ALTER TABLE messages ADD CONSTRAINT messages_player_role_check 
  CHECK (player_role IN ('player1', 'player2', 'spectator'));

