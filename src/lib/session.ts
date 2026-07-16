import { SessionOptions } from "iron-session";
import { SessionUser } from "./types";

export interface SessionData {
  user?: SessionUser;
  isLoggedIn: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "hyperwrike-dev-secret-change-in-production-32chars",
  cookieName: "hyperwrike_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
  },
};
