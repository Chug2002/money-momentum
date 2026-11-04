import { bankRoute } from "../../../plaid-server";
export const dynamic = "force-dynamic";
export async function GET(request:Request,context:{params:Promise<{action:string}>}){return bankRoute(request,(await context.params).action)}
export async function POST(request:Request,context:{params:Promise<{action:string}>}){return bankRoute(request,(await context.params).action)}
