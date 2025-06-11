// ✅ app/sign-in/layout.js
import { ClerkProvider } from "@clerk/nextjs";

export default function SignInLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
