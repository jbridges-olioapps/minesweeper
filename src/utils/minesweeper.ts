import type { Board, Cell, PlayerTurn, GameResult } from "../types/game";

/**
 * Generate an empty board without any mines
 */
export function generateEmptyBoard(rows: number, cols: number): Board {
  const board: Board = [];

  for (let row = 0; row < rows; row++) {
    board[row] = [];
    for (let col = 0; col < cols; col++) {
      board[row][col] = {
        hasMine: false,
        minePlacedBy: null,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
      };
    }
  }

  return board;
}

/**
 * Place a mine on the board with player attribution
 */
export function placeMine(
  board: Board,
  row: number,
  col: number,
  playerId: PlayerTurn
): Board {
  // Create a deep copy of the board
  const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));

  // Place the mine
  newBoard[row][col].hasMine = true;
  newBoard[row][col].minePlacedBy = playerId;

  // Recalculate adjacent mine counts for all cells
  return recalculateAdjacentMines(newBoard);
}

/**
 * Recalculate adjacent mine counts for all cells
 */
function recalculateAdjacentMines(board: Board): Board {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      board[row][col].adjacentMines = countAdjacentMines(board, row, col);
    }
  }

  return board;
}

/**
 * Count mines in adjacent cells (including diagonals)
 */
export function countAdjacentMines(
  board: Board,
  row: number,
  col: number
): number {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  let count = 0;

  // Check all 8 adjacent cells
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      // Skip the center cell
      if (dr === 0 && dc === 0) continue;

      const newRow = row + dr;
      const newCol = col + dc;

      // Check bounds
      if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
        if (board[newRow][newCol].hasMine) {
          count++;
        }
      }
    }
  }

  return count;
}

/**
 * Reveal a cell and cascade reveal adjacent cells if no mines are nearby
 */
export function revealCell(board: Board, row: number, col: number): Board {
  // Create a deep copy of the board
  const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));

  // Use flood fill to reveal cells
  const toReveal: Array<[number, number]> = [[row, col]];
  const visited = new Set<string>();

  while (toReveal.length > 0) {
    const [currentRow, currentCol] = toReveal.shift()!;
    const key = `${currentRow},${currentCol}`;

    // Skip if already visited
    if (visited.has(key)) continue;
    visited.add(key);

    const cell = newBoard[currentRow][currentCol];

    // Skip if already revealed or flagged
    if (cell.revealed || cell.flagged) continue;

    // Reveal the cell
    cell.revealed = true;

    // If this cell has no adjacent mines and no mine, cascade to neighbors
    if (cell.adjacentMines === 0 && !cell.hasMine) {
      const rows = newBoard.length;
      const cols = newBoard[0]?.length || 0;

      // Add all adjacent cells to the queue
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;

          const newRow = currentRow + dr;
          const newCol = currentCol + dc;

          if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {
            toReveal.push([newRow, newCol]);
          }
        }
      }
    }
  }

  return newBoard;
}

/**
 * Toggle flag on a cell
 */
export function toggleFlag(board: Board, row: number, col: number): Board {
  // Create a deep copy of the board
  const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));

  // Don't allow flagging revealed cells
  if (!newBoard[row][col].revealed) {
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
  }

  return newBoard;
}

/**
 * Validate mine placement
 */
export function isValidMinePlacement(
  board: Board,
  row: number,
  col: number
): { isValid: boolean; error?: string } {
  // Check bounds
  if (row < 0 || row >= board.length) {
    return { isValid: false, error: "Row out of bounds" };
  }
  if (col < 0 || col >= (board[0]?.length || 0)) {
    return { isValid: false, error: "Column out of bounds" };
  }

  const cell = board[row][col];

  // Can't place mine on revealed cell
  if (cell.revealed) {
    return { isValid: false, error: "Cannot place mine on revealed cell" };
  }

  // Can't place mine where one already exists
  if (cell.hasMine) {
    return { isValid: false, error: "Cell already has a mine" };
  }

  return { isValid: true };
}

/**
 * Check if a mine was revealed (player loses)
 */
export function checkLoseCondition(
  board: Board,
  row: number,
  col: number
): {
  hitMine: boolean;
  minePlacedBy: PlayerTurn | null;
} {
  const cell = board[row][col];

  if (cell.revealed && cell.hasMine) {
    return {
      hitMine: true,
      minePlacedBy: cell.minePlacedBy,
    };
  }

  return {
    hitMine: false,
    minePlacedBy: null,
  };
}

/**
 * Check win condition - if opponent hit a mine, revealing player wins
 */
export function checkWinCondition(
  board: Board,
  revealingPlayer: PlayerTurn
): GameResult {
  // Check all revealed cells for mines
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];

      // If a revealed cell has a mine, the player who placed it wins
      if (cell.revealed && cell.hasMine && cell.minePlacedBy) {
        // The player who placed the mine wins
        // The player who revealed it loses
        return {
          isGameOver: true,
          winner: cell.minePlacedBy,
          reason: "mine_revealed",
        };
      }
    }
  }

  // Check if all non-mine cells are revealed (unlikely but possible)
  let allSafeCellsRevealed = true;
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const cell = board[row][col];
      if (!cell.hasMine && !cell.revealed) {
        allSafeCellsRevealed = false;
        break;
      }
    }
    if (!allSafeCellsRevealed) break;
  }

  if (allSafeCellsRevealed) {
    // This is a draw or we need to determine winner by some other means
    // For now, return no winner
    return {
      isGameOver: true,
      winner: null,
      reason: "all_cells_revealed",
    };
  }

  // Game continues
  return {
    isGameOver: false,
    winner: null,
  };
}

/**
 * Check if coordinates are within board bounds
 */
export function isValidCoordinate(
  board: Board,
  row: number,
  col: number
): boolean {
  return (
    row >= 0 && row < board.length && col >= 0 && col < (board[0]?.length || 0)
  );
}

/**
 * Get board dimensions
 */
export function getBoardDimensions(board: Board): {
  rows: number;
  cols: number;
} {
  return {
    rows: board.length,
    cols: board[0]?.length || 0,
  };
}

/**
 * Count total mines on the board
 */
export function countTotalMines(board: Board): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.hasMine) count++;
    }
  }
  return count;
}

/**
 * Count mines placed by a specific player
 */
export function countMinesByPlayer(board: Board, player: PlayerTurn): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell.hasMine && cell.minePlacedBy === player) count++;
    }
  }
  return count;
}
