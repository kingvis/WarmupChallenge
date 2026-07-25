import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 overflow-hidden">
      {/* Calm Animated Background Orbs */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-blue-200/30 blur-3xl animate-orb-1"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-teal-200/25 blur-3xl animate-orb-2"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <span className="text-4xl" role="img" aria-label="Hearthline Logo">🏡</span>
          <h1 className="font-heading font-bold text-2xl text-slate-900 mt-2">Start Your Journey</h1>
          <p className="text-sm text-slate-500 mt-1">Create an account to access custom support plans and resources.</p>
        </div>

        <div className="flex justify-center shadow-lg rounded-2xl overflow-hidden bg-white border border-slate-100">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none border-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors",
                footerActionLink: "text-blue-600 hover:text-blue-700",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
