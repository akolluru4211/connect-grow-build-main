/// <reference lib="deno.ns" />
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/ai-utils.ts";

const handler = async (req: Request): Promise<Response> => {
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { razorpay_payment_id, razorpay_order_id, plan_tier, billing_cycle, amount: paymentAmount } = await req.json();

    if (!razorpay_payment_id) {
      return new Response(JSON.stringify({ error: "Missing payment ID" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Plan not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Failed to activate subscription" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    return new Response(
      JSON.stringify({ success: true, subscription }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);

