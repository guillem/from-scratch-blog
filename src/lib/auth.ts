import { getUser, type User } from "@netlify/identity";
import { isDevAuthBypassEnabled } from "./env";
import { forbidden, unauthorized } from "./errors";

export const ADMIN_ROLE = "admin";

export type AppUser = Pick<User, "id" | "email" | "roles">;

const localAdmin: AppUser = {
  id: "local-dev-admin",
  email: process.env.DEV_ADMIN_EMAIL || "admin@localhost",
  roles: [ADMIN_ROLE],
};

export function isAdmin(user: AppUser | null | undefined): boolean {
  return Boolean(user?.roles?.includes(ADMIN_ROLE));
}

export async function getCurrentUser(): Promise<AppUser | null> {
  if (isDevAuthBypassEnabled()) {
    return { ...localAdmin, email: process.env.DEV_ADMIN_EMAIL || localAdmin.email };
  }
  try {
    const user = await getUser();
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      email: user.email,
      roles: user.roles ?? [],
    };
  } catch {
    return null;
  }
}

export function assertAdmin(user: AppUser | null | undefined): AppUser {
  if (!user) {
    throw unauthorized();
  }
  if (!isAdmin(user)) {
    throw forbidden();
  }
  return user;
}

export async function requireAdmin(): Promise<AppUser> {
  return assertAdmin(await getCurrentUser());
}
