/**
 * @fileoverview Hook for fetching leaderboard data.
 * Retrieves top players by win count from the leaderboard view.
 */

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export interface LeaderboardEntry {
  player_id: string;
  total_wins: number;
  rank: number;
}

/**
 * Hook for fetching leaderboard data.
 *
 * @param limit - Number of top players to fetch (default: 5)
 * @returns Leaderboard data, loading state, and error state
 */
export function useLeaderboard(limit = 5) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("leaderboard")
          .select("*")
          .limit(limit);

        if (fetchError) throw fetchError;

        // Add rank to each entry
        const rankedData: LeaderboardEntry[] = (data || []).map(
          (entry, index) => ({
            ...entry,
            rank: index + 1,
          })
        );

        setLeaderboard(rankedData);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch leaderboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [limit]);

  return { leaderboard, loading, error };
}
