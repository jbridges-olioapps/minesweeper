/**
 * @fileoverview Cell component for the Minesweeper game board.
 * Represents a single cell with various states: hidden, revealed, flagged, or containing a mine.
 */

import { FaBomb, FaFlag } from "react-icons/fa";
import { MdQuestionMark } from "react-icons/md";
import type { Cell as CellType } from "../types/game";

/**
 * Props for the Cell component
 */
interface CellProps {
  /** The cell data including mine status, revealed state, and adjacent mine count */
  cell: CellType;
  /** Row index of the cell on the board */
  row: number;
  /** Column index of the cell on the board */
  col: number;
  /** Whether it's currently the player's turn */
  isMyTurn: boolean;
  /** Current turn phase (place_mine or reveal_cell) */
  turnPhase: "place_mine" | "reveal_cell" | null;
  /** Whether the mine in this cell belongs to the current player */
  isMyMine: boolean;
  /** The current player's role (player1, player2, or spectator) */
  playerRole: "player1" | "player2" | "spectator";
  /** Whether cell interactions are disabled */
  disabled: boolean;
  /** Whether this cell caused the game to end (losing cell) */
  isLosingCell: boolean;
  /** Current game status */
  gameStatus: "waiting" | "active" | "finished";
  /** Callback when cell is left-clicked */
  onClick: (row: number, col: number) => void;
  /** Callback when cell is right-clicked (for flagging) */
  onRightClick: (row: number, col: number) => void;
}

/**
 * Cell component - Renders a single minesweeper cell with appropriate styling and content.
 *
 * Displays:
 * - Flag icon when flagged
 * - Mine icon when revealed and contains a mine
 * - Number showing adjacent mine count when revealed
 * - Empty state when hidden
 *
 * Supports both left-click (reveal/place mine) and right-click (flag) interactions.
 * Includes keyboard accessibility with Enter/Space key support.
 */
export function Cell({
  cell,
  row,
  col,
  isMyTurn,
  turnPhase,
  isMyMine,
  playerRole,
  disabled,
  isLosingCell,
  gameStatus,
  onClick,
  onRightClick,
}: CellProps) {
  const handleClick = () => {
    if (disabled) return;
    onClick(row, col);
  };

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    onRightClick(row, col);
  };

  const getCellContent = () => {
    // If this is the losing cell, always show bomb icon with error color
    if (isLosingCell) {
      return (
        <FaBomb
          className="text-error-content"
          title="Losing mine"
          aria-label="This mine caused the game to end"
        />
      );
    }

    // If game is finished, show all mines with appropriate colors
    if (gameStatus === "finished" && cell.hasMine && !isLosingCell) {
      // Determine mine color based on who placed it
      let mineColor = "text-base-content"; // Default black for pre-placed mines
      let mineTitle = "Pre-placed mine";

      if (cell.minePlacedBy === "player1") {
        mineColor = "text-primary";
        mineTitle = "Player 1's mine";
      } else if (cell.minePlacedBy === "player2") {
        mineColor = "text-secondary";
        mineTitle = "Player 2's mine";
      }

      return (
        <FaBomb
          className={mineColor}
          title={mineTitle}
          aria-label={mineTitle}
        />
      );
    }

    // Show flag if cell is flagged AND it belongs to the current player (only during active game)
    if (
      gameStatus !== "finished" &&
      cell.flagged &&
      cell.flagPlacedBy === playerRole
    ) {
      return (
        <FaFlag
          className="text-warning"
          title="Flagged"
          aria-label="Flagged cell"
        />
      );
    }

    // If cell is not revealed, show empty or question mark
    if (!cell.revealed) {
      return turnPhase === "place_mine" && isMyTurn ? (
        <MdQuestionMark
          className="text-base-content/30"
          aria-label="Hidden cell"
        />
      ) : null;
    }

    // Cell is revealed
    // Show mine if it has one
    if (cell.hasMine) {
      return (
        <FaBomb
          className={isMyMine ? "text-primary" : "text-error"}
          title={isMyMine ? "Your mine" : "Opponent's mine"}
          aria-label={isMyMine ? "Your mine" : "Opponent's mine"}
        />
      );
    }

    // Show adjacent mine count
    if (cell.adjacentMines > 0) {
      return (
        <span
          className={`cell-number-${cell.adjacentMines}`}
          aria-label={`${cell.adjacentMines} adjacent mines`}
        >
          {cell.adjacentMines}
        </span>
      );
    }

    // Empty cell
    return null;
  };

  const getCellClassName = () => {
    const classes = ["cell"];

    // Losing cell gets special styling (overrides other states)
    if (isLosingCell) {
      classes.push("cell-losing");
      return classes.join(" ");
    }

    // Revealed state
    if (cell.revealed) {
      classes.push("cell-revealed");
      if (cell.hasMine) {
        classes.push("cell-mine");
      }
    } else {
      // Hidden state
      classes.push("cell-hidden");
      // Only show flag styling if the flag belongs to the current player
      if (cell.flagged && cell.flagPlacedBy === playerRole) {
        classes.push("cell-flagged");
      }
    }

    // Disabled state
    if (disabled) {
      classes.push("cell-disabled");
    }

    return classes.join(" ");
  };

  return (
    <div
      className={getCellClassName()}
      onClick={handleClick}
      onContextMenu={handleRightClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={`Cell at row ${row}, column ${col}`}
      aria-disabled={disabled}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      {getCellContent()}
    </div>
  );
}
