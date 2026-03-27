import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Barlow } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "MiniProfessorAI — Your AI Teaching Assistant",
  description: "Professors train AI clones of themselves. Students get answers 24/7 in their professor's style and voice.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", barlow.variable)}>
      <body
        className={`${barlow.variable} font-sans antialiased bg-[var(--bg)] text-[var(--text-primary)]`}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "12px",
              fontSize: "14px",
            },
            success: { iconTheme: { primary: "#a78bfa", secondary: "#0f172a" } },
            error: { iconTheme: { primary: "#f87171", secondary: "#0f172a" } },
          }}
        />
      </body>
    </html>
  );
}
