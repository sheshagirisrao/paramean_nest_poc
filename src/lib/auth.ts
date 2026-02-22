import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const AUTH_USERNAME = "parameanadmin";
const AUTH_PASSWORD = "Paramean@123";
const COOKIE_NAME = "paramean_session";

function getSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET!);
}

export function validateCredentials(username: string, password: string): boolean {
  return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ user: AUTH_USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("8h")
    .sign(getSecret());
  return token;
}

export async function verifySession(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE_NAME };
