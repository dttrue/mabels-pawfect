// app/sign-in/[[...sign-in]]/page.js

"use client";

import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen flex justify-center items-center">
      <SignIn afterSignInUrl="/admin" />
    </div>
  );
}

