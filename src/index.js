import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext"; // deploy to test; local dev may not support this import

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const form = await request.formData();

    // Honeypot: if this hidden field is filled by bots, exit quietly.
    if (form.get("company")) {
      return new Response("OK", { status: 200 });
    }

    const payload = {
      name: (form.get("name") || "").toString().trim(),
      email: (form.get("email") || "").toString().trim(),
      phone: (form.get("phone") || "").toString().trim(),
      bundle_ack: !!form.get("bundle_ack"),
      bundle: (form.get("bundle") || "WeatherTrackers Domain Bundle").toString().trim(),
      ts: new Date().toISOString(),
    };

    // Minimal validation to match your current behavior
    if (!payload.name || !payload.email || !payload.bundle_ack) {
      return new Response("Missing name/email/ack", { status: 400 });
    }

    // Build a simple HTML body
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;">
        <h2>New WeatherTrackers Inquiry</h2>
        <table cellpadding="6" cellspacing="0" style="border-collapse: collapse;">
          <tr><td><strong>Name</strong></td><td>${esc(payload.name)}</td></tr>
          <tr><td><strong>Email</strong></td><td>${esc(payload.email)}</td></tr>
          <tr><td><strong>Phone</strong></td><td>${esc(payload.phone || "(none)")}</td></tr>
          <tr><td><strong>Bundle</strong></td><td>${esc(payload.bundle)}</td></tr>
          <tr><td><strong>Bundle‑only acknowledged</strong></td><td>${payload.bundle_ack ? "Yes" : "No"}</td></tr>
          <tr><td><strong>Submitted</strong></td><td>${new Date(payload.ts).toLocaleString()}</td></tr>
        </table>
      </div>
    `;

    // Construct a MIME message (required by the Email Workers API)
    const msg = createMimeMessage();
    msg.setSender({ name: "WeatherTrackers Contact", addr: env.FROM_ADDRESS }); // must be on your Email‑Routed domain
    msg.setRecipient(env.CONTACT_TO);                                           // your inbox
    msg.setSubject(`WeatherTrackers inquiry — ${payload.name}`);
    msg.addMessage({ contentType: "text/html", data: html });

    const email = new EmailMessage(env.FROM_ADDRESS, env.CONTACT_TO, msg.asRaw());

    try {
      // Uses the Email binding you defined as FORM_EMAIL in wrangler.toml
      await env.FORM_EMAIL.send(email);
      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Email send failed:", err);
      return new Response("Email send failed", { status: 500 });
    }
  }
};

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
