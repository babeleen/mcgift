import { getData, setData } from "@/lib/db";

export async function GET() {
  const data = await getData();
  return Response.json(data);
}

export async function POST(request) {
  const body = await request.json();
  const data = await setData(body);
  return Response.json(data);
}
