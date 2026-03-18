export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      // Make GET (or anything not POST) return a unique marker.
      return new Response("DIAG‑WT‑001", { status: 200 });
    }

    // Keep the JSON diagnostic for POST
    const report = {
      hasEmailBinding: !!env.FORM_EMAIL,
      fromAddr: env.FROM_ADDRESS || "(missing)",
      toAddr: env.CONTACT_TO || "(missing)"
    };

    return new Response(JSON.stringify(report, null, 2), {
      status: report.hasEmailBinding ? 200 : 500,
      headers: { "Content-Type": "application/json" }
    });
  },
};
