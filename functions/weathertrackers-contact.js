export async function onRequestPost({ request }) {
  const formData = await request.formData();

  // Simple honeypot
  if (formData.get("company")) {
    return new Response("OK", { status: 200 });
  }

  // Collect the three fields you now care about
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    bundle_ack: !!formData.get("bundle_ack"),
    bundle: formData.get("bundle"),
    timestamp: new Date().toISOString(),
  };

  // Basic validation
  if (!payload.name || !payload.email || !payload.bundle_ack) {
    return new Response(
      `<h2>Missing info</h2><p>Please include your name, email, and confirm the bundle‑only checkbox.</p>`,
      { headers: { "Content-Type": "text/html" }, status: 400 }
    );
  }

  // Log so you can see submissions in Cloudflare → Workers & Pages → Logs
  console.log("WeatherTrackers inquiry:", payload);

  // Thank‑you response
  return new Response(
    `<h2>Thank you</h2><p>Your inquiry has been received. We’ll get back to you shortly.</p>`,
    { headers: { "Content-Type": "text/html" } }
  );
}
