/**
 * @fileoverview GameBoard component - Main game interface for multiplayer minesweeper.
 * Displays the game board, status information, and handles player interactions.
 */

import type { Game } from "../lib/supabase";
import type { Board, GameStatus, TurnPhase, PlayerTurn } from "../types/game";
import { getPlayerRole, getPlayerId } from "../utils/playerId";
import { useToast } from "../hooks/useToast";
import { useChat } from "../hooks/useChat";
import { Cell } from "./Cell";
import { Toast } from "./Toast";
import { Chat } from "./Chat";

/**
 * Props for the GameBoard component
 */
interface GameBoardProps {
  /** Current game state from Supabase */
  game: Game;
  /** 2D array representing the game board */
  board: Board;
  /** Callback when a cell is left-clicked (place mine or reveal) */
  onCellClick: (row: number, col: number) => void;
  /** Callback when a cell is right-clicked (toggle flag) */
  onCellRightClick: (row: number, col: number) => void;
  /** Whether all interactions should be disabled */
  disabled?: boolean;
}

/**
 * GameBoard component - Displays the minesweeper game board with status and controls.
 *
 * Features:
 * - Renders grid of Cell components
 * - Shows current turn indicator and turn phase
 * - Displays game status (waiting, active, finished)
 * - Phase-specific instructions for players
 * - Hides opponent's mines until revealed
 * - Disables interactions when not player's turn
 * - Shows win/loss status
 *
 * The board presents different views depending on the player role to prevent cheating.
 */
export function GameBoard({
  game,
  board,
  onCellClick,
  onCellRightClick,
  disabled = false,
}: GameBoardProps) {
  const { toasts, showToast, removeToast } = useToast();
  const playerRole = getPlayerRole(game);
  const playerId = getPlayerId();
  const isMyTurn =
    playerRole !== "spectator" && game.current_turn === playerRole;
  const turnPhase = game.turn_phase as TurnPhase | null;
  const status = game.status as GameStatus;

  // Chat hook
  const { messages, loading: chatLoading, sendMessage } = useChat(game.id);

  // Get losing cell coordinates from game state
  const gameState = game.game_state as any;
  const losingCell = gameState?.losingCell as
    | { row: number; col: number }
    | undefined;

  const handleCellClick = (row: number, col: number) => {
    if (disabled || !isMyTurn || status !== "active") return;

    const cell = board[row][col];

    // During place_mine phase, don't allow clicking revealed cells
    if (turnPhase === "place_mine") {
      if (cell.revealed) {
        showToast("Can't place mine in revealed cell", "warning");
        return;
      }
      // Placing mine on existing mine is now a lose condition (handled in useRealtimeGame)
    }

    // During reveal_cell phase, don't allow revealing already revealed cells
    if (turnPhase === "reveal_cell") {
      if (cell.revealed) {
        showToast("Cell is already revealed", "warning");
        return;
      }
    }

    onCellClick(row, col);
  };

  const handleCellRightClick = (row: number, col: number) => {
    if (disabled || !isMyTurn || status !== "active") return;
    onCellRightClick(row, col);
  };

  const isCellDisabled = () => {
    return disabled || !isMyTurn || status !== "active";
  };

  const isMyMine = (row: number, col: number) => {
    const cell = board[row][col];
    return playerRole !== "spectator" && cell.minePlacedBy === playerRole;
  };

  const isLosingCell = (row: number, col: number) => {
    return losingCell?.row === row && losingCell?.col === col;
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

  const handleSendMessage = async (message: string) => {
    // Allow spectators to send messages too, but label them as spectators
    return await sendMessage(message, playerId, playerRole as PlayerTurn);
  };

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
          row.map((cell, colIndex) => (
            <Cell
              key={`${rowIndex}-${colIndex}`}
              cell={cell}
              row={rowIndex}
              col={colIndex}
              isMyTurn={isMyTurn}
              turnPhase={turnPhase}
              isMyMine={isMyMine(rowIndex, colIndex)}
              playerRole={playerRole}
              disabled={isCellDisabled()}
              isLosingCell={isLosingCell(rowIndex, colIndex)}
              gameStatus={status}
              onClick={handleCellClick}
              onRightClick={handleCellRightClick}
            />
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
                <strong>Right click:</strong> Toggle flag (unlimited per turn,
                any phase)
              </li>
            </ul>
            <p className="text-xs mt-2 italic">
              💡 Flags are private - only you can see your flags!
            </p>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />

      {/* Chat Component - Fixed to bottom right */}
      <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]">
        <Chat
          messages={messages}
          playerRole={playerRole}
          onSendMessage={handleSendMessage}
          disabled={false}
          loading={chatLoading}
          spectators={game.spectators || []}
        />
      </div>
    </div>
  );
}
