// app/donate-success/page.js

import { Suspense } from "react";
import DonateSuccessClient from "@/components/DonateSuccessClient";

export default function DonateSuccessPage() {
  return (
    <Suspense fallback={<p>Loading donation details...</p>}>
      <DonateSuccessClient />
    </Suspense>
  );
}

