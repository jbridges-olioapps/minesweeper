/**
 * @fileoverview GameLobby component - Entry point for creating and joining games.
 * Handles game creation, game ID sharing, and joining existing games.
 */

import { useState } from "react";
import { FaCopy, FaCheck, FaGamepad, FaUsers } from "react-icons/fa";
import { MdContentPaste } from "react-icons/md";
import { supabase } from "../lib/supabase";
import type { Game } from "../lib/supabase";
import { getPlayerId } from "../utils/playerId";
import { generateEmptyBoard } from "../utils/minesweeper";

/**
 * Props for the GameLobby component
 */
interface GameLobbyProps {
  /** Callback invoked when a player successfully joins a game */
  onGameJoined: (game: Game) => void;
}

/**
 * GameLobby component - Main lobby interface for creating and joining games.
 *
 * Features:
 * - Create new game button that generates a unique game ID
 * - Display shareable game ID with copy-to-clipboard functionality
 * - Join existing game by entering game ID
 * - Paste game ID from clipboard
 * - Waiting screen with spinner when waiting for opponent
 * - Error handling for invalid game IDs and connection issues
 * - How-to-play instructions
 *
 * Uses localStorage-based player identification (no authentication required).
 */
export function GameLobby({ onGameJoined }: GameLobbyProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinGameId, setJoinGameId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [createdGameId, setCreatedGameId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const playerId = getPlayerId();

  const handleCreateGame = async () => {
    setIsCreating(true);
    setError(null);

    try {
      // Create an empty board (8x8 by default)
      const board = generateEmptyBoard(8, 8);

      // Create game in database
      const { data, error: createError } = await supabase
        .from("games")
        .insert({
          player1_id: playerId,
          player2_id: null,
          current_turn: "player1",
          turn_phase: "place_mine",
          game_state: {
            board,
            rows: 8,
            cols: 8,
            minesPlacedByPlayer1: 0,
            minesPlacedByPlayer2: 0,
          } as any,
          status: "waiting",
          winner: null,
        })
        .select()
        .single();

      if (createError) throw createError;

      if (data) {
        setCreatedGameId(data.id);
        // Don't call onGameJoined yet - wait for player 2
      }
    } catch (err) {
      console.error("Error creating game:", err);
      setError(err instanceof Error ? err.message : "Failed to create game");
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGame = async () => {
    if (!joinGameId.trim()) {
      setError("Please enter a game ID");
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      // Fetch the game
      const { data: game, error: fetchError } = await supabase
        .from("games")
        .select()
        .eq("id", joinGameId.trim())
        .single();

      if (fetchError) throw fetchError;

      if (!game) {
        throw new Error("Game not found");
      }

      // Check if game is available to join
      if (game.status !== "waiting") {
        throw new Error("This game is no longer available to join");
      }

      if (game.player2_id) {
        throw new Error("This game already has two players");
      }

      if (game.player1_id === playerId) {
        throw new Error("You cannot join your own game");
      }

      // Join the game
      const { data: updatedGame, error: updateError } = await supabase
        .from("games")
        .update({
          player2_id: playerId,
          status: "active",
        })
        .eq("id", joinGameId.trim())
        .select()
        .single();

      if (updateError) throw updateError;

      if (updatedGame) {
        onGameJoined(updatedGame);
      }
    } catch (err) {
      console.error("Error joining game:", err);
      setError(err instanceof Error ? err.message : "Failed to join game");
    } finally {
      setIsJoining(false);
    }
  };

  const handleCopyGameId = async () => {
    if (!createdGameId) return;

    try {
      await navigator.clipboard.writeText(createdGameId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handlePasteGameId = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setJoinGameId(text.trim());
    } catch (err) {
      console.error("Failed to paste:", err);
    }
  };

  const shortenGameId = (id: string) => {
    if (id.length <= 16) return id;
    return `${id.slice(0, 8)}...${id.slice(-8)}`;
  };

  // If we created a game, show waiting screen
  if (createdGameId) {
    return (
      <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-2xl w-full">
          <div className="card-body">
            <h2 className="card-title text-2xl justify-center">
              <FaUsers className="text-primary" />
              Waiting for Opponent
            </h2>

            <div className="divider"></div>

            <div className="text-center space-y-4">
              <p className="text-base-content/70">
                Share this Game ID with your opponent:
              </p>

              <div className="flex items-center gap-2 justify-center">
                <div className="badge badge-lg badge-primary font-mono p-4">
                  {shortenGameId(createdGameId)}
                </div>
                <button
                  className={`btn btn-sm ${
                    copied ? "btn-success" : "btn-ghost"
                  }`}
                  onClick={handleCopyGameId}
                  title="Copy Game ID"
                >
                  {copied ? (
                    <FaCheck className="text-success-content" />
                  ) : (
                    <FaCopy />
                  )}
                </button>
              </div>

              <div className="bg-base-200 p-4 rounded-lg">
                <p className="text-sm font-mono break-all">{createdGameId}</p>
              </div>

              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>

              <p className="text-sm text-base-content/60">
                Waiting for player 2 to join...
              </p>
            </div>

            <div className="card-actions justify-center mt-4">
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setCreatedGameId(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-300 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-5xl font-bold">Multiplayer Minesweeper</h1>
          <p className="text-base-content/70">
            Competitive mine-placing action! Place mines and reveal cells to
            outsmart your opponent.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
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
            <span>{error}</span>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Create Game Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <FaGamepad className="text-primary" />
                Create New Game
              </h2>
              <p className="text-base-content/70">
                Start a new game and invite a friend to join.
              </p>

              <div className="divider"></div>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>Your Player ID:</strong>
                </p>
                <div className="badge badge-ghost font-mono">{playerId}</div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary btn-block"
                  onClick={handleCreateGame}
                  disabled={isCreating}
                >
                  {isCreating && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Create Game
                </button>
              </div>
            </div>
          </div>

          {/* Join Game Card */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">
                <FaUsers className="text-secondary" />
                Join Existing Game
              </h2>
              <p className="text-base-content/70">
                Enter a Game ID to join an opponent's game.
              </p>

              <div className="divider"></div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Game ID</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Game ID..."
                    className="input input-bordered flex-1 font-mono text-sm"
                    value={joinGameId}
                    onChange={(e) => setJoinGameId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleJoinGame();
                      }
                    }}
                  />
                  <button
                    className="btn btn-ghost btn-square"
                    onClick={handlePasteGameId}
                    title="Paste from clipboard"
                  >
                    <MdContentPaste size={20} />
                  </button>
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-secondary btn-block"
                  onClick={handleJoinGame}
                  disabled={isJoining || !joinGameId.trim()}
                >
                  {isJoining && (
                    <span className="loading loading-spinner"></span>
                  )}
                  Join Game
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* How to Play */}
        <div className="card bg-base-100 shadow-md">
          <div className="card-body py-4">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="list-disc list-inside text-sm text-base-content/70 space-y-1">
              <li>Each turn: Place a mine, then reveal a cell</li>
              <li>Try to make your opponent reveal your mines</li>
              <li>If you reveal a mine, you lose!</li>
              <li>Use flags (right-click) to mark suspected mines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
