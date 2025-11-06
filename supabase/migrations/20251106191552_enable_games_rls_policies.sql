-- Enable Row Level Security on games table
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Allow all users to read all games (needed for joining and spectating)
CREATE POLICY "Allow public read access to games"
ON games FOR SELECT
TO public
USING (true);

-- Allow all users to insert games (create new games)
CREATE POLICY "Allow public insert access to games"
ON games FOR INSERT
TO public
WITH CHECK (true);

-- Allow all users to update games (join games, make moves)
CREATE POLICY "Allow public update access to games"
ON games FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- Note: For a production app, you would want more restrictive policies like:
-- - Only allow players to update games they're part of
-- - Only allow updates to specific columns based on role
-- - Prevent modifying finished games
-- But for a hackathon with anonymous players, permissive policies are fine.

