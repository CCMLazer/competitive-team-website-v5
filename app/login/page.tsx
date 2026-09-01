"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const cleanUsername = username.trim();

      if (!cleanUsername) {
        throw new Error("Enter your username.");
      }

      if (!email.trim()) {
        throw new Error("Enter your email.");
      }

      if (!password) {
        throw new Error("Enter your password.");
      }

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data.user) {
        throw new Error("Login failed.");
      }

      /*
       * Create/update the user's profile.
       */
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: data.user.id,
            username: cleanUsername,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        console.error(
          "PROFILE ERROR:",
          profileError
        );
      }

      /*
       * Create their status if they don't
       * already have one.
       */
      const { data: existingStatus } =
        await supabase
          .from("team_status")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();

      if (!existingStatus) {
        const { error: statusError } =
          await supabase
            .from("team_status")
            .insert({
              user_id: data.user.id,
              status: "Online",
              updated_at:
                new Date().toISOString(),
            });

        if (statusError) {
          console.error(
            "STATUS ERROR:",
            statusError
          );
        }
      } else {
        await supabase
          .from("team_status")
          .update({
            status: "Online",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "user_id",
            data.user.id
          );
      }

      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err?.message ||
          "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0b0d10",
        color: "#f1f2f3",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: 430,
          padding: 30,
          border:
            "1px solid #242830",
          borderRadius: 14,
          background: "#111419",
        }}
      >
        <div
          style={{
            marginBottom: 25,
          }}
        >
          <small
            style={{
              opacity: 0.5,
              letterSpacing:
                ".12em",
            }}
          >
            TEAM ACCOUNT
          </small>

          <h1
            style={{
              margin:
                "8px 0",
            }}
          >
            Welcome back
          </h1>

          <p
            style={{
              margin: 0,
              color: "#8b9098",
            }}
          >
            Sign in to your
            team account.
          </p>
        </div>

        <label
          style={{
            display: "block",
            marginBottom: 15,
          }}
        >
          Username

          <input
            value={username}
            onChange={(e) =>
              setUsername(
                e.target.value
              )
            }
            placeholder="Your username"
            style={inputStyle}
          />
        </label>

        <label
          style={{
            display: "block",
            marginBottom: 15,
          }}
        >
          Email

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(
                e.target.value
              )
            }
            placeholder="you@example.com"
            style={inputStyle}
          />
        </label>

        <label
          style={{
            display: "block",
            marginBottom: 20,
          }}
        >
          Password

          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(
                e.target.value
              )
            }
            placeholder="Password"
            style={inputStyle}
          />
        </label>

        {error && (
          <div
            style={{
              marginBottom: 15,
              padding: 12,
              borderRadius: 8,
              background:
                "rgba(255,70,70,.1)",
              border:
                "1px solid rgba(255,70,70,.25)",
              color: "#ff8585",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 13,
            border: 0,
            borderRadius: 8,
            background:
              "#e8ff3f",
            color: "#000",
            fontWeight: 800,
            cursor: loading
              ? "default"
              : "pointer",
            opacity: loading
              ? 0.6
              : 1,
          }}
        >
          {loading
            ? "Signing in..."
            : "Sign in"}
        </button>
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  marginTop: 7,
  padding: "12px 13px",
  borderRadius: 8,
  border:
    "1px solid #242830",
  background: "#0b0d10",
  color: "#f1f2f3",
  outline: "none",
};