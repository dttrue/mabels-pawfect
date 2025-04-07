import "./globals.css";
import Navbar from "@/components/Navbar"; // adjust path if needed
import Footer from "@/components/Footer";

export const metadata = {
  title: "Mabel’s Pawfect",
  description: "Pet Care You Can Trust",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@500&family=Quicksand&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-white to-pink-50">
        <Navbar />
        <main className="pt-20">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
