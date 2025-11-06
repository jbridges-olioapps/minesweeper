/**
 * Simple player identification using localStorage
 * No auth required - perfect for hackathon/demo projects
 */

const PLAYER_ID_KEY = "minesweeper_player_id";

/**
 * Generate a simple random player ID
 */
function generatePlayerId(): string {
  // Generate a random 8-character ID
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get or create a player ID for this browser/device
 * Stored in localStorage so it persists across sessions
 */
export function getPlayerId(): string {
  // Check if we already have a player ID
  let playerId = localStorage.getItem(PLAYER_ID_KEY);

  // If not, generate a new one
  if (!playerId) {
    playerId = generatePlayerId();
    localStorage.setItem(PLAYER_ID_KEY, playerId);
  }

  return playerId;
}

/**
 * Check if this player is player1 in a game
 */
export function isPlayer1(game: { player1_id: string }): boolean {
  return game.player1_id === getPlayerId();
}

/**
 * Check if this player is player2 in a game
 */
export function isPlayer2(game: { player2_id: string | null }): boolean {
  return game.player2_id === getPlayerId();
}

/**
 * Get which player this browser is ("player1" or "player2")
 */
export function getPlayerRole(game: {
  player1_id: string;
  player2_id: string | null;
}): "player1" | "player2" | "spectator" {
  const playerId = getPlayerId();
  if (game.player1_id === playerId) return "player1";
  if (game.player2_id === playerId) return "player2";
  return "spectator";
}
