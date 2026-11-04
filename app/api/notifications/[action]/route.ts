import {notificationsRoute} from '../../../notifications-server';
export const dynamic='force-dynamic';
export async function GET(r:Request,{params}:any){const p=await params;return notificationsRoute(r,p.action)}
export async function POST(r:Request,{params}:any){const p=await params;return notificationsRoute(r,p.action)}
