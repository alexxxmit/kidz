import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="ru">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body, #root { height: 100%; overflow: hidden; }
          body { margin: 0; background: #F4F6FA; }
          * { box-sizing: border-box; }
          *:focus-visible { outline: 2px solid #6558F5; outline-offset: 2px; }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
