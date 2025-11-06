import { FaBomb, FaFlag } from "react-icons/fa";
import { MdQuestionMark } from "react-icons/md";
import type { Cell as CellType } from "../types/game";

interface CellProps {
  cell: CellType;
  row: number;
  col: number;
  isMyTurn: boolean;
  turnPhase: "place_mine" | "reveal_cell" | null;
  isMyMine: boolean;
  disabled: boolean;
  onClick: (row: number, col: number) => void;
  onRightClick: (row: number, col: number) => void;
}

export function Cell({
  cell,
  row,
  col,
  isMyTurn,
  turnPhase,
  isMyMine,
  disabled,
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
    // Show flag if cell is flagged
    if (cell.flagged) {
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

    // Revealed state
    if (cell.revealed) {
      classes.push("cell-revealed");
      if (cell.hasMine) {
        classes.push("cell-mine");
      }
    } else {
      // Hidden state
      classes.push("cell-hidden");
      if (cell.flagged) {
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
