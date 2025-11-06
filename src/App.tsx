import { useState, useEffect } from "react";
import { GameBoard } from "./components/GameBoard";
import { GameLobby } from "./components/GameLobby";
import { PlayerStatus } from "./components/PlayerStatus";
import {
  generateEmptyBoard,
  placeMine,
  revealCell,
  toggleFlag,
} from "./utils/minesweeper";
import type { Board, GameState } from "./types/game";
import type { Game } from "./lib/supabase";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [board, setBoard] = useState<Board>(() => generateEmptyBoard(8, 8));

  // Subscribe to game updates
  useEffect(() => {
    if (!currentGame) return;

    const channel = supabase
      .channel(`game:${currentGame.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${currentGame.id}`,
        },
        (payload) => {
          console.log("Game updated:", payload);
          const updatedGame = payload.new as Game;
          setCurrentGame(updatedGame);

          // Update board from game state
          if (updatedGame.game_state) {
            const gameState = updatedGame.game_state as unknown as GameState;
            if (gameState.board) {
              setBoard(gameState.board);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGame?.id]);

  // Load initial board state when game is joined
  useEffect(() => {
    if (currentGame?.game_state) {
      const gameState = currentGame.game_state as unknown as GameState;
      if (gameState.board) {
        setBoard(gameState.board);
      }
    }
  }, [currentGame]);

  const handleGameJoined = (game: Game) => {
    setCurrentGame(game);
  };

  const handleCellClick = async (row: number, col: number) => {
    if (!currentGame) return;

    let newBoard = board;

    if (currentGame.turn_phase === "place_mine") {
      // Place a mine
      newBoard = placeMine(
        board,
        row,
        col,
        currentGame.current_turn as "player1" | "player2"
      );

      // Update game to reveal phase
      const { error } = await supabase
        .from("games")
        .update({
          game_state: {
            board: newBoard,
            rows: 8,
            cols: 8,
            minesPlacedByPlayer1: 0, // TODO: calculate actual count
            minesPlacedByPlayer2: 0,
          } as any,
          turn_phase: "reveal_cell",
        })
        .eq("id", currentGame.id);

      if (error) {
        console.error("Error updating game:", error);
        return;
      }
    } else if (currentGame.turn_phase === "reveal_cell") {
      // Reveal cell
      newBoard = revealCell(board, row, col);

      // Switch turn to next player
      const nextTurn =
        currentGame.current_turn === "player1" ? "player2" : "player1";

      const { error } = await supabase
        .from("games")
        .update({
          game_state: {
            board: newBoard,
            rows: 8,
            cols: 8,
            minesPlacedByPlayer1: 0, // TODO: calculate actual count
            minesPlacedByPlayer2: 0,
          } as any,
          current_turn: nextTurn,
          turn_phase: "place_mine",
        })
        .eq("id", currentGame.id);

      if (error) {
        console.error("Error updating game:", error);
        return;
      }
    }

    setBoard(newBoard);
  };

  const handleCellRightClick = async (row: number, col: number) => {
    if (!currentGame) return;

    const newBoard = toggleFlag(board, row, col);
    setBoard(newBoard);

    // Update game state
    const { error } = await supabase
      .from("games")
      .update({
        game_state: {
          board: newBoard,
          rows: 8,
          cols: 8,
          minesPlacedByPlayer1: 0, // TODO: calculate actual count
          minesPlacedByPlayer2: 0,
        } as any,
      })
      .eq("id", currentGame.id);

    if (error) {
      console.error("Error updating game:", error);
    }
  };

  // Show lobby if no game
  if (!currentGame) {
    return <GameLobby onGameJoined={handleGameJoined} />;
  }

  // Show game board
  return (
    <div className="min-h-screen bg-base-300">
      <div className="container mx-auto py-8 px-4">
        <div className="text-center mb-4">
          <h1 className="text-4xl font-bold mb-2">Multiplayer Minesweeper</h1>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setCurrentGame(null)}
          >
            ← Back to Lobby
          </button>
        </div>

        {/* Player Status */}
        <div className="max-w-2xl mx-auto mb-6">
          <PlayerStatus game={currentGame} />
        </div>

        {/* Game Board */}
        <GameBoard
          game={currentGame}
          board={board}
          onCellClick={handleCellClick}
          onCellRightClick={handleCellRightClick}
        />
      </div>
    </div>
  );
}

export default App;
