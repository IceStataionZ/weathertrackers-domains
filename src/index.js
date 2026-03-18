// src/index.js
// Uses the Email Workers API. The binding (FORM_EMAIL) is created by Wrangler
// from the `send_email` section in wrangler.toml.
import { EmailMessage } from "cloudflare:email";

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const form = await request.formData();

    // Honeypot: if bots fill this, exit quietly
    if (form.get("company")) {
      return new Response("OK", { status: 200 });
    }

    const name   = String(form.get("name")   ?? "").trim();
    const email  = String(form.get("email")  ?? "").trim();
    const phone  = String(form.get("phone")  ?? "").trim();
    const bundle = String(form.get("bundle") ?? "WeatherTrackers Domain Bundle").trim();
    const ack    = !!form.get("bundle_ack"); // checkbox → boolean

    if (!name || !email || !ack) {
      return new Response("Missing name/email/ack", { status: 400 });
    }

    // Minimal HTML body for the message
    const html = `
<h4>New WeatherTrackers Inquiry</h4>
<table>
  <tr><td><b>Name</b></td><td>${escapeHtml(name)}</td></tr>
  <tr><td><b>Email</b></td><td>${escapeHtml(email)}</td></tr>
  <tr><td><b>Phone</b></td><td>${escapeHtml(phone || "(none)")}</td></tr>
  <tr><td><b>Bundle</b></td><td>${escapeHtml(bundle)}</td></tr>
  <tr><td><b>Bundle-only acknowledged</b></td><td>${ack ? "Yes" : "No"}</td></tr>
  <tr><td><b>Submitted</b></td><td>${new Date().toLocaleString()}</td></tr>
</table>
`.trim();

    // Addresses from environment (configured in wrangler.toml)
    const to   = env.CONTACT_TO;       // e.g., "cloudflare@weathertrackers.com"
    const from = env.FROM_ADDRESS;     // e.g., "no-reply@weathertrackers.net" (must be on routed domain)

    // REQUIRED headers for MIME: Message-ID and Date
    const messageId = `<${crypto.randomUUID()}@weathertrackers.net>`;
    const dateHdr   = new Date().toUTCString();

    // Build a raw MIME message. Use simple ASCII dash in Subject to avoid header encoding issues.
    const raw = [
      `From: ${from}`,
      `To: ${to}`,
      `Reply-To: ${email}`,
      `Message-ID: ${messageId}`,
      `Date: ${dateHdr}`,
      `Subject: WeatherTrackers inquiry - ${name}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      `Content-Transfer-Encoding: 8bit`,
      ``,
      html
    ].join("\r\n");

    try {
      const message = new EmailMessage(from, to, raw);
      await env.FORM_EMAIL.send(message);
      // Optional: visible in `wrangler tail` on success
      console.log("Email sent to", to, "for", name);
    } catch (err) {
      console.error("Email send failed:", err?.stack || String(err));
      return new Response("Email send failed", { status: 500 });
    }

    return new Response("Contact endpoint received.", { status: 200 });
  },
};

// Basic HTML escaping for safety
function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
