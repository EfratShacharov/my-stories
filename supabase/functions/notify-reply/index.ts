// @ts-nocheck

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders, status: 200 });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const SITE_URL = Deno.env.get("SITE_URL") ?? "http://localhost:3000";
  const SUPABASE_URL = Deno.env.get("MY_SUPABASE_URL") ?? Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("MY_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const EMAILJS_SERVICE_ID = Deno.env.get("EMAILJS_SERVICE_ID");
  const EMAILJS_TEMPLATE_ID = Deno.env.get("EMAILJS_TEMPLATE_ID");
  const EMAILJS_PUBLIC_KEY = Deno.env.get("EMAILJS_PUBLIC_KEY") ?? Deno.env.get("EMAILJS_USER_ID");
  const EMAILJS_PRIVATE_KEY = Deno.env.get("EMAILJS_PRIVATE_KEY") ?? Deno.env.get("EMAILJS_ACCESS_TOKEN");
  const SEND_EMAILS = Deno.env.get("SEND_EMAILS") === "true";

  console.log("env check:", {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY,
    EMAILJS_SERVICE_ID: !!EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID: !!EMAILJS_TEMPLATE_ID,
    EMAILJS_PUBLIC_KEY: !!EMAILJS_PUBLIC_KEY,
    EMAILJS_PRIVATE_KEY: !!EMAILJS_PRIVATE_KEY,
  });

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
    return new Response("Missing env vars", { status: 500, headers: corsHeaders });
  }

  const { comment_id } = await req.json();
  if (!comment_id) {
    return new Response("Missing comment_id", { status: 400, headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: newComment, error: e1 } = await supabase
    .from("comments").select("*").eq("id", comment_id).maybeSingle();

  console.log("newComment:", JSON.stringify(newComment));
  if (e1 || !newComment) {
    console.log("Comment not found", e1);
    return new Response("Comment not found", { status: 404, headers: corsHeaders });
  }

  if (!newComment.parent_id) { console.log("No parent_id — skipping"); return new Response("No parent_id", { status: 200 }); }

  const { data: parentComment, error: e2 } = await supabase
    .from("comments").select("*").eq("id", newComment.parent_id).maybeSingle();

  console.log("parentComment:", JSON.stringify(parentComment));
  if (e2 || !parentComment) {
    console.log("Parent not found", e2);
    return new Response("Parent not found", { status: 404, headers: corsHeaders });
  }

  if (!parentComment.email_updates) {
    console.log("email_updates not set — skipping");
    return new Response("email_updates not set", { status: 200, headers: corsHeaders });
  }
  if (parentComment.email === newComment.email) {
    console.log("Same user — skipping");
    return new Response("Same user", { status: 200, headers: corsHeaders });
  }
  if (!parentComment.email) {
    console.log("No email — skipping");
    return new Response("No email", { status: 200, headers: corsHeaders });
  }

  const link = `${SITE_URL}/comments?highlight=${newComment.id}&parent=${parentComment.id}`;
  if (!SEND_EMAILS) {
    console.log("Email sending disabled");
    return new Response("Email sending disabled", {
      status: 200,
      headers: corsHeaders,
    });
  }
  console.log("Sending email to:", parentComment.email);

  const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: parentComment.email,
        to_name: parentComment.name,
        sender_name: newComment.name,
        reply_text: newComment.comment,
        original_comment: parentComment.comment,
        link,
      },
      ...(EMAILJS_PRIVATE_KEY ? { accessToken: EMAILJS_PRIVATE_KEY } : {}),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.log("EmailJS error:", err);
    return new Response(`EmailJS error: ${err}`, { status: 500, headers: corsHeaders });
  }

  console.log("Email sent successfully to:", parentComment.email);
  return new Response("Email sent", { status: 200, headers: corsHeaders });
});
