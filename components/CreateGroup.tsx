"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Props {
  currentUserId?: string;
  onClose: () => void;
}

export default function CreateGroup({ onClose }: Props) {
  const [groupName, setGroupName] = useState("");
  const [selected, setSelected] = useState<Id<"users">[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const users = useQuery(api.users.listUsers, { search: search || undefined });
  const createGroup = useMutation(api.conversations.createGroup);

  const toggleUser = (id: Id<"users">) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selected.length < 1) return;
    try {
      const convId = await createGroup({
        memberIds: selected,
        groupName: groupName.trim(),
      });
      router.push(`/chat/${convId}`);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-900 text-gray-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 shadow-md">
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
        <span className="font-semibold text-gray-100">New Group</span>
      </div>

      {/* Group name input */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <input
          autoFocus
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name..."
          className="w-full px-3 py-2 bg-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors shadow-sm"
        />
      </div>

      {/* Selected users */}
      {selected.length > 0 && (
        <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
          <p className="text-xs text-gray-400 mb-2">
            {selected.length} selected
          </p>
        </div>
      )}

      {/* Search input */}
      <div className="px-4 py-3 bg-gray-800 border-b border-gray-700">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Add members..."
          className="w-full pl-9 pr-4 py-2 bg-gray-700 rounded-xl text-sm text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
        />
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto p-2">
        {users?.map((u) => (
          <button
            key={u._id}
            onClick={() => toggleUser(u._id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
              selected.includes(u._id) ? "bg-purple-700" : "hover:bg-gray-800"
            }`}
          >
            <div className="relative flex-shrink-0">
              {u.imageUrl ? (
                <img
                  src={u.imageUrl}
                  alt={u.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                  {u.name[0]?.toUpperCase()}
                </div>
              )}
              {selected.includes(u._id) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center shadow-md">
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-100 text-sm">{u.name}</p>
              <p className="text-xs text-gray-400">
                {u.isOnline ? "Online" : "Offline"}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* Create button */}
      <div className="p-4 bg-gray-800 border-t border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.3)]">
        <button
          onClick={handleCreate}
          disabled={!groupName.trim() || selected.length < 1}
          className="w-full py-2.5 bg-purple-600 text-white rounded-xl font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition-colors"
        >
          Create another group ({selected.length} members)
        </button>
      </div>
    </div>
  );
}
