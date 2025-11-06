-- Create a view that calculates wins per player
CREATE OR REPLACE VIEW leaderboard AS
WITH player_wins AS (
  -- Count wins for player1
  SELECT 
    player1_id AS player_id,
    COUNT(*) AS wins
  FROM games
  WHERE status = 'finished' AND winner = 'player1'
  GROUP BY player1_id
  
  UNION ALL
  
  -- Count wins for player2
  SELECT 
    player2_id AS player_id,
    COUNT(*) AS wins
  FROM games
  WHERE status = 'finished' AND winner = 'player2' AND player2_id IS NOT NULL
  GROUP BY player2_id
)
SELECT 
  player_id,
  SUM(wins) AS total_wins
FROM player_wins
GROUP BY player_id
ORDER BY total_wins DESC, player_id ASC;

-- Create an index on games to speed up leaderboard queries
CREATE INDEX IF NOT EXISTS games_status_winner_idx ON games(status, winner) WHERE status = 'finished';

