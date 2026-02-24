"use client";

import { use } from "react";
import ChatWindow from "@/components/ChatWindow";
import { Id } from "@/convex/_generated/dataModel";

export default function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  return <ChatWindow conversationId={conversationId as Id<"conversations">} />;
}
