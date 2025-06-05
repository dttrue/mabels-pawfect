// app/layout.js
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Mabel’s Pawfect Pet Services",
  description: "Affordable, loving pet care you can trust.",
  icons: {
    icon: "/favicon-v2.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Quicksand&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon-v2.ico" />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-white to-pink-50">
        <Navbar />
        <Toaster position="top-right" />
        <main className="pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
