import { marked } from "marked";

const baseStyles = `
  :root {
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #f7f7f8;
    color: #0f172a;
  }

  main {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    padding: clamp(32px, 6vw, 56px) 16px;
  }

  article {
    width: min(860px, 100%);
    background: #ffffff;
    padding: clamp(32px, 5vw, 56px);
    border-radius: 18px;
    box-shadow:
      0 25px 50px rgba(15, 23, 42, 0.07),
      0 5px 15px rgba(15, 23, 42, 0.04);
    line-height: 1.7;
    font-size: 1rem;
  }

  article > *:first-child {
    margin-top: 0;
  }

  h1,
  h2,
  h3,
  h4 {
    font-weight: 600;
    line-height: 1.2;
    margin-top: 2.5rem;
  }

  h1 {
    font-size: clamp(1.85rem, 6vw, 2.75rem);
  }

  h2 {
    font-size: clamp(1.25rem, 4.5vw, 1.8rem);
  }

  h3 {
    font-size: clamp(1.1rem, 4vw, 1.2rem);
  }

  p {
    margin: 1rem 0;
  }

  ul,
  ol {
    margin: 0.75rem 0 0.75rem 1.25rem;
    padding: 0;
  }

  li + li {
    margin-top: 0.45rem;
  }

  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 2.25rem 0;
  }

  strong {
    font-weight: 600;
  }

  a {
    color: #0f62fe;
    text-decoration: none;
  }

  a:hover {
    text-decoration: underline;
  }

  @media (max-width: 600px) {
    body {
      background: #ffffff;
    }

    main {
      padding: 0;
    }

    article {
      min-height: 100vh;
      border-radius: 0;
      box-shadow: none;
      padding: 32px 20px 48px;
      font-size: 0.98rem;
    }

    h1 {
      margin-top: 1.5rem;
    }

    h2,
    h3,
    h4 {
      margin-top: 2rem;
    }
  }
`;

marked.use({
  mangle: false,
  headerIds: false,
  breaks: true,
});

export const renderLegalPage = (title, markdown) => {
  const body = marked.parse(markdown);

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${baseStyles}</style>
  </head>
  <body>
    <main>
      <article>
        ${body}
      </article>
    </main>
  </body>
</html>`;
};
