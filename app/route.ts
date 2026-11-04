import { html } from "./ui";
export const dynamic = "force-dynamic";
export function GET(request: Request) { if (!request.headers.get("oai-authenticated-user-id")) return Response.redirect(new URL("/signin-with-chatgpt?return_to=/",request.url)); return new Response(html,{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}}); }
