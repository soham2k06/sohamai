import { Analytics } from "@vercel/analytics/react";
import ClientProvider from "@/components/client-provider";
import "./globals.css";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Soham Bhikadiya | Gemini",
  description:
    "An AI Gemini Chat is a chat application that uses AI to generate responses. Custom fine tuning of the model that gives information about me",
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>

      <body>
        <ClientProvider>{children}</ClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
