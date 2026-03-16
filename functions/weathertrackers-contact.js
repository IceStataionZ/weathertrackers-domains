// functions/weathertrackers-contact.js

// Optional GET handler so visiting the URL directly doesn't show a 405.
// Also declares UTF-8 so punctuation renders correctly.
export async function onRequestGet() {
  return new Response("This endpoint accepts POST submissions only.", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}

// POST handler for your contact form.
export async function onRequestPost({ request }) {
  const formData = await request.formData();

  // Honeypot (simple anti-spam): if this hidden field is filled, ignore.
  if (formData.get("company")) {
    return new Response("OK", { status: 200 });
  }

  // Collect the fields you decided to keep
  const payload = {
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || "",
    bundle_ack: !!formData.get("bundle_ack"),
    bundle: formData.get("bundle"), // hidden field from the form
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

  // Log so you can see it in Workers & Pages → Logs
  console.log("WeatherTrackers inquiry:", payload);

  // Thank-you page (with UTF‑8 header so "We’ll" renders correctly)
  return new Response(
    `<h2>Thank you</h2>
     <p>Your inquiry has been received. We’ll get back to you shortly.</p>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
