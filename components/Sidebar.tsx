"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/utils";
import UserSearch from "./UserSearch";
import CreateGroup from "./CreateGroup";

export default function Sidebar() {
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [showSearch, setShowSearch] = useState(false);
  const [showGroup, setShowGroup] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const conversations = useQuery(api.conversations.listConversations);
  const activeConvId = pathname.startsWith("/chat/")
    ? pathname.split("/chat/")[1]
    : null;
  const isOnMobileChatPage = activeConvId && pathname !== "/chat";

  const getConversationName = (convo: any) => {
    if (convo.isGroup) return convo.groupName ?? "Group";
    const other = convo.participants.find((p: any) => p?.clerkId !== user?.id);
    return other?.name ?? "Unknown";
  };

  const getConversationAvatar = (convo: any) => {
    if (convo.isGroup) return null;
    const other = convo.participants.find((p: any) => p?.clerkId !== user?.id);
    return other;
  };

  return (
    <>
      <aside
        className={`
          w-full md:w-80 lg:w-96 flex flex-col h-full
          ${darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-900"} 
          ${isOnMobileChatPage ? "hidden md:flex" : "flex"} shadow-lg
        `}
      >
        {/* Header */}
        <div
          className={`px-4 py-4 flex flex-col gap-4 ${darkMode ? "bg-gray-850" : "bg-white"} shadow-sm`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserButton afterSignOutUrl="/sign-in" />
              <div>
                <p className="font-semibold text-sm">
                  {user?.fullName ?? user?.username}
                </p>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-400">Online</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button
                onClick={() => {
                  setShowGroup(true);
                  setShowSearch(false);
                }}
                className="p-2 rounded-xl hover:bg-gray-700 transition-colors"
                title="New group"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                onClick={() => {
                  setShowSearch(true);
                  setShowGroup(false);
                }}
                className="p-2 rounded-xl hover:bg-gray-700 transition-colors"
                title="New chat"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Search Conversations */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search conversations..."
              className={`w-full pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                darkMode
                  ? "bg-gray-800 text-gray-100 placeholder-gray-400"
                  : "bg-gray-100 text-gray-900 placeholder-gray-500"
              }`}
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Modals / Content */}
        {showSearch ? (
          <UserSearch
            currentUserId={user?.id}
            onClose={() => setShowSearch(false)}
            onSelectUser={async (userId: Id<"users">) => {
              setShowSearch(false);
              router.push(`/chat/new?userId=${userId}`);
            }}
          />
        ) : showGroup ? (
          <CreateGroup
            currentUserId={user?.id}
            onClose={() => setShowGroup(false)}
          />
        ) : (
          <div className="flex-1 overflow-y-auto">
            {conversations === undefined ? (
              <div className="p-3 space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-xl animate-pulse"
                  >
                    <div className="w-12 h-12 bg-gray-700 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-white"
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
                <p className="font-medium text-gray-300 mb-1">
                  No conversations yet
                </p>
                <p className="text-sm text-gray-400">
                  Click{" "}
                  <button
                    onClick={() => setShowSearch(true)}
                    className="text-blue-500 hover:underline"
                  >
                    +
                  </button>{" "}
                  to start chatting
                </p>
              </div>
            ) : (
              <div className="p-2">
                {conversations.map((convo) => {
                  const name = getConversationName(convo);
                  const avatarUser = getConversationAvatar(convo);
                  const isActive = activeConvId === convo._id;

                  return (
                    <button
                      key={convo._id}
                      onClick={() => router.push(`/chat/${convo._id}`)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl mb-1 transition-all text-left
                        ${isActive ? (darkMode ? "bg-gray-800" : "bg-blue-50") : "hover:bg-gray-700 hover:scale-[1.01]"}
                      `}
                    >
                      <div className="relative flex-shrink-0">
                        {avatarUser?.imageUrl ? (
                          <img
                            src={avatarUser.imageUrl}
                            alt={name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold text-lg">
                            {convo.isGroup ? "G" : name[0]?.toUpperCase()}
                          </div>
                        )}

                        {!convo.isGroup && avatarUser?.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-gray-900"></div>
                        )}

                        {convo.isGroup && (
                          <div className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
                            <svg
                              className="w-2.5 h-2.5 text-white"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className={`font-semibold text-sm truncate ${isActive ? "text-blue-400" : darkMode ? "text-gray-100" : "text-gray-900"}`}
                          >
                            {name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            {convo.lastMessageTime && (
                              <span className="text-xs text-gray-400">
                                {formatTimestamp(convo.lastMessageTime)}
                              </span>
                            )}
                            {convo.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
                                {convo.unreadCount > 99
                                  ? "99+"
                                  : convo.unreadCount}
                              </span>
                            )}
                          </div>
                        </div>
                        <p
                          className={`text-xs truncate ${convo.unreadCount > 0 ? "font-medium text-gray-200" : darkMode ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {convo.lastMessagePreview ?? "Start a conversation"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
