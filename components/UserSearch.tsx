"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  currentUserId?: string;
  onClose: () => void;
  onSelectUser: (userId: Id<"users">) => void;
}

export default function UserSearch({ onClose }: Props) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const getOrCreateDM = useMutation(api.conversations.getOrCreateDM);

  const users = useQuery(api.users.listUsers, { search: search || undefined });

  const handleSelectUser = async (userId: Id<"users">) => {
    try {
      const convId = await getOrCreateDM({ otherUserId: userId });
      router.push(`/chat/${convId}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border-b border-gray-700 shadow-sm">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-700 rounded-lg transition"
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

        <div className="flex-1 relative">
          <input
            autoFocus
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search people..."
            className="w-full pl-9 pr-4 py-2 bg-gray-700 text-gray-100 placeholder-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
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

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2">
        {users === undefined ? (
          <div className="space-y-2 p-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 animate-pulse"
              >
                <div className="w-10 h-10 bg-gray-700 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-28" />
                  <div className="h-3 bg-gray-700 rounded w-40" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center mb-3 border border-gray-700">
              <svg
                className="w-7 h-7 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <p className="text-gray-200 font-medium">No users found</p>
            <p className="text-gray-400 text-sm mt-1">
              {search ? `No results for "${search}"` : "No other users yet"}
            </p>
          </div>
        ) : (
          users.map((u) => (
            <button
              key={u._id}
              onClick={() => handleSelectUser(u._id)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition text-left hover:bg-gray-800"
            >
              <div className="relative flex-shrink-0">
                {u.imageUrl ? (
                  <img
                    src={u.imageUrl}
                    alt={u.name}
                    className="w-11 h-11 rounded-full object-cover border border-gray-700"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                    {u.name[0]?.toUpperCase()}
                  </div>
                )}
                {u.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-100 text-sm truncate">
                  {u.name}
                </p>
                <p className="text-xs text-gray-400 truncate">{u.email}</p>
              </div>

              <div className="ml-auto text-xs font-medium">
                {u.isOnline ? (
                  <span className="text-green-400">Online</span>
                ) : (
                  <span className="text-gray-500">Offline</span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
