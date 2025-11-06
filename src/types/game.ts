import type { Game, GameInsert, GameUpdate } from "../lib/supabase";

// Re-export database types for convenience
export type { Game, GameInsert, GameUpdate };

/**
 * Represents a single cell on the game board
 */
export interface Cell {
  /** Whether this cell contains a mine */
  hasMine: boolean;
  /** ID of the player who placed the mine (if any) */
  minePlacedBy: "player1" | "player2" | null;
  /** Whether this cell has been revealed */
  revealed: boolean;
  /** Whether this cell has been flagged */
  flagged: boolean;
  /** Number of adjacent cells that contain mines */
  adjacentMines: number;
}

/**
 * The current phase of a player's turn
 */
export type TurnPhase = "place_mine" | "reveal_cell";

/**
 * The status of the game
 */
export type GameStatus = "waiting" | "active" | "finished";

/**
 * Which player's turn it is
 */
export type PlayerTurn = "player1" | "player2";

/**
 * Which player won the game
 */
export type Winner = "player1" | "player2" | null;

/**
 * The game board is a 2D array of cells
 */
export type Board = Cell[][];

/**
 * The complete game state stored in the database
 */
export interface GameState {
  /** The game board */
  board: Board;
  /** Number of rows in the board */
  rows: number;
  /** Number of columns in the board */
  cols: number;
  /** Total number of mines placed by each player */
  minesPlacedByPlayer1: number;
  minesPlacedByPlayer2: number;
}

/**
 * Action types for moves
 */
export type MoveAction = "place_mine" | "reveal_cell" | "toggle_flag";

/**
 * Represents a move (action) a player can make
 */
export interface Move {
  /** Row index of the cell */
  row: number;
  /** Column index of the cell */
  col: number;
  /** The action to perform */
  action: MoveAction;
  /** Which player is making the move */
  player: PlayerTurn;
}

/**
 * Configuration for creating a new game
 */
export interface GameConfig {
  /** Number of rows in the board */
  rows: number;
  /** Number of columns in the board */
  cols: number;
  /** ID of player 1 */
  player1Id: string;
  /** ID of player 2 (optional, can join later) */
  player2Id?: string;
}

/**
 * Result of checking win/loss conditions
 */
export interface GameResult {
  /** Whether the game has ended */
  isGameOver: boolean;
  /** The winner (if game is over) */
  winner: Winner;
  /** Reason for game ending */
  reason?: "mine_revealed" | "all_cells_revealed";
}

/**
 * Validation result for a move
 */
export interface MoveValidationResult {
  /** Whether the move is valid */
  isValid: boolean;
  /** Error message if invalid */
  error?: string;
}
