// @ts-nocheck
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logoUrl = "https://scwliaddydtnadqvkahk.supabase.co/storage/v1/object/public/email-assets/edworld-logo.png";

const buildCustomEmailHTML = (
  userName: string,
  subject: string,
  body: string,
  ctaText: string,
  ctaLink: string,
  siteUrl: string,
) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 32px; text-align: center;">
      <img src="${logoUrl}" alt="Edworld" style="width: 140px; height: auto; margin-bottom: 12px;" />
      <h1 style="color: #ffffff; font-size: 22px; margin: 0; font-weight: 700;">${subject}</h1>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 16px; color: #18181b; margin: 0 0 16px 0;">Hi ${userName || "there"} 👋,</p>
      <div style="font-size: 15px; color: #3f3f46; line-height: 1.7; white-space: pre-wrap;">${body}</div>
    </div>
    ${ctaText ? `
    <div style="padding: 0 32px 32px 32px; text-align: center;">
      <a href="${ctaLink || siteUrl + '/dashboard'}" 
         style="display: inline-block; background: linear-gradient(135deg, #2563eb, #7c3aed); color: #ffffff; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 600;">
        ${ctaText}
      </a>
    </div>` : ""}
    <div style="padding: 20px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
      <p style="font-size: 12px; color: #a1a1aa; margin: 0;">
        © ${new Date().getFullYear()} EDWORLD CO. — Empowering students, one feature at a time.
      </p>
    </div>
  </div>
</body>
</html>
`;

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured. Missing RESEND_API_KEY." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = Deno.env.get("SITE_URL") || "https://edworldco.com";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: roleData } = await supabase
      .from("user_roles").select("role")
      .eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { subject, messageBody, ctaText, ctaLink, sendTo } = body;

    if (!subject || !messageBody) {
      return new Response(JSON.stringify({ error: "Subject and message body are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let recipients: { id: string; email: string; full_name: string | null }[] = [];

    if (sendTo === "specific" && body.recipientEmails?.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles").select("id, email, full_name")
        .in("email", body.recipientEmails);
      recipients = (profiles || []).filter((p: any) => p.email);
    } else {
      const { data: profiles } = await supabase
        .from("profiles").select("id, email, full_name");
      recipients = (profiles || []).filter((p: any) => p.email);
    }

    console.log(`Sending custom email to ${recipients.length} recipients`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10);
      const results = await Promise.allSettled(
        batch.map(async (profile: any) => {
          if (sendTo !== "specific") {
            const { data: settings } = await supabase
              .from("user_settings").select("email_notifications")
              .eq("user_id", profile.id).maybeSingle();
            if (settings?.email_notifications === false) {
              return { skipped: true };
            }
          }

          const emailResponse = await resend.emails.send({
            from: "EDWORLD CO. <onboarding@resend.dev>",
            to: [profile.email!],
            subject,
            html: buildCustomEmailHTML(
              profile.full_name || "",
              subject,
              messageBody,
              ctaText || "",
              ctaLink || "",
              siteUrl,
            ),
          });

          await supabase.from("email_notifications").insert({
            user_id: profile.id,
            email_type: "custom_message",
            recipient_email: profile.email!,
            subject,
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          return { sent: true, emailResponse };
        })
      );

      results.forEach((r: any, idx: number) => {
        if (r.status === "fulfilled" && (r.value as any)?.sent) {
          sent++;
        } else if (r.status === "rejected") {
          failed++;
          errors.push(`${batch[idx].email}: ${r.reason}`);
        }
      });

      if (i + 10 < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Custom email: ${sent} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: recipients.length, errors: errors.slice(0, 5) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in custom-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);
