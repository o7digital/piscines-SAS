import type { APIRoute } from "astro";

import { json, readJson } from "../../../lib/api";
import { getAppData } from "../../../lib/db";

export const POST: APIRoute = async ({ request, cookies }) => {
  const body = await readJson<{ email?: string }>(request);
  const data = await getAppData();
  const user = data.users.find((item: any) => item.email === body.email);

  if (!user) return json({ error: "Utilisateur inconnu." }, 401);

  cookies.set("bluu3_user", user.id, { path: "/", sameSite: "lax" });
  return json({ user });
};
