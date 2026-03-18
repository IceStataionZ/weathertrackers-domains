export default {
  async fetch(request, env, ctx) {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const form = await request.formData();

    // Honeypot: if this hidden field is filled by bots, exit quietly.
    if (form.get("company")) {
      return new Response("OK", { status: 200 });
    }

    const name   = ((form.get("name") ?? "") + "").trim();
    const email  = ((form.get("email") ?? "") + "").trim();
    const phone  = ((form.get("phone") ?? "") + "").trim();
    const bundle = ((form.get("bundle") ?? "WeatherTrackers Domain Bundle") + "").trim();
    const ack    = !!form.get("bundle_ack"); // checkbox → boolean

    // Minimal validation
    if (!name || !email || !ack) {
      return new Response("Missing name/email/ack", { status: 400 });
    }

    // Build a minimal HTML body
    const html = `
      <h3>New WeatherTrackers Inquiry</h3>
      <table border="0" cellpadding="4" cellspacing="0">
        <tr><td><strong>Name</strong></td><td>${esc(name)}</td></tr>
        <tr><td><strong>Email</strong></td><td>${esc(email)}</td></tr>
        <tr><td><strong>Phone</strong></td><td>${esc(phone || "(none)")}</td></tr>
        <tr><td><strong>Bundle</strong></td><td>${esc(bundle)}</td></tr>
        <tr><td><strong>Bundle-only acknowledged</strong></td><td>${ack ? "Yes" : "No"}</td></tr>
        <tr><td><strong>Submitted</strong></td><td>${new Date().toLocaleString()}</td></tr>
      </table>
    `;

    // Sanity check: confirm binding is available
    if (!env.FORM_EMAIL) {
      console.log("FORM_EMAIL binding is missing");
      return new Response("Email binding missing", { status: 500 });
    }

    // Addresses from environment (set in wrangler.toml)
    const to = env.CONTACT_TO;               // e.g., cloudflare@weathertrackers.com
    const from = env.FROM_ADDRESS;           // e.g., no-reply@weathertrackers.net (must be on Email‑routed domain)

    // IMPORTANT: await the send, so delivery is actually attempted
    await env.FORM_EMAIL.send({
      to,
      from,
      subject: `WeatherTrackers inquiry — ${name}`,
      content: [
        { type: "text/html", value: html }
      ],
      // Let recipient reply directly to the submitter (optional)
      reply_to: email
    });

    return new Response("Contact endpoint received.", { status: 200 });
  },
};

// Simple HTML escape
function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}