"use client";

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../services/firebase";
import api from "../services/api";
import { LogIn, Loader2 } from "lucide-react";

export default function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();

      const res = await api.post("/api/auth/google", { idToken });
      localStorage.setItem("user_token", res.data.token);

      // Smooth hydration trigger
      window.dispatchEvent(new Event("auth-changed"));
    } catch (err) {
      console.error("Authentication Sequence Interrupted:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={isLoading}
      className="group relative flex items-center gap-2 px-5 py-2 bg-[#0095f6] hover:bg-[#1877f2] disabled:bg-gray-200 text-white rounded-lg transition-all duration-200 active:scale-95"
    >
      {isLoading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          <span className="text-xs font-semibold">Connecting...</span>
        </>
      ) : (
        <>
          <LogIn size={16} className="transition-transform group-hover:translate-x-0.5" />
          <span className="text-xs font-semibold tracking-tight">
            Log In
          </span>
        </>
      )}
    </button>
  );
}