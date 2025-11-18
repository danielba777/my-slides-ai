import { readFile } from "node:fs/promises";

import { renderLegalPage } from "../legal-page-response";

const loadMarkdown = () => {
  const fileUrl = new URL("./terms.txt", import.meta.url);
  return readFile(fileUrl, "utf-8");
};

export async function GET() {
  const markdown = await loadMarkdown();
  const document = renderLegalPage("ViralBoost · Terms of Use", markdown);

  return new Response(document, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
