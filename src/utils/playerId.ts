/**
 * @fileoverview Player identification utilities using localStorage.
 * Provides simple, auth-free player ID management for hackathon/demo projects.
 */

/**
 * localStorage key for storing the player ID
 */
const PLAYER_ID_KEY = "minesweeper_player_id";

/**
 * Generate a simple random 8-character player ID.
 * Uses base-36 encoding for alphanumeric IDs.
 *
 * @returns A random 8-character string
 */
function generatePlayerId(): string {
  // Generate a random 8-character ID
  return Math.random().toString(36).substring(2, 10);
}

/**
 * Get or create a player ID for this browser/device.
 * Stored in localStorage so it persists across sessions.
 *
 * @returns The player ID (either existing or newly generated)
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
 * Check if the current browser/device is player1 in a game.
 *
 * @param game - Game object containing player1_id
 * @returns True if the current player ID matches player1_id
 */
export function isPlayer1(game: { player1_id: string }): boolean {
  return game.player1_id === getPlayerId();
}

/**
 * Check if the current browser/device is player2 in a game.
 *
 * @param game - Game object containing player2_id
 * @returns True if the current player ID matches player2_id
 */
export function isPlayer2(game: { player2_id: string | null }): boolean {
  return game.player2_id === getPlayerId();
}

/**
 * Get which player role this browser has in a game.
 * Returns "spectator" if the browser is neither player1 nor player2.
 *
 * @param game - Game object containing player IDs and spectators
 * @returns "player1", "player2", or "spectator"
 */
export function getPlayerRole(game: {
  player1_id: string;
  player2_id: string | null;
  spectators?: string[];
}): "player1" | "player2" | "spectator" {
  const playerId = getPlayerId();
  if (game.player1_id === playerId) return "player1";
  if (game.player2_id === playerId) return "player2";
  return "spectator";
}

/**
 * Check if the current player is a spectator in a game.
 * A player is a spectator if they are in the spectators array.
 *
 * @param game - Game object containing spectators array
 * @returns True if the current player is in the spectators array
 */
export function isSpectator(game: {
  player1_id: string;
  player2_id: string | null;
  spectators?: string[];
}): boolean {
  const playerId = getPlayerId();
  return (
    game.spectators?.includes(playerId) === true &&
    game.player1_id !== playerId &&
    game.player2_id !== playerId
  );
}
