import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "elvissellshouses@gmail.com";

interface NotificationRequest {
  type: "signup" | "message" | "form_submission";
  data: {
    fullName?: string;
    email?: string;
    timestamp?: string;
    messageContent?: string;
    senderName?: string;
    senderEmail?: string;
    conversationUrl?: string;
    formType?: string;
    formFields?: Record<string, string>;
  };
}

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return new Date().toLocaleString();
  return new Date(dateStr).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
};

const generateSignupEmail = (data: NotificationRequest["data"]): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New User Signup</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">🎉 New User Signup</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Full Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${data.fullName || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280;">Email Address</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:${data.email}" style="color: #667eea;">${data.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #6b7280;">Signup Date/Time</td>
            <td style="padding: 12px 0;">${formatDate(data.timestamp)}</td>
          </tr>
        </table>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated notification from Elvis Sells Houses CRM
      </p>
    </body>
    </html>
  `;
};

const generateMessageEmail = (data: NotificationRequest["data"]): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Message Received</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💬 New Message Received</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <div style="margin-bottom: 20px;">
          <p style="font-weight: 600; color: #6b7280; margin-bottom: 5px;">From:</p>
          <p style="margin: 0; font-size: 16px;">${data.senderName || "Unknown"} (<a href="mailto:${data.senderEmail}" style="color: #3b82f6;">${data.senderEmail}</a>)</p>
        </div>
        <div style="margin-bottom: 20px;">
          <p style="font-weight: 600; color: #6b7280; margin-bottom: 5px;">Message:</p>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <p style="margin: 0; white-space: pre-wrap;">${data.messageContent}</p>
          </div>
        </div>
        <div style="text-align: center; margin-top: 25px;">
          <a href="${data.conversationUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: 600;">Open Conversation</a>
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated notification from Elvis Sells Houses CRM
      </p>
    </body>
    </html>
  `;
};

const generateFormSubmissionEmail = (data: NotificationRequest["data"]): string => {
  const formFieldsHtml = Object.entries(data.formFields || {})
    .map(([key, value]) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; font-weight: 600; color: #6b7280; text-transform: capitalize;">${key.replace(/_/g, " ")}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${value || "Not provided"}</td>
      </tr>
    `)
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Form Submission</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">📋 New ${data.formType || "Form"} Submission</h1>
      </div>
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <div style="margin-bottom: 20px;">
          <p style="font-weight: 600; color: #6b7280; margin-bottom: 5px;">Submitted by:</p>
          <p style="margin: 0; font-size: 16px;">${data.fullName || "Unknown"} (<a href="mailto:${data.email}" style="color: #10b981;">${data.email}</a>)</p>
        </div>
        <div style="margin-bottom: 20px;">
          <p style="font-weight: 600; color: #6b7280; margin-bottom: 5px;">Form Type:</p>
          <span style="display: inline-block; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px;">${data.formType}</span>
        </div>
        <div>
          <p style="font-weight: 600; color: #6b7280; margin-bottom: 10px;">Submission Details:</p>
          <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb;">
            ${formFieldsHtml}
          </table>
        </div>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        This is an automated notification from Elvis Sells Houses CRM
      </p>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, data }: NotificationRequest = await req.json();
    console.log(`Processing ${type} notification:`, JSON.stringify(data, null, 2));

    let subject: string;
    let html: string;

    switch (type) {
      case "signup":
        subject = `🎉 New User Signup: ${data.fullName || data.email}`;
        html = generateSignupEmail(data);
        break;
      case "message":
        subject = `💬 New Message from ${data.senderName || data.senderEmail}`;
        html = generateMessageEmail(data);
        break;
      case "form_submission":
        subject = `📋 New ${data.formType} Submission from ${data.fullName || data.email}`;
        html = generateFormSubmissionEmail(data);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    console.log(`Sending email to ${ADMIN_EMAIL} with subject: ${subject}`);

    const emailResponse = await resend.emails.send({
      from: "Elvis Sells Houses <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject,
      html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
