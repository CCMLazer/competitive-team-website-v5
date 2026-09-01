"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      console.error("LOGIN ERROR:", error);
      setError(error.message);
      setLoading(false);
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        position: "relative",
        overflow: "hidden",

        backgroundImage: "url('/banner.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        color: "#f1f2f3",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "24px",
        boxSizing: "border-box",

        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "rgba(0, 0, 0, 0.55)",
          pointerEvents: "none",
        }}
      />

      {/* Login card */}
      <div
        style={{
          position: "relative",
          zIndex: 1,

          width: "100%",
          maxWidth: "430px",

          background:
            "rgba(17, 20, 25, 0.92)",

          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",

          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: "18px",

          padding: "36px",

          boxSizing: "border-box",

          boxShadow:
            "0 25px 80px rgba(0,0,0,0.55)",
        }}
      >
        {/* Header */}
        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "2px",
              color: "#8b9098",
              marginBottom: "10px",
            }}
          >
            OWNER AREA
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: "38px",
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-1.5px",
              color: "#f1f2f3",
            }}
          >
            Admin Login
          </h1>

          <p
            style={{
              marginTop: "12px",
              marginBottom: 0,
              color: "#8b9098",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            Sign in to manage your website.
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={login}>
          {/* Email */}
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#f1f2f3",
              }}
            >
              Email
            </label>

            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                height: "48px",

                boxSizing: "border-box",

                borderRadius: "10px",
                border:
                  "1px solid #242830",

                background: "#0b0d10",
                color: "#f1f2f3",

                padding: "0 14px",

                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* Password */}
          <div
            style={{
              marginBottom: "18px",
            }}
          >
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: 700,
                marginBottom: "8px",
                color: "#f1f2f3",
              }}
            >
              Password
            </label>

            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Your password"
              required
              style={{
                width: "100%",
                height: "48px",

                boxSizing: "border-box",

                borderRadius: "10px",
                border:
                  "1px solid #242830",

                background: "#0b0d10",
                color: "#f1f2f3",

                padding: "0 14px",

                fontSize: "15px",
                outline: "none",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                background:
                  "rgba(255,70,70,0.08)",

                border:
                  "1px solid rgba(255,70,70,0.25)",

                color: "#ff6b6b",

                borderRadius: "10px",

                padding: "12px",

                marginBottom: "18px",

                fontSize: "13px",
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {/* Login button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              height: "48px",

              border: "none",
              borderRadius: "10px",

              background: "#e8ff3f",
              color: "#080a0d",

              fontSize: "14px",
              fontWeight: 800,

              cursor: loading
                ? "wait"
                : "pointer",

              opacity: loading ? 0.7 : 1,

              transition:
                "transform 0.15s ease, opacity 0.15s ease",
            }}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "24px",

            textAlign: "center",

            fontSize: "12px",

            color: "#555b65",
          }}
        >
          Authorized owners only
        </div>
      </div>
    </main>
  );
}