/**
 * @fileoverview PlayerStatus component - Displays player information and game status.
 * Shows turn indicators, player badges, and win/loss results.
 */

import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaUser, FaSkull } from "react-icons/fa";
import { MdTimer } from "react-icons/md";
import type { Game } from "../lib/supabase";
import { getPlayerRole } from "../utils/playerId";

/**
 * Props for the PlayerStatus component
 */
interface PlayerStatusProps {
  /** Current game state from Supabase */
  game: Game;
}

/**
 * PlayerStatus component - Displays player cards and game status information.
 *
 * Features:
 * - Shows both player cards side-by-side with status badges
 * - Highlights active player with ring border
 * - Displays current turn and phase (placing mine / revealing cell)
 * - Shows "You" badge for current user
 * - Victory/defeat/draw alerts when game finishes
 * - Spectator mode notification
 * - Color-coded status indicators
 *
 * Uses getPlayerRole() to determine if viewing as player1, player2, or spectator.
 */
export function PlayerStatus({ game }: PlayerStatusProps) {
  const playerRole = getPlayerRole(game);
  const isMyTurn =
    playerRole !== "spectator" && game.current_turn === playerRole;

  const getPlayerName = (player: "player1" | "player2") => {
    if (playerRole === player) return "You";
    return player === "player1" ? "Player 1" : "Player 2";
  };

  const getPlayerBadgeClass = (player: "player1" | "player2") => {
    // If game is finished, highlight winner
    if (game.status === "finished" && game.winner === player) {
      return "badge-success";
    }
    // If it's this player's turn
    if (game.current_turn === player && game.status === "active") {
      return "badge-primary";
    }
    return "badge-ghost";
  };

  const getGameResultMessage = () => {
    if (game.status !== "finished") return null;

    const isWinner = game.winner === playerRole;
    const isDraw = !game.winner;
    const gameState = game.game_state as any;
    const lossReason = gameState?.lossReason as
      | "revealed_mine"
      | "placed_on_mine"
      | undefined;

    // Get loss reason text
    const getLossReasonText = () => {
      if (lossReason === "revealed_mine") {
        return isWinner ? "Opponent revealed a mine!" : "You revealed a mine!";
      }
      if (lossReason === "placed_on_mine") {
        return isWinner
          ? "Opponent placed a mine on an existing mine!"
          : "You placed a mine on an existing mine!";
      }
      return "";
    };

    if (isDraw) {
      return (
        <motion.div
          className="alert"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <MdTimer className="text-info" />
          <span>Game ended in a draw!</span>
        </motion.div>
      );
    }

    if (isWinner) {
      return (
        <motion.div
          className="alert alert-success"
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <motion.div
            animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 0.6, repeat: 2 }}
          >
            <FaTrophy className="text-success-content" />
          </motion.div>
          <div>
            <h3 className="font-bold">Victory!</h3>
            <div className="text-sm">{getLossReasonText()}</div>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="alert alert-error"
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 10, 0] }}
          transition={{ duration: 0.5, repeat: 2 }}
        >
          <FaSkull className="text-error-content" />
        </motion.div>
        <div>
          <h3 className="font-bold">Defeat</h3>
          <div className="text-sm">{getLossReasonText()}</div>
        </div>
      </motion.div>
    );
  };

  const getCurrentPhaseText = () => {
    if (game.status === "waiting") return "Waiting for players...";
    if (game.status === "finished") return "Game finished";

    const turnPlayer =
      game.current_turn === "player1" ? "Player 1" : "Player 2";
    const phaseText =
      game.turn_phase === "place_mine" ? "placing mine" : "revealing cell";

    if (isMyTurn) {
      return `Your turn: ${phaseText}`;
    }

    return `${turnPlayer} is ${phaseText}`;
  };

  return (
    <div className="space-y-4">
      {/* Game Result (if finished) */}
      <AnimatePresence>
        {game.status === "finished" && getGameResultMessage()}
      </AnimatePresence>

      {/* Player Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* Player 1 */}
        <motion.div
          className={`card bg-base-100 shadow-md ${
            game.current_turn === "player1" && game.status === "active"
              ? "ring-2 ring-primary"
              : ""
          }`}
          initial={{ opacity: 0, x: -20 }}
          animate={{
            opacity: 1,
            x: 0,
            scale:
              game.current_turn === "player1" && game.status === "active"
                ? 1.02
                : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <FaUser
                className={
                  playerRole === "player1"
                    ? "text-primary"
                    : "text-base-content/50"
                }
              />
              <h3 className="font-semibold text-sm">
                {getPlayerName("player1")}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <div
                className={`badge badge-sm ${getPlayerBadgeClass("player1")}`}
              >
                {game.current_turn === "player1" && game.status === "active"
                  ? "Current Turn"
                  : game.winner === "player1"
                  ? "Winner"
                  : "Waiting"}
              </div>
              {playerRole === "player1" && (
                <div className="badge badge-sm badge-accent">You</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Player 2 */}
        <motion.div
          className={`card bg-base-100 shadow-md ${
            game.current_turn === "player2" && game.status === "active"
              ? "ring-2 ring-primary"
              : ""
          }`}
          initial={{ opacity: 0, x: 20 }}
          animate={{
            opacity: 1,
            x: 0,
            scale:
              game.current_turn === "player2" && game.status === "active"
                ? 1.02
                : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="card-body p-4">
            <div className="flex items-center gap-2">
              <FaUser
                className={
                  playerRole === "player2"
                    ? "text-primary"
                    : "text-base-content/50"
                }
              />
              <h3 className="font-semibold text-sm">
                {game.player2_id ? getPlayerName("player2") : "Waiting..."}
              </h3>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {game.player2_id ? (
                <>
                  <div
                    className={`badge badge-sm ${getPlayerBadgeClass(
                      "player2"
                    )}`}
                  >
                    {game.current_turn === "player2" && game.status === "active"
                      ? "Current Turn"
                      : game.winner === "player2"
                      ? "Winner"
                      : "Waiting"}
                  </div>
                  {playerRole === "player2" && (
                    <div className="badge badge-sm badge-accent">You</div>
                  )}
                </>
              ) : (
                <div className="badge badge-sm badge-ghost">Not joined</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Current Phase Indicator */}
      {game.status !== "finished" && (
        <div className="text-center">
          <div
            className={`badge ${
              isMyTurn ? "badge-primary" : "badge-secondary"
            } badge-lg gap-2`}
          >
            {game.status === "active" && <MdTimer />}
            {getCurrentPhaseText()}
          </div>
        </div>
      )}

      {/* Spectator Notice */}
      {playerRole === "spectator" && (
        <div className="alert alert-info">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="stroke-current shrink-0 w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>You are spectating this game</span>
        </div>
      )}
    </div>
  );
}
