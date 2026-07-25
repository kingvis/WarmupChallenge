"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RecoveryRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/dashboard/user");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium font-heading">Redirecting to User Dashboard...</p>
      </div>
    </div>
  );
}
