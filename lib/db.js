import { kv } from "@vercel/kv";

const DATA_KEY = "mcgift:data";

const DEFAULT_DATA = {
  pool: { groupName: "Our Family" },
  members: [],
  gifts: [],
  wishlists: [],
};

export async function getData() {
  const data = await kv.get(DATA_KEY);
  return data || { ...DEFAULT_DATA };
}

export async function setData(data) {
  await kv.set(DATA_KEY, data);
  return data;
}
