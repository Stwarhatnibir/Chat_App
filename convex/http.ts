import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

const http = httpRouter();

// Clerk webhook to sync users
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const payloadString = await request.text();
    const headerPayload = request.headers;

    try {
      const result = await ctx.runMutation(internal.users.syncFromWebhook, {
        payloadString,
        svixId: headerPayload.get("svix-id") ?? "",
        svixTimestamp: headerPayload.get("svix-timestamp") ?? "",
        svixSignature: headerPayload.get("svix-signature") ?? "",
      });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response("Webhook Error", { status: 400 });
    }
  }),
});

export default http;
