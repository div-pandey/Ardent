import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css"; // Cache bust: force CSS reload

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Ardent — Career Intelligence Platform",
    template: "%s | Ardent",
  },
  description:
    "Every career has a path. See yours. Ardent maps the invisible connections between your skills, your goals, and the steps in between.",
  keywords: [
    "career intelligence",
    "career path",
    "skill gap analysis",
    "career roadmap",
    "knowledge graph",
    "AI career coach",
  ],
  authors: [{ name: "Ardent Team" }],
  openGraph: {
    title: "Ardent — Career Intelligence Platform",
    description: "Every career has a path. See yours.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <html
        lang="en"
        className={`${inter.variable} ${jetbrainsMono.variable}`}
        suppressHydrationWarning
      >
      <body className="min-h-screen bg-background text-foreground antialiased relative" suppressHydrationWarning>
        <div className="noise-overlay" />
        {/* Skip Link — WCAG 2.2 AA: keyboard users must skip to content */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider delayDuration={300}>
            <div id="main-content" className="min-h-screen w-full bg-background relative">
              {/* Global Theme Background */}
              <div
                className="fixed inset-0 z-0 pointer-events-none"
                style={{
                  backgroundImage: `
                    radial-gradient(125% 125% at 50% 10%, var(--background) 40%, var(--ardent-glow) 100%)
                  `,
                  backgroundSize: "100% 100%",
                }}
              />
              {/* Your Content/Components */}
              <div className="relative z-10">{children}</div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#ffffff',
              border: '1px solid rgba(20, 184, 166, 0.2)',
              color: '#0f172a',
            },
          }}
        />
      </body>
    </html>
  );
}
