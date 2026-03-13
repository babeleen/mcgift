export async function GET() {
  const token = process.env.UP_BANK_TOKEN;
  if (!token) return Response.json({ transactions: [] });
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const params = new URLSearchParams({ "page[size]": "100", "filter[since]": since });
  try {
    const res = await fetch(`https://api.up.com.au/api/v1/transactions?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return Response.json({ transactions: [] });
    const data = await res.json();
    return Response.json({ transactions: data.data || [] });
  } catch {
    return Response.json({ transactions: [] });
  }
}
