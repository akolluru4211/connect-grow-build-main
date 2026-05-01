/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createStandardResponse, createErrorResponse, corsHeaders } from "../_shared/ai-utils.ts";

const handler = async (req: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Activate subscription request received`);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error(`[${requestId}] Unauthorized: No auth header`);
      return createErrorResponse("Unauthorized", 401, requestId);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error(`[${requestId}] Invalid token`, authError);
      return createErrorResponse("Invalid token", 401, requestId);
    }

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, plan_tier, billing_cycle, amount: paymentAmount } = body;

    if (!razorpay_payment_id) {
      console.error(`[${requestId}] Missing payment ID`);
      return createErrorResponse("Missing payment ID", 400, requestId);
    }

    // Find the plan
    const targetTier = plan_tier || "pro";
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("tier", targetTier)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      console.error(`[${requestId}] Plan not found for tier: ${targetTier}`, planError);
      return createErrorResponse("Plan not found", 404, requestId);
    }

    // Auto-detect billing cycle based on payment amount
    // ₹49 = monthly, ₹499 = yearly
    let cycle = billing_cycle || "monthly";
    if (paymentAmount) {
      const numAmount = parseFloat(String(paymentAmount).replace(/[₹,]/g, ""));
      if (numAmount >= 499) {
        cycle = "yearly";
      } else {
        cycle = "monthly";
      }
    }

    const periodDays = cycle === "yearly" ? 365 : 30;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

    console.log(`[${requestId}] Activating ${cycle} plan for user ${user.id}`);

    // Deactivate any existing active subscriptions
    await supabase
      .from("user_subscriptions")
      .update({ status: "cancelled", cancelled_at: now.toISOString() })
      .eq("user_id", user.id)
      .eq("status", "active");

    // Create new subscription
    const { data: subscription, error: subError } = await supabase
      .from("user_subscriptions")
      .insert({
        user_id: user.id,
        plan_id: plan.id,
        status: "active",
        billing_cycle: cycle,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        razorpay_payment_id,
        razorpay_order_id: razorpay_order_id || null,
      })
      .select()
      .single();

    if (subError) {
      console.error(`[${requestId}] Failed to activate subscription`, subError);
      return createErrorResponse("Failed to activate subscription", 500, requestId);
    }

    // Record payment
    const amount = cycle === "yearly" ? plan.price_yearly : plan.price_monthly;
    await supabase.from("payment_history").insert({
      user_id: user.id,
      subscription_id: subscription.id,
      amount,
      currency: plan.currency,
      status: "completed",
      razorpay_payment_id,
      razorpay_order_id: razorpay_order_id || null,
      payment_method: "razorpay",
    });

    // Send notification with plan details
    const cycleName = cycle === "yearly" ? "Yearly" : "Monthly";
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "system",
      title: "🎉 EdWorld Pro Activated!",
      message: `Your EdWorld Pro ${cycleName} plan is now active (${user.email}). Enjoy all EdWorld Pro features!`,
      link: "/pricing",
    });

    console.log(`[${requestId}] Subscription activated successfully`);
    return createStandardResponse({ subscription }, requestId);
  } catch (error) {
    console.error(`[${requestId}] Catch block error:`, error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return createErrorResponse(errorMessage, 500, requestId);
  }
};

serve(handler);


