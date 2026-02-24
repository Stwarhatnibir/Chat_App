"use client";

interface Props {
  users: Array<{ _id: string; name: string; imageUrl?: string }>;
}

export default function TypingIndicator({ users }: Props) {
  if (users.length === 0) return null;

  const firstName = (name: string) => name.split(" ")[0];
  const names =
    users.length === 1
      ? firstName(users[0].name)
      : users.length === 2
        ? `${firstName(users[0].name)} and ${firstName(users[1].name)}`
        : `${firstName(users[0].name)} and ${users.length - 1} others`;

  return (
    <div className="flex items-end gap-2 mb-2">
      {/* Avatar */}
      {users[0]?.imageUrl ? (
        <img
          src={users[0].imageUrl}
          alt={users[0].name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
          {users[0]?.name?.[0]?.toUpperCase()}
        </div>
      )}

      {/* Typing dots */}
      <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-75"></span>
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-150"></span>
        <span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-bounce delay-200"></span>
      </div>

      {/* Text */}
      <span className="text-xs text-gray-400 dark:text-gray-500 mb-1">
        {names} {users.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}
