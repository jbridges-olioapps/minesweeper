-- Create games table
CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id TEXT NOT NULL,
  player2_id TEXT,
  current_turn TEXT CHECK (current_turn IN ('player1', 'player2')),
  turn_phase TEXT CHECK (turn_phase IN ('place_mine', 'reveal_cell')),
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  winner TEXT CHECK (winner IN ('player1', 'player2')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Realtime on games table
ALTER PUBLICATION supabase_realtime ADD TABLE games;

-- Create indexes for performance
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_player1_id ON games(player1_id);
CREATE INDEX idx_games_player2_id ON games(player2_id);
CREATE INDEX idx_games_created_at ON games(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at 
  BEFORE UPDATE ON games 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE games IS 'Multiplayer minesweeper games with competitive mine placement';
COMMENT ON COLUMN games.turn_phase IS 'Current phase of turn: place_mine or reveal_cell';
COMMENT ON COLUMN games.game_state IS 'Board state including revealed cells, flags, and mine positions with player attribution';
COMMENT ON COLUMN games.winner IS 'Winner of the game when status is finished';

