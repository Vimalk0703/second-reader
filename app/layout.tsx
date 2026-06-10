import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

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
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-line bg-surface">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-3">
              {/* Brand-aligned wordmark — KPMG Blue, Arial. Not the registered
                  four-square logomark; this is an independent prototype
                  (see footer). */}
              <Link href="/" className="flex items-center gap-3">
                <span
                  className="text-[20px] font-bold tracking-tight text-kpmg-blue"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  KPMG
                </span>
                <span className="h-5 w-px bg-line-strong" aria-hidden />
                <span className="flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold tracking-tight text-ink">
                    Second Reader
                  </span>
                  <span className="hidden text-[13px] text-ink-soft sm:inline">
                    AI reads. Humans decide.
                  </span>
                </span>
              </Link>
            </div>
            <nav className="flex items-center gap-5 text-[13px]">
              <Link href="/" className="text-ink-soft hover:text-kpmg-blue">
                Review queue
              </Link>
              <Link href="/transparency" className="text-ink-soft hover:text-kpmg-blue">
                Candidate transparency
              </Link>
              <a
                href="https://github.com/Vimalk0703/second-reader"
                className="text-ink-soft hover:text-kpmg-blue"
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
          <div className="mx-auto max-w-7xl space-y-1 px-6 py-4 text-[11px] leading-5 text-ink-faint">
            <p>
              This tool produces no scores, no rankings, and no decisions — those
              belong to people. All candidate submissions shown are synthetic and
              labelled as such.
            </p>
            <p>
              Independent candidate prototype, styled to KPMG&apos;s visual
              identity for this assessment. Not an official KPMG product. “KPMG”
              and the KPMG logo are trademarks of KPMG International.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
