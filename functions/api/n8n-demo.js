const N8N_WEBHOOK = "https://6wejmb5u.rpcld.co/webhook/bais-lead-qualification";

const DEMO_PAYLOAD = Object.freeze({
  name: "Max Mustermann",
  email: "max.mustermann@example.com",
  company: "Muster Industrie GmbH",
  topic: "Cybersecurity und n8n Automation",
  message: "Synthetischer BAIS-Demolauf für einen sicheren Workflow mit AI Governance, ISO 27001 Kontrollen und revisionsfähigem Audit Trail.",
  consent: true
});

export async function onRequestPost({ request }) {
  const origin = request.headers.get("Origin");
  const allowedOrigins = new Set([
    "https://bais-solutions.de",
    "https://www.bais-solutions.de",
    "https://bais-webseite.pages.dev"
  ]);

  if (origin && !allowedOrigins.has(origin) && !origin.endsWith(".bais-webseite.pages.dev")) {
    return Response.json({ ok: false, error: "Origin not allowed" }, { status: 403 });
  }

  try {
    const upstream = await fetch(N8N_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "BAIS-Live-Demo/1.0"
      },
      body: JSON.stringify(DEMO_PAYLOAD)
    });

    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch {
    return Response.json(
      { ok: false, error: "Live workflow temporarily unavailable" },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}

export function onRequest() {
  return Response.json(
    { ok: false, error: "Method not allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
