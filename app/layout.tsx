import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Second Reader — AI reads. Humans decide.",
  description:
    "A reviewer-side evidence workbench for AI Builder hiring: AI extracts cited evidence and drafts interview probes; humans make every judgment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-7xl items-baseline justify-between px-6 py-4">
            <div className="flex items-baseline gap-3">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                Second Reader
              </Link>
              <span className="text-sm text-ink-soft">AI reads. Humans decide.</span>
            </div>
            <nav className="flex items-center gap-5 text-sm">
              <Link href="/" className="text-ink-soft hover:text-ink">
                Review queue
              </Link>
              <Link href="/transparency" className="text-ink-soft hover:text-ink">
                Candidate transparency
              </Link>
              <a
                href="https://github.com/Vimalk0703/second-reader"
                className="text-ink-soft hover:text-ink"
                target="_blank"
                rel="noreferrer"
              >
                Source
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
        <footer className="border-t border-line bg-surface">
          <div className="mx-auto max-w-7xl px-6 py-4 text-xs text-ink-faint">
            Prototype built for a hiring case study. All candidate submissions are
            synthetic and clearly labelled as such. This tool produces no scores,
            no rankings, and no decisions — those belong to people.
          </div>
        </footer>
      </body>
    </html>
  );
}
