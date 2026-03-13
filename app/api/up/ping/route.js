export async function GET() {
  const token = process.env.UP_BANK_TOKEN;
  if (!token) return Response.json({ status: "not_configured" }, { status: 200 });
  try {
    const res = await fetch("https://api.up.com.au/api/v1/util/ping", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return Response.json({ status: res.ok ? "connected" : "error" });
  } catch {
    return Response.json({ status: "error" });
  }
}
