/**
 * @fileoverview Chat component for in-game messaging.
 * Displays chat messages and provides input for sending new messages.
 */

import { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaComment } from "react-icons/fa";
import type { Message } from "../lib/supabase";
import type { PlayerTurn } from "../types/game";

/**
 * Props for the Chat component
 */
interface ChatProps {
  /** Array of chat messages */
  messages: Message[];
  /** The current player's role */
  playerRole: "player1" | "player2" | "spectator";
  /** Callback to send a new message */
  onSendMessage: (message: string) => Promise<boolean>;
  /** Whether chat is disabled (e.g., spectators) */
  disabled?: boolean;
  /** Whether messages are loading */
  loading?: boolean;
}

/**
 * Chat component - Displays messages and allows sending new messages.
 *
 * Features:
 * - Scrollable message history
 * - Color-coded messages by player
 * - Timestamp display
 * - Message input with send button
 * - Enter key to send
 * - Auto-scroll to latest message
 * - Disabled state for spectators
 */
export function Chat({
  messages,
  playerRole,
  onSendMessage,
  disabled = false,
  loading = false,
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending || disabled) return;

    setIsSending(true);
    const success = await onSendMessage(inputValue);

    if (success) {
      setInputValue("");
    }
    setIsSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getPlayerName = (role: string) => {
    if (role === playerRole) return "You";
    return role === "player1" ? "Player 1" : "Player 2";
  };

  const getMessageClassName = (messageRole: string) => {
    const isOwnMessage = messageRole === playerRole;
    return `chat ${isOwnMessage ? "chat-end" : "chat-start"}`;
  };

  const getBubbleClassName = (messageRole: string) => {
    const isOwnMessage = messageRole === playerRole;
    return `chat-bubble ${
      isOwnMessage ? "chat-bubble-primary" : "chat-bubble-secondary"
    }`;
  };

  return (
    <div className="card bg-base-100 shadow-md w-full max-w-2xl">
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <FaComment className="text-primary" />
          <h3 className="font-semibold text-sm">Game Chat</h3>
          {disabled && (
            <span className="badge badge-ghost badge-sm">Spectator</span>
          )}
        </div>

        {/* Messages Area */}
        <div
          ref={messagesContainerRef}
          className="h-48 overflow-y-auto bg-base-200 rounded-lg p-3 space-y-2"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="loading loading-spinner loading-sm"></span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-base-content/50 text-sm">
              No messages yet. Start the conversation!
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={getMessageClassName(message.player_role)}
                >
                  <div className="chat-header text-xs opacity-70 mb-1">
                    {getPlayerName(message.player_role)}
                    <time className="ml-1">
                      {formatTimestamp(message.created_at)}
                    </time>
                  </div>
                  <div className={getBubbleClassName(message.player_role)}>
                    {message.message}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              disabled ? "Spectators cannot send messages" : "Type a message..."
            }
            className="input input-bordered input-sm flex-1"
            disabled={disabled || isSending}
            maxLength={500}
          />
          <button
            onClick={handleSendMessage}
            disabled={disabled || isSending || !inputValue.trim()}
            className="btn btn-primary btn-sm"
            aria-label="Send message"
          >
            {isSending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              <FaPaperPlane />
            )}
          </button>
        </div>

        {/* Character counter */}
        {inputValue.length > 400 && (
          <div className="text-xs text-base-content/50 text-right">
            {inputValue.length}/500
          </div>
        )}
      </div>
    </div>
  );
}
