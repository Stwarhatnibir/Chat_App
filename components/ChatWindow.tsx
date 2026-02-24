"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import MessageItem from "./MessageItem";
import TypingIndicator from "./TypingIndicator";

const ALLOWED_REACTIONS = ["👍", "❤️", "😂", "😮", "😢"];

interface Props {
  conversationId: Id<"conversations">;
}

export default function ChatWindow({ conversationId }: Props) {
  const { user } = useUser();
  const router = useRouter();
  const [input, setInput] = useState("");
  const [sendError, setSendError] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessages, setShowNewMessages] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const conversation = useQuery(api.conversations.getConversation, {
    conversationId,
  });
  const messages = useQuery(api.messages.listMessages, { conversationId });
  const typingUsers = useQuery(api.messages.getTypingUsers, { conversationId });

  const sendMessage = useMutation(api.messages.sendMessage);
  const setTyping = useMutation(api.messages.setTyping);
  const markAsRead = useMutation(api.messages.markAsRead);

  const currentUser = conversation?.me;

  useEffect(() => {
    markAsRead({ conversationId });
  }, [conversationId, messages?.length]);

  const scrollToBottom = useCallback((force = false) => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (force || distanceFromBottom < 100) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setShowNewMessages(false);
    }
  }, []);

  useEffect(() => {
    if (!messages) return;
    const count = messages.length;

    if (count > lastMessageCount) {
      if (isAtBottom) {
        scrollToBottom(true);
      } else {
        setShowNewMessages(true);
      }
    }

    setLastMessageCount(count);
  }, [messages?.length]);

  useEffect(() => {
    setTimeout(() => scrollToBottom(true), 100);
  }, [conversationId]);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;
    const atBottom = scrollHeight - scrollTop - clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setShowNewMessages(false);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content) return;

    setInput("");
    setSendError(null);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      await sendMessage({ conversationId, content });
      scrollToBottom(true);
    } catch (err) {
      setSendError("Failed to send. Tap to retry.");
      setInput(content);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height =
        Math.min(inputRef.current.scrollHeight, 128) + "px";
    }

    setTyping({ conversationId });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getHeaderInfo = () => {
    if (!conversation)
      return {
        name: "Loading...",
        subtitle: "",
        avatar: null,
        isOnline: false,
      };

    if (conversation.isGroup) {
      return {
        name: conversation.groupName ?? "Group",
        subtitle: `${conversation.participants.length} members`,
        avatar: null,
        isOnline: false,
      };
    }

    const other = (conversation.participants as any[]).find(
      (p) => p?.clerkId !== user?.id,
    );
    return {
      name: other?.name ?? "Unknown",
      subtitle: other?.isOnline ? "Online" : "Offline",
      avatar: other,
      isOnline: other?.isOnline ?? false,
    };
  };

  const { name, subtitle, avatar, isOnline } = getHeaderInfo();

  return (
    <div className="flex flex-col h-full bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 pt-safe bg-gray-800 shadow-md z-10">
        <button
          onClick={() => router.push("/chat")}
          className="md:hidden p-2 hover:bg-gray-700 rounded-xl transition"
        >
          <svg
            className="w-5 h-5 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <div className="relative flex-shrink-0">
          {avatar?.imageUrl ? (
            <img
              src={avatar.imageUrl}
              alt={name}
              className="w-10 h-10 rounded-full object-cover border-2 border-gray-700"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
              {name[0]?.toUpperCase()}
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900"></div>
          )}
        </div>

        <div className="flex-1">
          <p className="font-semibold text-gray-100 text-sm">{name}</p>
          <p
            className={`text-xs ${isOnline ? "text-green-400" : "text-gray-400"}`}
          >
            {subtitle}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 relative scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800"
      >
        {messages === undefined ? (
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`flex items-end gap-2 animate-pulse ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
              >
                <div className="w-8 h-8 bg-gray-700 rounded-full flex-shrink-0"></div>
                <div
                  className={`h-10 bg-gray-700 rounded-2xl ${i % 2 === 0 ? "w-48" : "w-36"}`}
                ></div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
            <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-gray-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-gray-300 font-medium">No messages yet</p>
            <p className="text-gray-500 text-sm mt-1">Say hi to {name}! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((msg, idx) => {
              const prevMsg = messages[idx - 1];
              const showDateDivider =
                !prevMsg ||
                new Date(msg._creationTime).toDateString() !==
                  new Date(prevMsg._creationTime).toDateString();

              return (
                <div key={msg._id}>
                  {showDateDivider && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-700"></div>
                      <span className="text-xs text-gray-400 font-medium px-2">
                        {formatDateDivider(msg._creationTime)}
                      </span>
                      <div className="flex-1 h-px bg-gray-700"></div>
                    </div>
                  )}
                  <MessageItem
                    message={msg}
                    isOwn={msg.senderId === currentUser?._id}
                    allowedReactions={ALLOWED_REACTIONS}
                    currentUserId={currentUser?._id}
                    darkMode
                  />
                </div>
              );
            })}
            {typingUsers && typingUsers.length > 0 && (
              <TypingIndicator users={typingUsers as any[]} />
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showNewMessages && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
          <button
            onClick={() => scrollToBottom(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
            New messages
          </button>
        </div>
      )}

      {sendError && (
        <div className="px-4 py-2 bg-red-800 shadow-inner flex items-center justify-between">
          <span className="text-sm text-red-400">{sendError}</span>
          <button
            onClick={handleSend}
            className="text-sm font-medium text-red-400 hover:text-red-300 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 bg-gray-800 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-start gap-2 bg-gray-700 rounded-2xl px-4 py-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${name}...`}
              rows={1}
              className="flex-1 bg-transparent text-sm focus:outline-none text-gray-100 placeholder-gray-400 resize-none max-h-32 overflow-y-auto"
              style={{ minHeight: "20px" }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-all active:scale-95 flex-shrink-0"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function formatDateDivider(timestamp: number): string {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  const currentYear = today.getFullYear();
  if (date.getFullYear() === currentYear) {
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
