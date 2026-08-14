import type { Metadata } from "next";
import { VineBackground } from "@/components/VineBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "Förgätmigej — ta bort dina uppgifter",
  description:
    "Välj var du vill försvinna. Vi frågar bara efter de uppgifter varje tjänst faktiskt kräver, och först när den kräver dem.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..600&family=Karla:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <VineBackground />
        <div className="relative mx-auto max-w-[940px] px-6">
          {children}
          <footer className="mt-24 flex flex-wrap justify-between gap-4 border-t border-[var(--color-line)] pt-6 pb-10 text-[13px] text-stem">
            <span>
              Förgätmigej — hittar du något som är fel eller krångligt,{" "}
              <a
                className="text-blue-deep underline underline-offset-2"
                href="mailto:erik@dreifaldt.com?subject=Feedback%20p%C3%A5%20F%C3%B6rg%C3%A4tmigej"
              >
                hör av dig
              </a>
              .
            </span>
            <span>Prototyp. Inget sparas när du stänger fliken.</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
