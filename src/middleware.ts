import { defineMiddleware } from "astro:middleware";
import { getCurrentUser, isAdmin } from "./lib/auth";
import { withSecurityHeaders } from "./lib/headers";

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  const isAdminPath = pathname === "/admin" || pathname.startsWith("/admin/");
  const user = isAdminPath || pathname === "/login" ? await getCurrentUser() : null;

  if (isAdminPath) {
    if (!user) {
      return context.redirect(`/login?next=${encodeURIComponent(pathname)}`);
    }
    if (!isAdmin(user)) {
      return context.redirect("/login?error=forbidden");
    }
    context.locals.user = user;
  } else if (user) {
    context.locals.user = user;
  }

  const response = await next();
  withSecurityHeaders(response.headers, {
    cache: isAdminPath || pathname === "/login" ? "private" : "public",
  });
  return response;
});
