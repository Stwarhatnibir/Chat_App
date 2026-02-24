"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatMessageTime } from "@/lib/utils";

interface Props {
  message: any;
  isOwn: boolean;
  allowedReactions: string[];
  currentUserId?: Id<"users">;
  darkMode?: boolean;
}

export default function MessageItem({
  message,
  isOwn,
  allowedReactions,
  currentUserId,
  darkMode = true,
}: Props) {
  const deleteMessage = useMutation(api.messages.deleteMessage);
  const toggleReaction = useMutation(api.messages.toggleReaction);

  const handleDelete = async () => {
    if (confirm("Delete this message?")) {
      await deleteMessage({ messageId: message._id });
    }
  };

  const handleReaction = async (emoji: string) => {
    await toggleReaction({ messageId: message._id, emoji });
  };

  const reactions =
    message.reactions?.filter((r: any) => r.userIds.length > 0) ?? [];

  const ownBubbleClass = darkMode
    ? "bg-purple-600 text-white rounded-br-sm"
    : "bg-blue-600 text-white rounded-br-sm";
  const otherBubbleClass = darkMode
    ? "bg-gray-800 text-gray-100 rounded-bl-sm"
    : "bg-gray-100 text-gray-900 rounded-bl-sm";

  return (
    <div
      className={`flex items-end gap-2 mb-1 relative ${isOwn ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0 mb-1">
          {message.sender?.imageUrl ? (
            <img
              src={message.sender.imageUrl}
              alt={message.sender.name}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-semibold">
              {message.sender?.name?.[0]?.toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      )}

      <div
        className={`max-w-[75%] flex flex-col ${isOwn ? "items-end" : "items-start"}`}
      >
        {/* Sender name for groups */}
        {!isOwn && message.sender?.name && (
          <span className="text-xs text-gray-400 mb-1 ml-1">
            {message.sender.name}
          </span>
        )}

        {/* Message bubble */}
        <div className="relative group">
          {message.isDeleted ? (
            <div
              className={`px-4 py-2.5 rounded-2xl ${isOwn ? "rounded-br-sm" : "rounded-bl-sm"} ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}
            >
              <p className="text-sm text-gray-400 italic">
                This message was deleted
              </p>
            </div>
          ) : (
            <div
              className={`px-4 py-2.5 rounded-2xl ${isOwn ? ownBubbleClass : otherBubbleClass}`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          )}

          {/* Reaction picker */}
          {!message.isDeleted && (
            <div
              className={`absolute -top-10 hidden group-hover:flex items-center gap-1 ${darkMode ? "bg-gray-800" : "bg-white"} rounded-xl shadow-lg px-3 py-2 z-20 ${isOwn ? "right-0" : "left-0"}`}
            >
              {allowedReactions.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-xl hover:scale-125 transition-transform"
                  title={`React with ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Delete button */}
          {!message.isDeleted && isOwn && (
            <button
              onClick={handleDelete}
              className={`absolute -bottom-2 -left-2 hidden group-hover:block rounded-full p-1 text-gray-400 hover:text-red-500 transition-all z-30 ${darkMode ? "bg-gray-800 shadow-md hover:shadow-lg" : "bg-white shadow-lg"}`}
              title="Delete message"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Reactions */}
        {reactions.length > 0 && (
          <div
            className={`flex flex-wrap gap-1 mt-1 ${isOwn ? "justify-end" : "justify-start"}`}
          >
            {reactions.map((r: any) => (
              <button
                key={r.emoji}
                onClick={() => handleReaction(r.emoji)}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-all ${
                  currentUserId && r.userIds.includes(currentUserId)
                    ? darkMode
                      ? "bg-purple-700 text-white shadow-sm"
                      : "bg-blue-100 text-blue-700 shadow-sm"
                    : darkMode
                      ? "bg-gray-700 text-gray-100 shadow-sm hover:shadow-md"
                      : "bg-white text-gray-600 shadow-sm hover:shadow-md"
                }`}
              >
                <span>{r.emoji}</span>
                <span className="font-medium">{r.userIds.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-gray-400 mt-0.5 mx-1">
          {formatMessageTime(message._creationTime)}
        </span>
      </div>
    </div>
  );
}
