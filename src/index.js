export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405 });
    }

    const hasEmailBinding = !!env.FORM_EMAIL;
    const fromAddr = env.FROM_ADDRESS || "(missing)";
    const toAddr = env.CONTACT_TO || "(missing)";

    const report = JSON.stringify(
      { hasEmailBinding, fromAddr, toAddr },
      null,
      2
    );

    return new Response(report, {
      status: hasEmailBinding ? 200 : 500,
      headers: { "Content-Type": "application/json" }
    });
  },
};
