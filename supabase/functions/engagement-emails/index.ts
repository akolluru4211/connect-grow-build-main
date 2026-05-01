/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

const logoUrl = "https://scwliaddydtnadqvkahk.supabase.co/storage/v1/object/public/email-assets/edworld-logo.png";
const siteUrl = Deno.env.get("SITE_URL") || "https://edworldco.com";

const emailHeader = `
  <div style="text-align: center; padding: 24px 0 16px 0;">
    <img src="${logoUrl}" alt="Edworld" style="width: 180px; height: auto;" />
  </div>
`;

const emailFooter = `
  <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e4e4e7;">
    <p style="color: #a1a1aa; font-size: 11px;">You're receiving this because you have an account on EdWorld.</p>
    <p style="color: #a1a1aa; font-size: 11px;">To manage notifications, visit <a href="${siteUrl}/settings" style="color: #2563eb;">Settings</a>.</p>
    <p style="color: #a1a1aa; font-size: 12px; margin-top: 8px;">— EDWORLD CO.</p>
  </div>
`;

function buildInactivityEmail(name: string): { subject: string; html: string } {
  return {
    subject: `We miss you, ${name || "friend"}! 🚀 Come back to EdWorld`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        ${emailHeader}
        <div style="padding: 0 24px;">
          <h2 style="color: #2563eb;">Hey ${name || "there"}, we miss you! 👋</h2>
          <p style="color: #3f3f46; font-size: 16px; line-height: 1.6;">
            It's been a while since you visited EdWorld. Here's what you might be missing:
          </p>
          <ul style="color: #52525b; line-height: 2;">
            <li>🎯 New jobs & internships from top companies</li>
            <li>📚 Fresh courses and study resources</li>
            <li>🤝 Connection requests waiting for you</li>
            <li>🤖 Free AI tools for resume, interviews & career guidance</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/dashboard"
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Come Back & Explore
            </a>
          </div>
        </div>
        ${emailFooter}
      </div>
    `,
  };
}

function buildUnreadMessagesEmail(name: string, unreadCount: number): { subject: string; html: string } {
  return {
    subject: `You have ${unreadCount} unread message${unreadCount > 1 ? "s" : ""} on EdWorld`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        ${emailHeader}
        <div style="padding: 0 24px;">
          <h2 style="color: #2563eb;">You have unread messages! 💬</h2>
          <p style="color: #3f3f46; font-size: 16px;">
            Hey ${name || "there"}, you have <strong>${unreadCount}</strong> unread message${unreadCount > 1 ? "s" : ""} waiting for you.
          </p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/messages"
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Read Messages
            </a>
          </div>
        </div>
        ${emailFooter}
      </div>
    `,
  };
}

function buildNewBlogPostEmail(name: string, posts: { title: string; slug: string; authorName: string }[]): { subject: string; html: string } {
  const postItems = posts.map(p => `
    <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin-bottom: 12px;">
      <h3 style="margin: 0 0 4px 0; font-size: 16px;"><a href="${siteUrl}/blogs/${p.slug}" style="color: #18181b; text-decoration: none;">${p.title}</a></h3>
      <p style="margin: 0; color: #71717a; font-size: 13px;">by ${p.authorName}</p>
    </div>
  `).join("");

  return {
    subject: `${posts.length} new blog post${posts.length > 1 ? "s" : ""} from people you follow`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        ${emailHeader}
        <div style="padding: 0 24px;">
          <h2 style="color: #2563eb;">New posts from your network 📝</h2>
          <p style="color: #3f3f46; font-size: 16px;">Hey ${name || "there"}, people you follow published new content:</p>
          ${postItems}
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/blogs"
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Read All Posts
            </a>
          </div>
        </div>
        ${emailFooter}
      </div>
    `,
  };
}

function buildConnectionRequestEmail(name: string, pendingCount: number): { subject: string; html: string } {
  return {
    subject: `You have ${pendingCount} pending connection request${pendingCount > 1 ? "s" : ""} on EdWorld`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
        ${emailHeader}
        <div style="padding: 0 24px;">
          <h2 style="color: #2563eb;">People want to connect with you! 🤝</h2>
          <p style="color: #3f3f46; font-size: 16px;">
            Hey ${name || "there"}, you have <strong>${pendingCount}</strong> pending connection request${pendingCount > 1 ? "s" : ""}.
          </p>
          <p style="color: #52525b;">Grow your network — accept requests and connect with fellow students and professionals.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${siteUrl}/network"
               style="display: inline-block; background: #2563eb; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              View Requests
            </a>
          </div>
        </div>
        ${emailFooter}
      </div>
    `,
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting engagement-emails task`);

  try {
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const isInternalCall = req.headers.get("x-internal-secret") === supabaseServiceKey;

    if (!isInternalCall) {
      console.warn(`[${requestId}] Unauthorized attempt to trigger engagement emails`);
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneDayAgoISO = oneDayAgo.toISOString();

    let totalSent = 0;
    const errors: string[] = [];

    // ─── 1. INACTIVITY REMINDER ───
    // Find users with no daily_activity_log entry in the last 24h
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .not("email", "is", null);

    if (allProfiles) {
      for (const profile of allProfiles) {
        // Check if already sent inactivity email in last 24h
        const { data: recentEmail } = await supabase
          .from("engagement_emails_log")
          .select("id")
          .eq("user_id", profile.id)
          .eq("email_type", "inactivity")
          .gte("created_at", oneDayAgoISO)
          .limit(1);

        if (recentEmail && recentEmail.length > 0) continue;

        // Check if user was active in last 24h
        const { data: recentActivity } = await supabase
          .from("daily_activity_log")
          .select("id")
          .eq("user_id", profile.id)
          .gte("created_at", oneDayAgoISO)
          .limit(1);

        if (recentActivity && recentActivity.length > 0) continue;

        // Check user email notification settings
        const { data: settings } = await supabase
          .from("user_settings")
          .select("email_notifications")
          .eq("user_id", profile.id)
          .single();

        if (settings?.email_notifications === false) continue;

        try {
          const email = buildInactivityEmail(profile.full_name || "");
          await resend.emails.send({
            from: "EDWORLD CO. <onboarding@resend.dev>",
            to: [profile.email!],
            subject: email.subject,
            html: email.html,
          });
          await supabase.from("engagement_emails_log").insert({
            user_id: profile.id,
            email_type: "inactivity",
          });
          totalSent++;
        } catch (e: any) {
          errors.push(`inactivity:${profile.id}:${e.message}`);
        }
      }
    }

    // ─── 2. UNREAD MESSAGES DIGEST ───
    const { data: unreadMessages } = await supabase
      .from("messages")
      .select("conversation_id, sender_id, conversations!inner(participant_1, participant_2)")
      .eq("is_read", false)
      .gte("created_at", oneDayAgoISO);

    if (unreadMessages) {
      // Group by recipient
      const recipientUnread: Record<string, number> = {};
      for (const msg of unreadMessages) {
        const conv = msg.conversations as any;
        const recipientId = conv.participant_1 === msg.sender_id ? conv.participant_2 : conv.participant_1;
        recipientUnread[recipientId] = (recipientUnread[recipientId] || 0) + 1;
      }

      for (const [userId, count] of Object.entries(recipientUnread)) {
        // Already sent?
        const { data: recentEmail } = await supabase
          .from("engagement_emails_log")
          .select("id")
          .eq("user_id", userId)
          .eq("email_type", "unread_messages")
          .gte("created_at", oneDayAgoISO)
          .limit(1);

        if (recentEmail && recentEmail.length > 0) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", userId)
          .single();

        if (!profile?.email) continue;

        const { data: settings } = await supabase
          .from("user_settings")
          .select("email_notifications, message_notifications")
          .eq("user_id", userId)
          .single();

        if (settings?.email_notifications === false || settings?.message_notifications === false) continue;

        try {
          const email = buildUnreadMessagesEmail(profile.full_name || "", count);
          await resend.emails.send({
            from: "EDWORLD CO. <onboarding@resend.dev>",
            to: [profile.email],
            subject: email.subject,
            html: email.html,
          });
          await supabase.from("engagement_emails_log").insert({
            user_id: userId,
            email_type: "unread_messages",
          });
          totalSent++;
        } catch (e: any) {
          errors.push(`unread:${userId}:${e.message}`);
        }
      }
    }

    // ─── 3. NEW BLOG POSTS FROM FOLLOWED USERS ───
    const { data: recentPosts } = await supabase
      .from("blog_posts")
      .select("id, title, slug, author_id, profiles!inner(full_name)")
      .eq("is_published", true)
      .gte("created_at", oneDayAgoISO);

    if (recentPosts && recentPosts.length > 0) {
      // Get all followers of these authors
      const authorIds = [...new Set(recentPosts.map((p: any) => p.author_id))];

      const { data: follows } = await supabase
        .from("user_follows")
        .select("follower_id, following_id")
        .in("following_id", authorIds);

      if (follows) {
        // Group posts by follower
        const followerPosts: Record<string, { title: string; slug: string; authorName: string }[]> = {};
        for (const follow of follows) {
          const postsFromAuthor = recentPosts.filter((p: any) => p.author_id === follow.following_id);
          if (!followerPosts[follow.follower_id]) followerPosts[follow.follower_id] = [];
          for (const post of postsFromAuthor) {
            followerPosts[follow.follower_id].push({
              title: post.title,
              slug: post.slug,
              authorName: (post.profiles as any)?.full_name || "Someone",
            });
          }
        }

        for (const [followerId, posts] of Object.entries(followerPosts)) {
          const { data: recentEmail } = await supabase
            .from("engagement_emails_log")
            .select("id")
            .eq("user_id", followerId)
            .eq("email_type", "new_blog_posts")
            .gte("created_at", oneDayAgoISO)
            .limit(1);

          if (recentEmail && recentEmail.length > 0) continue;

          const { data: profile } = await supabase
            .from("profiles")
            .select("email, full_name")
            .eq("id", followerId)
            .single();

          if (!profile?.email) continue;

          const { data: settings } = await supabase
            .from("user_settings")
            .select("email_notifications")
            .eq("user_id", followerId)
            .single();

          if (settings?.email_notifications === false) continue;

          try {
            const email = buildNewBlogPostEmail(profile.full_name || "", posts);
            await resend.emails.send({
              from: "EDWORLD CO. <onboarding@resend.dev>",
              to: [profile.email],
              subject: email.subject,
              html: email.html,
            });
            await supabase.from("engagement_emails_log").insert({
              user_id: followerId,
              email_type: "new_blog_posts",
            });
            totalSent++;
          } catch (e: any) {
            errors.push(`blog:${followerId}:${e.message}`);
          }
        }
      }
    }

    // ─── 4. PENDING CONNECTION REQUESTS ───
    const { data: pendingConnections } = await supabase
      .from("connections")
      .select("receiver_id")
      .eq("status", "pending")
      .gte("created_at", oneDayAgoISO);

    if (pendingConnections) {
      const receiverCounts: Record<string, number> = {};
      for (const conn of pendingConnections) {
        receiverCounts[conn.receiver_id] = (receiverCounts[conn.receiver_id] || 0) + 1;
      }

      for (const [receiverId, count] of Object.entries(receiverCounts)) {
        const { data: recentEmail } = await supabase
          .from("engagement_emails_log")
          .select("id")
          .eq("user_id", receiverId)
          .eq("email_type", "pending_connections")
          .gte("created_at", oneDayAgoISO)
          .limit(1);

        if (recentEmail && recentEmail.length > 0) continue;

        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", receiverId)
          .single();

        if (!profile?.email) continue;

        const { data: settings } = await supabase
          .from("user_settings")
          .select("email_notifications")
          .eq("user_id", receiverId)
          .single();

        if (settings?.email_notifications === false) continue;

        try {
          const email = buildConnectionRequestEmail(profile.full_name || "", count);
          await resend.emails.send({
            from: "EDWORLD CO. <onboarding@resend.dev>",
            to: [profile.email],
            subject: email.subject,
            html: email.html,
          });
          await supabase.from("engagement_emails_log").insert({
            user_id: receiverId,
            email_type: "pending_connections",
          });
          totalSent++;
        } catch (e: any) {
          errors.push(`connections:${receiverId}:${e.message}`);
        }
      }
    }

    console.log(`[${requestId}] Engagement emails completed: ${totalSent} sent, ${errors.length} errors`);
    if (errors.length > 0) console.error(`[${requestId}] Errors:`, errors.slice(0, 10));

    return createStandardResponse({ totalSent, errors: errors.length }, requestId);
  } catch (error: any) {
    console.error(`[${requestId}] Error in engagement-emails:`, error);
    return createErrorResponse(
      error instanceof Error ? error.message : String(error),
      500,
      requestId,
      true,
      error instanceof Error ? error.stack : undefined
    );
  }
};

serve(handler);
