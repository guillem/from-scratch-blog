import { verifyRequestOrigin } from "@netlify/identity";
import { forbidden } from "./errors";

export function assertSafeMutation(request: Request): void {
  if (request.method === "GET" || request.method === "HEAD") {
    return;
  }
  try {
    verifyRequestOrigin(request);
  } catch {
    throw forbidden("Request origin could not be verified.");
  }
}
