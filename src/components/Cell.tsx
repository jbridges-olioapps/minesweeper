/**
 * @fileoverview Cell component for the Minesweeper game board.
 * Represents a single cell with various states: hidden, revealed, flagged, or containing a mine.
 */

import { motion } from "framer-motion";
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
    // If this is the losing cell, show bomb icon with player color or error color
    if (isLosingCell) {
      // Determine color based on who placed the mine
      let mineColor = "text-error-content"; // Default error color for pre-placed mines
      let mineTitle = "Losing mine";

      if (cell.minePlacedBy === "player1") {
        mineColor = "text-primary";
        mineTitle = "Losing mine (Player 1)";
      } else if (cell.minePlacedBy === "player2") {
        mineColor = "text-secondary";
        mineTitle = "Losing mine (Player 2)";
      }

      return (
        <FaBomb
          className={mineColor}
          title={mineTitle}
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

    // For spectators: Show ALL flags with color coding
    if (
      playerRole === "spectator" &&
      cell.flagged &&
      gameStatus !== "finished"
    ) {
      const flagColor =
        cell.flagPlacedBy === "player1"
          ? "text-primary"
          : cell.flagPlacedBy === "player2"
          ? "text-secondary"
          : "text-warning";
      const flagTitle =
        cell.flagPlacedBy === "player1"
          ? "Player 1's flag"
          : cell.flagPlacedBy === "player2"
          ? "Player 2's flag"
          : "Flag";

      return (
        <FaFlag
          className={flagColor}
          title={flagTitle}
          aria-label={flagTitle}
        />
      );
    }

    // For spectators: Show ALL mines (even unrevealed) with color coding
    if (
      playerRole === "spectator" &&
      cell.hasMine &&
      !cell.revealed &&
      gameStatus !== "finished"
    ) {
      let mineColor = "text-base-content/50"; // Dimmed for pre-placed mines
      let mineTitle = "Pre-placed mine";

      if (cell.minePlacedBy === "player1") {
        mineColor = "text-primary/70";
        mineTitle = "Player 1's mine";
      } else if (cell.minePlacedBy === "player2") {
        mineColor = "text-secondary/70";
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
    <motion.div
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
      whileHover={
        !disabled && !cell.revealed
          ? { scale: 1.05, transition: { duration: 0.2 } }
          : undefined
      }
      whileTap={
        !disabled ? { scale: 0.95, transition: { duration: 0.1 } } : undefined
      }
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {getCellContent()}
    </motion.div>
  );
}
