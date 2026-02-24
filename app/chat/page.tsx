export default function ChatIndexPage() {
  return (
    <div className="hidden md:flex flex-col items-center justify-center h-full bg-white">
      <div className="text-center p-8 max-w-sm">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-full mb-6">
          <svg
            className="w-10 h-10 text-blue-500"
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
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
          Your messages
        </h2>
        <p className="text-gray-500 leading-relaxed">
          Select a conversation from the sidebar or find someone new to chat
          with using the search bar.
        </p>
      </div>
    </div>
  );
}
