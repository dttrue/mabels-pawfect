import "./globals.css";

export const metadata = {
  title: "Mabel’s Pawfect",
  description: "Pet Care You Can Trust",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
