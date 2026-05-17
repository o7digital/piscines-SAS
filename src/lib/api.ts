export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function readJson<T>(request: Request) {
  try {
    return (await request.json()) as T;
  } catch {
    return {} as T;
  }
}
