import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get or create a 1-on-1 conversation
export const getOrCreateDM = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, { otherUserId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

    // Find existing DM
    const allConvos = await ctx.db.query("conversations").collect();
    const existing = allConvos.find(
      (c) =>
        !c.isGroup &&
        c.participants.length === 2 &&
        c.participants.includes(me._id) &&
        c.participants.includes(otherUserId),
    );

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participants: [me._id, otherUserId],
      isGroup: false,
      lastMessageTime: Date.now(),
    });
  },
});

// Create group conversation
export const createGroup = mutation({
  args: {
    memberIds: v.array(v.id("users")),
    groupName: v.string(),
  },
  handler: async (ctx, { memberIds, groupName }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

    const allParticipants = Array.from(new Set([me._id, ...memberIds]));

    return await ctx.db.insert("conversations", {
      participants: allParticipants,
      isGroup: true,
      groupName,
      lastMessageTime: Date.now(),
    });
  },
});

// List conversations for current user
export const listConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (!me) return [];

    const allConvos = await ctx.db
      .query("conversations")
      .order("desc")
      .collect();

    const myConvos = allConvos.filter((c) => c.participants.includes(me._id));

    // Enrich with participant info and unread count
    const enriched = await Promise.all(
      myConvos.map(async (convo) => {
        const participants = await Promise.all(
          convo.participants.map((id) => ctx.db.get(id)),
        );

        // Get unread count
        const readReceipt = await ctx.db
          .query("readReceipts")
          .withIndex("by_conversation_user", (q) =>
            q.eq("conversationId", convo._id).eq("userId", me._id),
          )
          .unique();

        const lastReadTime = readReceipt?.lastReadTime ?? 0;

        // Count messages after lastReadTime not from me
        const messages = await ctx.db
          .query("messages")
          .withIndex("by_conversation", (q) =>
            q.eq("conversationId", convo._id),
          )
          .collect();

        const unreadCount = messages.filter(
          (m) =>
            m._creationTime > lastReadTime &&
            m.senderId !== me._id &&
            !m.isDeleted,
        ).length;

        return {
          ...convo,
          participants: participants.filter(Boolean),
          unreadCount,
          me,
        };
      }),
    );

    return enriched;
  },
});

// Get a single conversation
export const getConversation = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, { conversationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const convo = await ctx.db.get(conversationId);
    if (!convo) return null;

    const participants = await Promise.all(
      convo.participants.map((id) => ctx.db.get(id)),
    );

    const me = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    return {
      ...convo,
      participants: participants.filter(Boolean),
      me,
    };
  },
});
