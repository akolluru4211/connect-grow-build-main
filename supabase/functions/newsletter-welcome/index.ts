/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

import { createStandardResponse, createErrorResponse, corsHeaders } from "../_shared/ai-utils.ts";

interface NewsletterRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Newsletter welcome request received`);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error(`[${requestId}] Missing RESEND_API_KEY`);
      return createErrorResponse("RESEND_API_KEY not configured", 500, requestId);
    }

    const resend = new Resend(RESEND_API_KEY);
    const siteUrl = Deno.env.get("SITE_URL") || "https://edworldco.com";

    const body = await req.json();
    const { email }: NewsletterRequest = body;

    if (!email) {
      console.error(`[${requestId}] Email is required`);
      return createErrorResponse("Email is required", 400, requestId);
    }

    console.log(`[${requestId}] Sending welcome email to: ${email}`);

    const emailResponse = await resend.emails.send({
      from: "EDWORLD CO. <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to EdWorld Newsletter! 🎉",
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://scwliaddydtnadqvkahk.supabase.co/storage/v1/object/public/email-assets/edworld-logo.png" alt="Edworld" style="width: 180px; height: auto;" />
          </div>
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; font-size: 28px; margin: 0;">Welcome to EdWorld! 🎓</h1>
          </div>
          
          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin-bottom: 24px;">
            <h2 style="color: #1e40af; margin: 0 0 12px 0; font-size: 20px;">Thank you for subscribing!</h2>
            <p style="color: #334155; margin: 0; line-height: 1.6;">
              You're now part of our growing community of students and professionals. 
              Get ready to receive exclusive updates on:
            </p>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <span style="font-size: 24px; margin-right: 12px;">💼</span>
              <div>
                <h3 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Latest Job Opportunities</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Fresh job listings tailored for students and recent graduates</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <span style="font-size: 24px; margin-right: 12px;">🎯</span>
              <div>
                <h3 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Exciting Internships</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Top internship programs from leading companies</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start; margin-bottom: 16px;">
              <span style="font-size: 24px; margin-right: 12px;">🏆</span>
              <div>
                <h3 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Hackathons &amp; Events</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Competitions and events to showcase your skills</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: flex-start;">
              <span style="font-size: 24px; margin-right: 12px;">📚</span>
              <div>
                <h3 style="color: #1e293b; margin: 0 0 4px 0; font-size: 16px;">Career Tips &amp; Resources</h3>
                <p style="color: #64748b; margin: 0; font-size: 14px;">Expert advice to accelerate your career growth</p>
              </div>
            </div>
          </div>

          <div style="text-align: center; margin-bottom: 24px;">
            <a href="${siteUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
              Explore EdWorld
            </a>
          </div>

          <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; text-align: center;">
            <p style="color: #94a3b8; font-size: 12px; margin: 0;">
              You're receiving this email because you subscribed to the EdWorld newsletter.<br>
              <a href="${siteUrl}/settings" style="color: #64748b;">Manage your preferences</a>
            </p>
          </div>
        </div>
      `,
    });

    console.log(`[${requestId}] Welcome email sent successfully`, emailResponse);
    return createStandardResponse({ emailResponse }, requestId);
  } catch (error: any) {
    console.error(`[${requestId}] Error sending welcome email:`, error);
    return createErrorResponse(error.message, 500, requestId);
  }
};

serve(handler);

