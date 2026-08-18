import type { APIRoute } from "astro";
import { z } from "zod";
import { requireAdmin } from "../../../lib/auth";
import { assertSafeMutation } from "../../../lib/csrf";
import { renderMarkdown } from "../../../lib/markdown";
import { HttpError, publicErrorMessage } from "../../../lib/errors";

const bodySchema = z.object({
  markdown: z.string().max(100_000).default(""),
});

export const POST: APIRoute = async ({ request }) => {
  try {
    assertSafeMutation(request);
    await requireAdmin();
    const parsed = bodySchema.parse(await request.json());
    return Response.json({ html: renderMarkdown(parsed.markdown) });
  } catch (error) {
    return Response.json(
      { error: publicErrorMessage(error) },
      { status: error instanceof HttpError ? error.status : 400 },
    );
  }
};
