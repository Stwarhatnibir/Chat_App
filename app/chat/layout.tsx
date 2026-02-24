"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Sidebar from "@/components/Sidebar";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoaded } = useUser();
  const upsertUser = useMutation(api.users.upsertUser);
  const setPresence = useMutation(api.users.setPresence);

  // Sync user to Convex on login
  useEffect(() => {
    if (user && isLoaded) {
      upsertUser({
        clerkId: user.id,
        name: user.fullName ?? user.username ?? "Unknown",
        email: user.primaryEmailAddress?.emailAddress ?? "",
        imageUrl: user.imageUrl,
      });
    }
  }, [user, isLoaded, upsertUser]);

  // Online/offline presence
  useEffect(() => {
    if (!user) return;

    setPresence({ isOnline: true });

    const handleVisibilityChange = () => {
      setPresence({ isOnline: !document.hidden });
    };

    const handleBeforeUnload = () => {
      setPresence({ isOnline: false });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Heartbeat every 30s
    const interval = setInterval(() => {
      if (!document.hidden) {
        setPresence({ isOnline: true });
      }
    }, 30000);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(interval);
      setPresence({ isOnline: false });
    };
  }, [user, setPresence]);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
