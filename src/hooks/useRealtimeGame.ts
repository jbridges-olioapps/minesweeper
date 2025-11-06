/**
 * @fileoverview Real-time game state management hook.
 * Handles Supabase subscriptions, game state updates, and turn logic.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Game } from "../lib/supabase";
import type { Board, GameState, PlayerTurn } from "../types/game";
import {
  placeMine as placeMineUtil,
  revealCell as revealCellUtil,
  toggleFlag as toggleFlagUtil,
  checkWinCondition,
  checkLoseCondition,
  countMinesByPlayer,
  isValidMinePlacement,
} from "../utils/minesweeper";
import { getPlayerRole, getPlayerId } from "../utils/playerId";

/**
 * Hook for managing real-time game state with Supabase.
 *
 * Features:
 * - Fetches initial game state
 * - Subscribes to real-time updates
 * - Provides placeMine and revealCell functions
 * - Handles turn phase transitions automatically
 * - Evaluates win/loss conditions
 * - Cleans up subscriptions on unmount
 *
 * @param gameId - The ID of the game to manage
 * @returns Game state and action functions
 */
export function useRealtimeGame(gameId: string | null) {
  const [game, setGame] = useState<Game | null>(null);
  const [board, setBoard] = useState<Board>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch the initial game state from Supabase
   */
  const fetchGame = useCallback(async () => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("games")
        .select()
        .eq("id", gameId)
        .single();

      if (fetchError) throw fetchError;

      if (data) {
        setGame(data);

        // Extract board from game_state
        const gameState = data.game_state as unknown as GameState;
        if (gameState?.board) {
          setBoard(gameState.board);
        }
      }
    } catch (err) {
      console.error("Error fetching game:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch game");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  /**
   * Subscribe to real-time game updates
   */
  useEffect(() => {
    if (!gameId) return;

    fetchGame();

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "games",
          filter: `id=eq.${gameId}`,
        },
        (payload) => {
          console.log("Game updated:", payload);
          const updatedGame = payload.new as Game;
          setGame(updatedGame);

          // Update board from game state
          const gameState = updatedGame.game_state as unknown as GameState;
          if (gameState?.board) {
            setBoard(gameState.board);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchGame]);

  /**
   * Place a mine on the board
   */
  const placeMine = useCallback(
    async (row: number, col: number) => {
      if (!game || !board) {
        console.error("No game or board available");
        return;
      }

      const playerRole = getPlayerRole(game);

      // Validate it's player's turn and correct phase
      if (playerRole === "spectator") {
        console.error("Spectators cannot place mines");
        return;
      }

      if (game.current_turn !== playerRole) {
        console.error("Not your turn");
        return;
      }

      if (game.turn_phase !== "place_mine") {
        console.error("Not in place_mine phase");
        return;
      }

      // Check if cell already has a mine - this is a lose condition!
      const cell = board[row][col];
      if (cell.hasMine) {
        console.log("Player tried to place mine on existing mine - they lose!");

        // Opponent wins
        const opponent: PlayerTurn =
          playerRole === "player1" ? "player2" : "player1";

        try {
          const { error: updateError } = await supabase
            .from("games")
            .update({
              status: "finished",
              winner: opponent,
              game_state: {
                board,
                rows: board.length,
                cols: board[0]?.length || 0,
                minesPlacedByPlayer1: countMinesByPlayer(board, "player1"),
                minesPlacedByPlayer2: countMinesByPlayer(board, "player2"),
                losingCell: { row, col },
                lossReason: "placed_on_mine",
              } as any,
            })
            .eq("id", game.id);

          if (updateError) throw updateError;

          console.log(
            `Game over! ${opponent} wins because ${playerRole} placed mine on existing mine`
          );
        } catch (err) {
          console.error("Error ending game:", err);
          setError(err instanceof Error ? err.message : "Failed to end game");
        }
        return;
      }

      // Validate mine placement (checks revealed cells and bounds)
      const validation = isValidMinePlacement(board, row, col);
      if (!validation.isValid) {
        console.error("Invalid mine placement:", validation.error);
        setError(validation.error || "Cannot place mine here");
        return;
      }

      try {
        // Place mine on board
        const newBoard = placeMineUtil(
          board,
          row,
          col,
          playerRole as PlayerTurn
        );

        // Update game state and transition to reveal phase
        const { error: updateError } = await supabase
          .from("games")
          .update({
            game_state: {
              board: newBoard,
              rows: newBoard.length,
              cols: newBoard[0]?.length || 0,
              minesPlacedByPlayer1: countMinesByPlayer(newBoard, "player1"),
              minesPlacedByPlayer2: countMinesByPlayer(newBoard, "player2"),
            } as any,
            turn_phase: "reveal_cell",
          })
          .eq("id", game.id);

        if (updateError) throw updateError;

        // Optimistically update local state
        setBoard(newBoard);
      } catch (err) {
        console.error("Error placing mine:", err);
        setError(err instanceof Error ? err.message : "Failed to place mine");
      }
    },
    [game, board]
  );

  /**
   * Reveal a cell on the board
   */
  const revealCell = useCallback(
    async (row: number, col: number) => {
      if (!game || !board) {
        console.error("No game or board available");
        return;
      }

      const playerRole = getPlayerRole(game);

      // Validate it's player's turn and correct phase
      if (playerRole === "spectator") {
        console.error("Spectators cannot reveal cells");
        return;
      }

      if (game.current_turn !== playerRole) {
        console.error("Not your turn");
        return;
      }

      if (game.turn_phase !== "reveal_cell") {
        console.error("Not in reveal_cell phase");
        return;
      }

      try {
        // Reveal cell
        const newBoard = revealCellUtil(board, row, col);

        // Check for win/loss conditions
        const loseCheck = checkLoseCondition(newBoard, row, col);
        const winCheck = checkWinCondition(newBoard, playerRole as PlayerTurn);

        let gameStatus = game.status;
        let winner = game.winner;
        let nextTurn = game.current_turn;
        let nextPhase = game.turn_phase;

        const gameStateUpdate: any = {
          board: newBoard,
          rows: newBoard.length,
          cols: newBoard[0]?.length || 0,
          minesPlacedByPlayer1: countMinesByPlayer(newBoard, "player1"),
          minesPlacedByPlayer2: countMinesByPlayer(newBoard, "player2"),
        };

        if (loseCheck.hitMine) {
          // Current player hit a mine - they lose, opponent wins
          gameStatus = "finished";
          // Opponent wins (the player who did NOT reveal the mine)
          winner = playerRole === "player1" ? "player2" : "player1";
          // Track losing cell and reason
          gameStateUpdate.losingCell = { row, col };
          gameStateUpdate.lossReason = "revealed_mine";
        } else if (winCheck.isGameOver) {
          // Game over for some other reason
          gameStatus = "finished";
          winner = winCheck.winner;
        } else {
          // Continue game - switch turns
          nextTurn = game.current_turn === "player1" ? "player2" : "player1";
          nextPhase = "place_mine";
        }

        // Update game state
        const { error: updateError } = await supabase
          .from("games")
          .update({
            game_state: gameStateUpdate,
            current_turn: nextTurn,
            turn_phase: nextPhase,
            status: gameStatus,
            winner: winner,
          })
          .eq("id", game.id);

        if (updateError) throw updateError;

        // Optimistically update local state
        setBoard(newBoard);
      } catch (err) {
        console.error("Error revealing cell:", err);
        setError(err instanceof Error ? err.message : "Failed to reveal cell");
      }
    },
    [game, board]
  );

  /**
   * Toggle flag on a cell
   * Flags can be placed/removed at any time during your turn, regardless of phase.
   * Multiple flags can be toggled without consuming your turn or changing phase.
   */
  const toggleFlag = useCallback(
    async (row: number, col: number) => {
      if (!game || !board) {
        console.error("No game or board available");
        return;
      }

      const playerRole = getPlayerRole(game);
      const playerId = getPlayerId();

      // Debug logging
      console.log("🚩 Toggle Flag Debug:", {
        playerId,
        playerRole,
        currentTurn: game.current_turn,
        player1_id: game.player1_id,
        player2_id: game.player2_id,
        gameStatus: game.status,
        turnPhase: game.turn_phase,
      });

      // Only prevent spectators from flagging
      if (playerRole === "spectator") {
        console.error("❌ Spectators cannot flag cells");
        return;
      }

      // Allow flagging only during your turn (but any phase)
      if (game.current_turn !== playerRole) {
        console.error(
          "❌ Can only flag during your turn. Current turn:",
          game.current_turn,
          "Your role:",
          playerRole
        );
        return;
      }

      // Game must be active
      if (game.status !== "active") {
        console.error("❌ Game is not active. Status:", game.status);
        return;
      }

      try {
        // Toggle flag with player attribution
        const newBoard = toggleFlagUtil(
          board,
          row,
          col,
          playerRole as PlayerTurn
        );

        // Update game state (don't change turn/phase for flagging)
        // This allows unlimited flags during your turn
        const { error: updateError } = await supabase
          .from("games")
          .update({
            game_state: {
              board: newBoard,
              rows: newBoard.length,
              cols: newBoard[0]?.length || 0,
              minesPlacedByPlayer1: countMinesByPlayer(newBoard, "player1"),
              minesPlacedByPlayer2: countMinesByPlayer(newBoard, "player2"),
            } as any,
          })
          .eq("id", game.id);

        if (updateError) throw updateError;

        // Optimistically update local state
        setBoard(newBoard);
      } catch (err) {
        console.error("Error toggling flag:", err);
        setError(err instanceof Error ? err.message : "Failed to toggle flag");
      }
    },
    [game, board]
  );

  return {
    game,
    board,
    loading,
    error,
    placeMine,
    revealCell,
    toggleFlag,
    refetch: fetchGame,
  };
}
