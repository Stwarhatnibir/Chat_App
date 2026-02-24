import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";

// Get current user's Convex record
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    return user;
  },
});

// Upsert user on login (called from frontend)
export const upsertUser = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("upsertUser called with:", args);
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    console.log("upsertUser - existing user:", existing);

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastSeen: Date.now(),
      });
      console.log("upsertUser - updated existing user:", existing._id);
      return existing._id;
    } else {
      const newId = await ctx.db.insert("users", {
        clerkId: args.clerkId,
        name: args.name,
        email: args.email,
        imageUrl: args.imageUrl,
        isOnline: true,
        lastSeen: Date.now(),
      });
      console.log("upsertUser - created new user:", newId);
      return newId;
    }
  },
});

// Set user online/offline
export const setPresence = mutation({
  args: { isOnline: v.boolean() },
  handler: async (ctx, { isOnline }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();
    if (user) {
      await ctx.db.patch(user._id, {
        isOnline,
        lastSeen: Date.now(),
      });
    }
  },
});

// List all users except the current one
export const listUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, { search }) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("listUsers - identity:", identity?.subject);
    if (!identity) return [];

    const allUsers = await ctx.db.query("users").collect();
    console.log("listUsers - all users count:", allUsers.length);
    console.log("listUsers - all users:", allUsers);
    const others = allUsers.filter((u) => u.clerkId !== identity.subject);
    console.log("listUsers - others count:", others.length);

    if (search && search.trim()) {
      const lower = search.toLowerCase();
      return others.filter((u) => u.name.toLowerCase().includes(lower));
    }

    return others;
  },
});

// Get user by ID
export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return await ctx.db.get(userId);
  },
});

// Internal mutation for webhook sync
export const syncFromWebhook = internalMutation({
  args: {
    payloadString: v.string(),
    svixId: v.string(),
    svixTimestamp: v.string(),
    svixSignature: v.string(),
  },
  handler: async (ctx, args) => {
    // In production, verify the Svix signature here
    const payload = JSON.parse(args.payloadString);
    const { type, data } = payload;

    if (type === "user.created" || type === "user.updated") {
      const clerkId = data.id;
      const name =
        `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() ||
        data.username ||
        "Unknown";
      const email = data.email_addresses?.[0]?.email_address ?? "";
      const imageUrl = data.image_url;

      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, { name, email, imageUrl });
      } else {
        await ctx.db.insert("users", {
          clerkId,
          name,
          email,
          imageUrl,
          isOnline: false,
          lastSeen: Date.now(),
        });
      }
    } else if (type === "user.deleted") {
      const existing = await ctx.db
        .query("users")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", data.id))
        .unique();
      if (existing) {
        await ctx.db.delete(existing._id);
      }
    }

    return { success: true };
  },
});
