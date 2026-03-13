const DATA_KEY = "mcgift:data";

const DEFAULT_DATA = {
  pool: { groupName: "Our Family" },
  members: [],
  gifts: [],
  wishlists: [],
};

async function redis(command, ...args) {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(`${url}/${command}/${args.join("/")}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getData() {
  try {
    const res = await redis("get", DATA_KEY);
    return res?.result ? JSON.parse(res.result) : { ...DEFAULT_DATA };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

export async function setData(data) {
  const json = JSON.stringify(data);
  await redis("set", DATA_KEY, encodeURIComponent(json));
  return data;
}
