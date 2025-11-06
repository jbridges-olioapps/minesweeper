-- Add spectators column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS spectators TEXT[] DEFAULT '{}';

-- Create index for efficient spectator queries
CREATE INDEX IF NOT EXISTS games_spectators_idx ON games USING GIN (spectators);

