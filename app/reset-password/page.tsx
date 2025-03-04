"use client";

import React, { Suspense } from "react";
import ResetPasswordContent from "./ResetPasswordContent";

// Force the page to render dynamically on the client
export const dynamic = "force-dynamic";
// Do not export revalidate

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
