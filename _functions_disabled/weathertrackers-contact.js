// functions/weathertrackers-contact.js

// Optional GET handler so visiting the URL directly shows a friendly message.
export async function onRequestGet() {
  return new Response("This endpoint accepts POST submissions only.", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

export async function onRequestPost({ request }) {
  const formData = await request.formData();

  // Honeypot (simple anti-spam): if this hidden field is filled, ignore.
  if (formData.get("company")) {
    return new Response("OK", { status: 200 });
  }

  // Collect fields you kept
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    bundle_ack: !!formData.get("bundle_ack"),
    bundle: formData.get("bundle"),
    timestamp: new Date().toISOString(),
  };

  // Minimal validation
  if (!payload.name || !payload.email || !payload.bundle_ack) {
    return new Response(
      `<h2>Missing info</h2>
       <p>Please include your name, email, and confirm the bundle‑only checkbox.</p>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" }, status: 400 }
    );
  }

  // Log so you can see it in Workers & Pages → Functions → Begin log stream
  console.log("WeatherTrackers inquiry:", payload);

  // Thank-you page that auto-redirects to "/" after 5 seconds.
  // Uses both <meta http-equiv="refresh"> and JS as a fallback.
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Thank you</title>
  <meta http-equiv="refresh" content="5;url=/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    body {
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: #0f172a; color: #e5e7eb; margin: 0; padding: 0;
      display: grid; place-items: center; min-height: 100vh;
    }
    .card {
      background: #020617; border: 1px solid #1e293b; padding: 2rem;
      border-radius: 10px; max-width: 640px; text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,.3);
    }
    h2 { margin-top: 0; color: #f8fafc; }
    p { margin: .25rem 0 .75rem; }
    .small { color: #94a3b8; font-size: .9rem; }
    a { color: #93c5fd; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <h2>Thank you</h2>
    <p>Your inquiry has been received. We’ll get back to you shortly.</p>
    <p class="small">You’ll be redirected to the homepage in about 5 seconds.</p>
    <p class="small"><a href="/">Return now</a></p>
  </div>

  <script>
