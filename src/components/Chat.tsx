/**
 * @fileoverview Chat component for in-game messaging.
 * Displays chat messages and provides input for sending new messages.
 */

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaPaperPlane, FaComment, FaMinus, FaPlus } from "react-icons/fa";
import type { Message } from "../lib/supabase";

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
  /** Array of spectator IDs in order they joined */
  spectators?: string[];
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
  spectators = [],
}: ChatProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(messages.length);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  // Auto-open chat and track unread messages when new messages arrive
  useEffect(() => {
    const newMessageCount = messages.length;
    const previousCount = previousMessageCountRef.current;

    if (newMessageCount > previousCount) {
      if (isMinimized) {
        // Auto-open chat when new message arrives
        setIsMinimized(false);
        setUnreadCount(0);
      }
    }

    previousMessageCountRef.current = newMessageCount;
  }, [messages.length, isMinimized]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
    }
  }, [isMinimized]);

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

  const getPlayerName = (role: string, messageSenderId?: string) => {
    if (role === playerRole) return "You";
    if (role === "player1") return "Player 1";
    if (role === "player2") return "Player 2";

    // For spectators, show their number based on join order
    if (role === "spectator" && messageSenderId) {
      const spectatorIndex = spectators.indexOf(messageSenderId);
      if (spectatorIndex !== -1) {
        return `Spectator ${spectatorIndex + 1}`;
      }
    }

    return "Spectator";
  };

  const getMessageClassName = (messageRole: string) => {
    const isOwnMessage = messageRole === playerRole;
    return `chat ${isOwnMessage ? "chat-end" : "chat-start"}`;
  };

  const getBubbleClassName = (messageRole: string) => {
    const isOwnMessage = messageRole === playerRole;

    // Spectator messages have a different color
    if (messageRole === "spectator") {
      return `chat-bubble ${
        isOwnMessage ? "chat-bubble-accent" : "chat-bubble-ghost"
      }`;
    }

    return `chat-bubble ${
      isOwnMessage ? "chat-bubble-primary" : "chat-bubble-secondary"
    }`;
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <motion.div
      className="card bg-base-100 shadow-2xl w-full"
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
    >
      <div className="card-body p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: isMinimized ? 0 : [0, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <FaComment className="text-primary" />
            </motion.div>
            <h3 className="font-semibold text-sm">Game Chat</h3>
            {disabled && (
              <span className="badge badge-ghost badge-sm">Spectator</span>
            )}
            <AnimatePresence>
              {isMinimized && unreadCount > 0 && (
                <motion.span
                  className="badge badge-primary badge-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                >
                  {unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <motion.button
            onClick={toggleMinimize}
            className="btn btn-ghost btn-xs btn-circle"
            aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            {isMinimized ? <FaPlus /> : <FaMinus />}
          </motion.button>
        </div>

        {/* Chat Content - Collapsible */}
        <AnimatePresence>
          {!isMinimized && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                    <AnimatePresence initial={false}>
                      {messages.map((message, index) => (
                        <motion.div
                          key={message.id}
                          className={getMessageClassName(message.player_role)}
                          initial={{
                            opacity: 0,
                            x: message.player_role === playerRole ? 20 : -20,
                          }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <div className="chat-header text-xs opacity-70 mb-1">
                            {getPlayerName(
                              message.player_role,
                              message.player_id
                            )}
                            <time className="ml-1">
                              {formatTimestamp(message.created_at)}
                            </time>
                          </div>
                          <div
                            className={getBubbleClassName(message.player_role)}
                          >
                            {message.message}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
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
                    disabled
                      ? "Spectators cannot send messages"
                      : "Type a message..."
                  }
                  className="input input-bordered input-sm flex-1"
                  disabled={disabled || isSending}
                  maxLength={500}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={disabled || isSending || !inputValue.trim()}
                  className="btn btn-primary btn-sm"
                  aria-label="Send message"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isSending ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <FaPaperPlane />
                  )}
                </motion.button>
              </div>

              {/* Character counter */}
              <AnimatePresence>
                {inputValue.length > 400 && (
                  <motion.div
                    className="text-xs text-base-content/50 text-right"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                  >
                    {inputValue.length}/500
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
