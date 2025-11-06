import { FaBomb, FaFlag } from "react-icons/fa";
import { MdQuestionMark } from "react-icons/md";
import type { Game } from "../lib/supabase";
import type { Board, GameStatus, TurnPhase } from "../types/game";
import { getPlayerRole } from "../utils/playerId";

interface GameBoardProps {
  game: Game;
  board: Board;
  onCellClick: (row: number, col: number) => void;
  onCellRightClick: (row: number, col: number) => void;
  disabled?: boolean;
}

export function GameBoard({
  game,
  board,
  onCellClick,
  onCellRightClick,
  disabled = false,
}: GameBoardProps) {
  const playerRole = getPlayerRole(game);
  const isMyTurn =
    playerRole !== "spectator" && game.current_turn === playerRole;
  const turnPhase = game.turn_phase as TurnPhase | null;
  const status = game.status as GameStatus;

  const handleCellClick = (row: number, col: number) => {
    if (disabled || !isMyTurn || status !== "active") return;
    onCellClick(row, col);
  };

  const handleCellRightClick = (
    e: React.MouseEvent,
    row: number,
    col: number
  ) => {
    e.preventDefault();
    if (disabled || !isMyTurn || status !== "active") return;
    onCellRightClick(row, col);
  };

  const getCellContent = (row: number, col: number) => {
    const cell = board[row][col];

    // Show flag if cell is flagged
    if (cell.flagged) {
      return <FaFlag className="text-warning" />;
    }

    // If cell is not revealed, show empty or question mark
    if (!cell.revealed) {
      return turnPhase === "place_mine" && isMyTurn ? (
        <MdQuestionMark className="text-base-content/30" />
      ) : null;
    }

    // Cell is revealed
    // Show mine if it has one (only show if revealed)
    if (cell.hasMine) {
      const isMyMine =
        playerRole !== "spectator" && cell.minePlacedBy === playerRole;
      return (
        <FaBomb
          className={isMyMine ? "text-primary" : "text-error"}
          title={isMyMine ? "Your mine" : "Opponent's mine"}
        />
      );
    }

    // Show adjacent mine count
    if (cell.adjacentMines > 0) {
      return (
        <span className={`cell-number-${cell.adjacentMines}`}>
          {cell.adjacentMines}
        </span>
      );
    }

    // Empty cell
    return null;
  };

  const getCellClassName = (row: number, col: number) => {
    const cell = board[row][col];
    const classes = ["cell"];

    if (cell.revealed) {
      classes.push("cell-revealed");
      if (cell.hasMine) {
        classes.push("cell-mine");
      }
    } else {
      classes.push("cell-hidden");
      if (cell.flagged) {
        classes.push("cell-flagged");
      }
    }

    if (disabled || !isMyTurn || status !== "active") {
      classes.push("cell-disabled");
    }

    return classes.join(" ");
  };

  const getPhaseInstruction = () => {
    if (status === "waiting") {
      return "Waiting for opponent to join...";
    }

    if (status === "finished") {
      if (game.winner === playerRole) {
        return "🎉 You won!";
      } else if (game.winner) {
        return "😢 You lost!";
      }
      return "Game over!";
    }

    if (!isMyTurn) {
      return "Waiting for opponent's move...";
    }

    if (turnPhase === "place_mine") {
      return "📍 Place your mine on the board";
    }

    if (turnPhase === "reveal_cell") {
      return "🔍 Reveal a cell";
    }

    return "Your turn";
  };

  const getTurnIndicator = () => {
    if (status !== "active") return null;

    return (
      <div className="flex items-center gap-2">
        <div
          className={`badge ${isMyTurn ? "badge-primary" : "badge-secondary"}`}
        >
          {isMyTurn ? "Your Turn" : "Opponent's Turn"}
        </div>
        {turnPhase && (
          <div className="badge badge-outline">
            {turnPhase === "place_mine" ? "Place Mine" : "Reveal Cell"}
          </div>
        )}
      </div>
    );
  };

  const cols = board[0]?.length || 0;

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      {/* Status Header */}
      <div className="card bg-base-200 shadow-xl w-full max-w-2xl">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="card-title">{getPhaseInstruction()}</h2>
              <p className="text-sm text-base-content/70 mt-1">
                {playerRole === "spectator"
                  ? "Spectating"
                  : `You are Player ${playerRole === "player1" ? "1" : "2"}`}
              </p>
            </div>
            {getTurnIndicator()}
          </div>

          {/* Game Status Pills */}
          <div className="flex gap-2 mt-2">
            <div className="badge badge-ghost">
              Game ID: {game.id.slice(0, 8)}
            </div>
            <div className="badge badge-ghost">Status: {status}</div>
          </div>
        </div>
      </div>

      {/* Game Board */}
      <div
        className="inline-grid gap-0 border-2 border-base-300 rounded-lg overflow-hidden shadow-2xl"
        style={{
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        }}
      >
        {board.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={getCellClassName(rowIndex, colIndex)}
              onClick={() => handleCellClick(rowIndex, colIndex)}
              onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
              title={`Cell ${rowIndex},${colIndex}`}
            >
              {getCellContent(rowIndex, colIndex)}
            </div>
          ))
        )}
      </div>

      {/* Instructions */}
      <div className="card bg-base-100 shadow-md w-full max-w-2xl">
        <div className="card-body py-3">
          <div className="text-sm text-base-content/70">
            <p className="font-semibold mb-1">Controls:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Left click:</strong>{" "}
                {turnPhase === "place_mine" ? "Place a mine" : "Reveal a cell"}
              </li>
              <li>
                <strong>Right click:</strong> Toggle flag
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
