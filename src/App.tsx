import { useState } from "react";
import { GameBoard } from "./components/GameBoard";
import {
  generateEmptyBoard,
  placeMine,
  revealCell,
  toggleFlag,
} from "./utils/minesweeper";
import type { Board } from "./types/game";
import type { Game } from "./lib/supabase";
import "./App.css";

function App() {
  // Mock game state for demo
  const [board, setBoard] = useState<Board>(() => {
    let newBoard = generateEmptyBoard(8, 8);
    // Place some initial mines for demo
    newBoard = placeMine(newBoard, 2, 3, "player1");
    newBoard = placeMine(newBoard, 5, 6, "player2");
    return newBoard;
  });

  // Mock game object
  const mockGame: Game = {
    id: "demo-game-123",
    player1_id: "player1",
    player2_id: "player2",
    current_turn: "player1",
    turn_phase: "place_mine",
    game_state: {},
    status: "active",
    winner: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const handleCellClick = (row: number, col: number) => {
    console.log(`Cell clicked: ${row}, ${col}`);

    if (mockGame.turn_phase === "place_mine") {
      // Place a mine
      const newBoard = placeMine(
        board,
        row,
        col,
        mockGame.current_turn as "player1" | "player2"
      );
      setBoard(newBoard);
    } else if (mockGame.turn_phase === "reveal_cell") {
      // Reveal cell
      const newBoard = revealCell(board, row, col);
      setBoard(newBoard);
    }
  };

  const handleCellRightClick = (row: number, col: number) => {
    console.log(`Cell right-clicked: ${row}, ${col}`);
    const newBoard = toggleFlag(board, row, col);
    setBoard(newBoard);
  };

  return (
    <div className="min-h-screen bg-base-300">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Multiplayer Minesweeper</h1>
          <p className="text-base-content/70">
            Demo - GameBoard Component with DaisyUI & React Icons
          </p>
        </div>

        <GameBoard
          game={mockGame}
          board={board}
          onCellClick={handleCellClick}
          onCellRightClick={handleCellRightClick}
        />

        <div className="mt-8 text-center">
          <div className="card bg-base-100 shadow-md inline-block">
            <div className="card-body">
              <h3 className="card-title text-sm">Demo Controls</h3>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => {
                    let newBoard = generateEmptyBoard(8, 8);
                    newBoard = placeMine(newBoard, 2, 3, "player1");
                    newBoard = placeMine(newBoard, 5, 6, "player2");
                    setBoard(newBoard);
                  }}
                >
                  Reset Board
                </button>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => {
                    mockGame.turn_phase =
                      mockGame.turn_phase === "place_mine"
                        ? "reveal_cell"
                        : "place_mine";
                    setBoard([...board]); // Force re-render
                  }}
                >
                  Toggle Phase: {mockGame.turn_phase}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
