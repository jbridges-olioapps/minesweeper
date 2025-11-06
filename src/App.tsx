import { useState, useEffect, useRef } from "react";
import { GameBoard } from "./components/GameBoard";
import { GameLobby } from "./components/GameLobby";
import { PlayerStatus } from "./components/PlayerStatus";
import { ThemeController } from "./components/ThemeController";
import { LossAnimation } from "./components/LossAnimation";
import { useRealtimeGame } from "./hooks/useRealtimeGame";
import type { Game } from "./lib/supabase";
import type { GameState } from "./types/game";
import "./App.css";

function App() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [showLossAnimation, setShowLossAnimation] = useState(false);
  const hasShownAnimationRef = useRef<string | null>(null);

  // Use the real-time game hook
  const { game, board, loading, error, placeMine, revealCell, toggleFlag } =
    useRealtimeGame(gameId);

  // Check if we should show the loss animation
  useEffect(() => {
    if (!game || game.status !== "finished" || !game.winner) {
      setShowLossAnimation(false);
      return;
    }

    const gameState = game.game_state as unknown as GameState | undefined;
    const losingCell = gameState?.losingCell;
    const lossReason = gameState?.lossReason;

    // Show animation if there's a losing cell (mine was revealed or placed on)
    // This covers both system-generated mines and player-placed mines
    if (losingCell && (lossReason === "revealed_mine" || lossReason === "placed_on_mine")) {
      // Create a unique key for this loss event
      const lossKey = `${game.id}-${losingCell.row}-${losingCell.col}`;
      
      // Only show if we haven't shown this specific loss animation yet
      if (hasShownAnimationRef.current !== lossKey) {
        hasShownAnimationRef.current = lossKey;
        setShowLossAnimation(true);
      }
    } else if (losingCell && game.winner) {
      // Fallback: if there's a losing cell and a winner, show animation
      // (covers cases where lossReason might not be set, including system-generated mines)
      const lossKey = `${game.id}-${losingCell.row}-${losingCell.col}`;
      
      if (hasShownAnimationRef.current !== lossKey) {
        hasShownAnimationRef.current = lossKey;
        setShowLossAnimation(true);
      }
    } else if (game.winner && board) {
      // Additional fallback: check board for revealed mines
      // Find the first revealed mine (this should be the losing cell)
      for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
          const cell = board[row][col];
          if (cell.revealed && cell.hasMine) {
            const lossKey = `${game.id}-${row}-${col}`;
            if (hasShownAnimationRef.current !== lossKey) {
              hasShownAnimationRef.current = lossKey;
              setShowLossAnimation(true);
              return;
            }
          }
        }
      }
      setShowLossAnimation(false);
    } else {
      setShowLossAnimation(false);
    }
  }, [game, board]);

  // Determine which player lost
  const losingPlayer = game?.winner
    ? game.winner === "player1"
      ? ("player2" as const)
      : ("player1" as const)
    : undefined;

  const handleGameJoined = (joinedGame: Game) => {
    setGameId(joinedGame.id);
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!game) return;

    if (game.turn_phase === "place_mine") {
      await placeMine(row, col);
    } else if (game.turn_phase === "reveal_cell") {
      await revealCell(row, col);
    }
  };

  const handleCellRightClick = async (row: number, col: number) => {
    await toggleFlag(row, col);
  };

  // Show lobby if no game
  if (!gameId || !game) {
    return <GameLobby onGameJoined={handleGameJoined} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
        <div className="alert alert-error max-w-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="stroke-current shrink-0 h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold">Error loading game</h3>
            <div className="text-sm">{error}</div>
          </div>
          <button className="btn btn-sm" onClick={() => setGameId(null)}>
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  // Show game board
  return (
    <div className="min-h-screen bg-base-300">
      {/* Loss Animation Overlay */}
      <LossAnimation
        show={showLossAnimation}
        losingPlayer={losingPlayer}
        onComplete={() => setShowLossAnimation(false)}
      />

      <div className="container mx-auto py-8 px-4">
        <div className="relative">
          <div className="absolute top-0 right-0">
            <ThemeController />
          </div>
          <div className="text-center mb-4">
            <h1 className="text-4xl font-bold mb-2">Multiplayer Minesweeper</h1>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setGameId(null)}
            >
              ← Back to Lobby
            </button>
          </div>
        </div>

        {/* Player Status */}
        <div className="max-w-2xl mx-auto mb-6">
          <PlayerStatus game={game} />
        </div>

        {/* Game Board */}
        <GameBoard
          game={game}
          board={board}
          onCellClick={handleCellClick}
          onCellRightClick={handleCellRightClick}
        />
      </div>
    </div>
  );
}

export default App;
