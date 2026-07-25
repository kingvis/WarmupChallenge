"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function DashboardEntry() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (!user) {
        router.push("/sign-in");
      } else {
        const metadata = user.unsafeMetadata as { onboardingCompleted?: boolean; role?: string };
        
        if (!metadata.onboardingCompleted) {
          router.push("/onboarding");
        } else {
          // Enforce role-based redirect with legacy mapping
          let role = metadata.role || "user";
          if (role === "recovery" || role === "both") {
            role = "user";
          }
          router.push(`/dashboard/${role}`);
        }
      }
    }
  }, [isLoaded, user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium font-heading">Directing you to your workspace...</p>
      </div>
    </div>
  );
}
