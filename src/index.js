export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }
    const fd = await request.formData();

    // Honeypot field - if bots fill this, do nothing but return OK
    if (fd.get("company")) {
      return new Response("OK", { status: 200 });
    }

    // Stub response just to verify the Worker and binding deploy cleanly
    return new Response("Contact endpoint received.", { status: 200 });
  }
};
