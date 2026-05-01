import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, createStandardResponse, createErrorResponse } from "../_shared/ai-utils.ts";

interface NotificationRequest {
  type: "new_message" | "job_match" | "connection_request" | "connection_accepted" | "application_status" | "job_application" | "mentorship_request" | "achievement_unlocked" | "general_notification";
  recipientId: string;
  data: Record<string, any>;
}

const logoUrl = "https://scwliaddydtnadqvkahk.supabase.co/storage/v1/object/public/email-assets/edworld-logo.png";

const emailHeader = `
  <div style="text-align: center; padding: 24px 0 16px 0;">
    <img src="${logoUrl}" alt="Edworld" style="width: 180px; height: auto;" />
  </div>
`;

const getEmailContent = (type: string, data: Record<string, any>, siteUrl: string) => {
  switch (type) {
    case "new_message":
      return {
        subject: `New message from ${data.senderName || "Someone"}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <h2 style="color: #2563eb;">You have a new message!</h2>
            <p><strong>${data.senderName || "Someone"}</strong> sent you a message:</p>
            <div style="background: #f4f4f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0; color: #52525b;">"${(data.messagePreview || "").substring(0, 100)}"</p>
            </div>
            <a href="${siteUrl}/messages" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Message
            </a>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p>
          </div>
        `,
      };

    case "general_notification":
      return {
        subject: data.title || "Notification from EdWorld",
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <h2 style="color: #2563eb;">${data.title || "New Notification"}</h2>
            <p style="color: #3f3f46; font-size: 16px;">${data.message || ""}</p>
            ${data.link ? `
            <a href="${siteUrl}${data.link}" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              View Details
            </a>` : ""}
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p>
          </div>
        `,
      };

    case "job_match":
      return {
        subject: `New job match: ${data.jobTitle} at ${data.companyName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <h2 style="color: #2563eb;">Great news! We found a job match for you</h2>
            <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 16px 0;">
              <h3 style="margin: 0 0 8px 0;">${data.jobTitle}</h3>
              <p style="margin: 0 0 8px 0; color: #52525b;">${data.companyName}</p>
              <p style="margin: 0; color: #16a34a; font-weight: bold;">${data.matchScore}% Match</p>
            </div>
            <a href="${siteUrl}/job-recommendations" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Job
            </a>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p>
          </div>
        `,
      };

    case "connection_request":
      return {
        subject: `${data.requesterName} wants to connect with you`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <h2 style="color: #2563eb;">New Connection Request</h2>
            <p><strong>${data.requesterName}</strong> would like to connect with you on EdWorld.</p>
            <a href="${siteUrl}/network" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Request
            </a>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p>
          </div>
        `,
      };

    case "connection_accepted":
      return {
        subject: `${data.accepterName} accepted your connection request!`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <h2 style="color: #2563eb;">Connection Accepted! 🎉</h2>
            <p>Great news! <strong>${data.accepterName}</strong> accepted your connection request on EdWorld.</p>
            <p style="color: #52525b;">You can now message each other and stay in touch.</p>
            <a href="${siteUrl}/network" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">
              View Connection
            </a>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p>
          </div>
        `,
      };

    case "application_status":
      return {
        subject: `Update on your application for ${data.jobTitle}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <h2 style="color: #2563eb;">Application Update</h2>
            <p>Your application for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been updated.</p>
            <p>New status: <strong style="color: ${data.status === "accepted" ? "#16a34a" : data.status === "rejected" ? "#dc2626" : "#ca8a04"}">${data.status}</strong></p>
            <a href="${siteUrl}/jobs" 
               style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">
              View Applications
            </a>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p>
          </div>
        `,
      };

    case "achievement_unlocked":
      return {
        subject: `🏆 Achievement Unlocked: ${data.achievementName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            ${emailHeader}
            <div style="text-align: center; padding: 20px;">
              <div style="font-size: 64px;">${data.icon || "🏆"}</div>
            </div>
            <h2 style="color: #2563eb; text-align: center;">Congratulations! 🎉</h2>
            <p style="text-align: center; font-size: 18px;">You've unlocked a new achievement!</p>
            <div style="background: linear-gradient(135deg, #f4f4f5 0%, #e4e4e7 100%); padding: 24px; border-radius: 12px; margin: 20px 0; text-align: center;">
              <h3 style="margin: 0 0 8px 0; color: #18181b; font-size: 22px;">${data.achievementName}</h3>
              <p style="margin: 0 0 12px 0; color: #52525b;">${data.description}</p>
              <p style="margin: 0; color: #16a34a; font-weight: bold;">+${data.points} points</p>
            </div>
            <div style="text-align: center;">
              <a href="${siteUrl}/achievements" 
                 style="display: inline-block; background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 500;">
                View All Achievements
              </a>
            </div>
            <p style="color: #a1a1aa; font-size: 12px; margin-top: 24px; text-align: center;">— EDWORLD CO.</p>
          </div>
        `,
      };

    default:
      return {
        subject: "Notification from EdWorld",
        html: `<div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">${emailHeader}<p>You have a new notification on EdWorld.</p><p style="color: #a1a1aa; font-size: 12px; margin-top: 24px;">— EDWORLD CO.</p></div>`,
      };
  }
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting send-notification request`);

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return createErrorResponse("RESEND_API_KEY not configured", 500, requestId);
    }

    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = Deno.env.get("SITE_URL") || "https://edworldco.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const isInternalCall = req.headers.get("x-internal-secret") === supabaseServiceKey;

    if (!isInternalCall) {
      if (!authHeader?.startsWith("Bearer ")) {
        return createErrorResponse("Unauthorized", 401, requestId);
      }

      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });

      const token = authHeader.replace("Bearer ", "");
      const { data: userData, error: authError } = await authClient.auth.getUser(token);

      if (authError || !userData?.user) {
        console.error(`[${requestId}] Auth validation failed:`, authError);
        return createErrorResponse("Unauthorized", 401, requestId);
      }
      console.log(`[${requestId}] Authenticated user:`, userData.user.id);
    } else {
      console.log(`[${requestId}] Internal trigger call`);
    }

    const { type, recipientId, data }: NotificationRequest = await req.json();
    console.log(`[${requestId}] Processing notification:`, { type, recipientId, data });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", recipientId)
      .single();

    if (profileError || !profile?.email) {
      console.error(`[${requestId}] Failed to get recipient profile:`, profileError);
      return createErrorResponse("Recipient not found or no email", 404, requestId);
    }

    const { data: settings } = await supabase
      .from("user_settings")
      .select("email_notifications, message_notifications, job_alerts")
      .eq("user_id", recipientId)
      .single();

    if (settings) {
      if (type === "new_message" && settings.message_notifications === false) {
        console.log(`[${requestId}] User has disabled message notifications`);
        return createStandardResponse({ skipped: true, reason: "message_notifications_disabled" }, requestId);
      }
      if ((type === "job_match" || type === "application_status") && settings.job_alerts === false) {
        console.log(`[${requestId}] User has disabled job alerts`);
        return createStandardResponse({ skipped: true, reason: "job_alerts_disabled" }, requestId);
      }
      if (settings.email_notifications === false) {
        console.log(`[${requestId}] User has disabled all email notifications`);
        return createStandardResponse({ skipped: true, reason: "all_email_notifications_disabled" }, requestId);
      }
    }

    const emailContent = getEmailContent(type, data, siteUrl);

    // Track notification in DB
    await supabase.from("email_notifications").insert({
      user_id: recipientId,
      email_type: type,
      recipient_email: profile.email,
      subject: emailContent.subject,
      status: "pending",
      metadata: { ...data, requestId },
    });

    const emailResponse = await resend.emails.send({
      from: "EDWORLD CO. <onboarding@resend.dev>",
      to: [profile.email],
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`[${requestId}] Email sent:`, emailResponse);

    await supabase
      .from("email_notifications")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("user_id", recipientId)
      .eq("email_type", type)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(1);

    return createStandardResponse({ success: true, emailResponse }, requestId);
  } catch (error: any) {
    console.error(`[${requestId}] Error in send-notification:`, error);
    return createErrorResponse(error, 500, requestId);
  }
});
