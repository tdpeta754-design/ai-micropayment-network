import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Micropayment Network — Autonomous M2M Web3 Economy",
  description: "Decentralized Machine-to-Machine micropayment infrastructure on Base Sepolia L2 for autonomous AI Agents with ERC-4337 Account Abstraction & x402 Auto-Payment Engine.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <main className="min-h-screen relative overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
