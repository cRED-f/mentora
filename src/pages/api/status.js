export const prerender = false;
export function GET() {
  const configured = Boolean(process.env.NINEROUTER_API_KEY && process.env.NINEROUTER_MODEL);
  return Response.json({ configured, model: configured ? process.env.NINEROUTER_MODEL : null }, { headers: {'Cache-Control':'no-store'} });
}
