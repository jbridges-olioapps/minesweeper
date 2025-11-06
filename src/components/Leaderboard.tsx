/**
 * @fileoverview Leaderboard component - Displays top players by win count.
 * Shows the top 5 players with animated entry and rank badges.
 */

import { motion, AnimatePresence } from "framer-motion";
import { FaTrophy, FaMedal, FaAward } from "react-icons/fa";
import { useLeaderboard } from "../hooks/useLeaderboard";
import { getPlayerId } from "../utils/playerId";

/**
 * Leaderboard component - Displays top players and their win counts.
 *
 * Features:
 * - Top 5 players by total wins
 * - Gold, silver, bronze medal icons for top 3
 * - Highlights current player if in top 5
 * - Loading state with spinner
 * - Empty state message
 * - Animated entry with stagger effect
 */
export function Leaderboard() {
  const { leaderboard, loading, error } = useLeaderboard(5);
  const currentPlayerId = getPlayerId();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <FaTrophy className="text-yellow-500" />;
      case 2:
        return <FaMedal className="text-gray-400" />;
      case 3:
        return <FaMedal className="text-amber-700" />;
      default:
        return <FaAward className="text-base-content/50" />;
    }
  };

  const getRankBadgeClass = (rank: number) => {
    switch (rank) {
      case 1:
        return "badge-warning";
      case 2:
        return "badge-ghost";
      case 3:
        return "badge-accent";
      default:
        return "badge-ghost";
    }
  };

  const shortenPlayerId = (id: string) => {
    if (id.length <= 8) return id;
    return `${id.slice(0, 6)}...`;
  };

  if (error) {
    return (
      <motion.div
        className="card bg-base-100 shadow-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="card-body p-4">
          <h3 className="card-title text-sm flex items-center gap-2">
            <FaTrophy className="text-primary" />
            Leaderboard
          </h3>
          <p className="text-sm text-error">Failed to load leaderboard</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="card bg-base-100 shadow-md"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="card-body p-4">
        <h3 className="card-title text-sm flex items-center gap-2">
          <FaTrophy className="text-primary" />
          Top Players
        </h3>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <span className="loading loading-spinner loading-sm"></span>
          </div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-base-content/70 text-center py-4">
            No games finished yet. Be the first winner!
          </p>
        ) : (
          <div className="space-y-2 mt-2">
            <AnimatePresence>
              {leaderboard.map((entry, index) => (
                <motion.div
                  key={entry.player_id}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    entry.player_id === currentPlayerId
                      ? "bg-primary/10 ring-1 ring-primary"
                      : "bg-base-200"
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6">
                      {getRankIcon(entry.rank)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {entry.player_id === currentPlayerId
                            ? "You"
                            : shortenPlayerId(entry.player_id)}
                        </span>
                        <div
                          className={`badge badge-xs ${getRankBadgeClass(
                            entry.rank
                          )}`}
                        >
                          #{entry.rank}
                        </div>
                      </div>
                      <p className="text-xs text-base-content/70">
                        {entry.total_wins}{" "}
                        {entry.total_wins === 1 ? "win" : "wins"}
                      </p>
                    </div>
                  </div>
                  <motion.div
                    className="text-lg font-bold text-primary"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                  >
                    {entry.total_wins}
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
