/**
 * @fileoverview Hook for managing in-game chat with real-time updates.
 * Handles message fetching, sending, and real-time subscriptions.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Message, MessageInsert } from "../lib/supabase";
import type { PlayerTurn } from "../types/game";

/**
 * Hook for managing chat messages with Supabase real-time.
 *
 * Features:
 * - Fetches initial messages for a game
 * - Subscribes to real-time message updates
 * - Provides sendMessage function
 * - Manages loading and error states
 * - Cleans up subscriptions on unmount
 *
 * @param gameId - The ID of the game to fetch messages for
 * @returns Chat state and action functions
 */
export function useChat(gameId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch initial messages for the game
   */
  const fetchMessages = useCallback(async () => {
    if (!gameId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("messages")
        .select("*")
        .eq("game_id", gameId)
        .order("created_at", { ascending: true });

      if (fetchError) throw fetchError;

      setMessages(data || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  /**
   * Subscribe to real-time message updates
   */
  useEffect(() => {
    if (!gameId) return;

    fetchMessages();

    const channel = supabase
      .channel(`messages:${gameId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          console.log("New message received:", payload);
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId, fetchMessages]);

  /**
   * Send a new message
   */
  const sendMessage = useCallback(
    async (
      message: string,
      playerId: string,
      playerRole: PlayerTurn
    ): Promise<boolean> => {
      if (!gameId) {
        console.error("No game ID available");
        return false;
      }

      if (!message.trim()) {
        console.error("Message cannot be empty");
        return false;
      }

      try {
        const messageData: MessageInsert = {
          game_id: gameId,
          player_id: playerId,
          player_role: playerRole,
          message: message.trim(),
        };

        const { error: insertError } = await supabase
          .from("messages")
          .insert(messageData);

        if (insertError) throw insertError;

        console.log("Message sent successfully");
        return true;
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
        return false;
      }
    },
    [gameId]
  );

  return {
    messages,
    loading,
    error,
    sendMessage,
    refetch: fetchMessages,
  };
}
