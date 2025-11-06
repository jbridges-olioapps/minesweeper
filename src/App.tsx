import { useState } from "react";
import { GameBoard } from "./components/GameBoard";
import { GameLobby } from "./components/GameLobby";
import { PlayerStatus } from "./components/PlayerStatus";
import { ThemeController } from "./components/ThemeController";
import { useRealtimeGame } from "./hooks/useRealtimeGame";
import type { Game } from "./lib/supabase";
import "./App.css";

function App() {
  const [gameId, setGameId] = useState<string | null>(null);

  // Use the real-time game hook
  const { game, board, loading, error, placeMine, revealCell, toggleFlag } =
    useRealtimeGame(gameId);

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
