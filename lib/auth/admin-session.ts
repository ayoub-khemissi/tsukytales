import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface AdminSessionData {
  isLoggedIn: boolean;
  adminId?: number;
  email?: string;
}

export const adminSessionOptions: SessionOptions = {
  password: process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET!,
  cookieName: "admin-session",
  ttl: 12 * 60 * 60, // 12 hours
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
  },
};

export async function getAdminSession() {
  const cookieStore = await cookies();

  return getIronSession<AdminSessionData>(cookieStore, adminSessionOptions);
}
