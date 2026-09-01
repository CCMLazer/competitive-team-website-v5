"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  username: string;
  bio: string;
  avatar_url: string;
  is_owner: boolean;
  first_login: boolean;
};

export default function MyAccount() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/admin/login";
        return;
      }

      setEmail(user.email || "");

      const { data, error } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Failed to load profile:", error);
        setLoading(false);
        return;
      }

      if (!data) {
        const newProfile = {
          id: user.id,
          username: user.email?.split("@")[0] || "New Admin",
          bio: "",
          avatar_url: "",
          is_owner: false,
          first_login: true,
        };

        const { data: created, error: createError } = await supabase
          .from("admin_profiles")
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error("Failed to create profile:", createError);
          setLoading(false);
          return;
        }

        setProfile(created);
        setUsername(created.username);
        setBio(created.bio);
        setAvatar(created.avatar_url);
      } else {
        setProfile(data);
        setUsername(data.username || "");
        setBio(data.bio || "");
        setAvatar(data.avatar_url || "");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function uploadAvatar(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      setAvatar(String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    if (!profile) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("admin_profiles")
        .update({
          username: username.trim() || "New Admin",
          bio,
          avatar_url: avatar,
          first_login: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (error) {
        console.error("Failed to save profile:", error);
        setMessage("Failed to save profile.");
        return;
      }

      setProfile({
        ...profile,
        username: username.trim() || "New Admin",
        bio,
        avatar_url: avatar,
        first_login: false,
      });

      setMessage("Profile saved ✓");
    } catch (error) {
      console.error(error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/admin/login";
  }

  if (loading) {
    return (
      <main style={styles.page}>
        <div style={styles.loading}>
          <h1>Loading account...</h1>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <div style={styles.eyebrow}>ADMIN PANEL</div>
            <h1 style={styles.title}>My Account</h1>
            <p style={styles.subtitle}>
              Manage your team profile and account information.
            </p>
          </div>

          <button style={styles.backButton} onClick={() => history.back()}>
            ← Back
          </button>
        </header>

        <section style={styles.card}>
          <div style={styles.profileTop}>
            <div style={styles.avatarWrapper}>
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profile"
                  style={styles.avatar}
                />
              ) : (
                <div style={styles.avatarPlaceholder}>
                  {username?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
            </div>

            <div>
              <h2 style={styles.profileName}>
                {username || "New Admin"}
              </h2>

              <p style={styles.profileEmail}>{email}</p>

              {profile?.is_owner && (
                <span style={styles.ownerBadge}>OWNER</span>
              )}
            </div>
          </div>

          <div style={styles.divider} />

          <label style={styles.label}>
            Username
            <input
              style={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              maxLength={32}
            />
          </label>

          <label style={styles.label}>
            Bio
            <textarea
              style={styles.textarea}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the team a little about yourself..."
              maxLength={160}
            />
            <span style={styles.counter}>
              {bio.length}/160
            </span>
          </label>

          <label style={styles.label}>
            Profile picture

            <div style={styles.uploadRow}>
              <label style={styles.uploadButton}>
                Choose image
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      uploadAvatar(file);
                    }
                  }}
                />
              </label>

              {avatar && (
                <button
                  type="button"
                  style={styles.removeButton}
                  onClick={() => setAvatar("")}
                >
                  Remove
                </button>
              )}
            </div>
          </label>

          <div style={styles.divider} />

          <div style={styles.actions}>
            <button
              style={{
                ...styles.saveButton,
                opacity: saving ? 0.6 : 1,
              }}
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>

            {message && (
              <span
                style={{
                  ...styles.message,
                  color: message.includes("Failed")
                    ? "#ff6b6b"
                    : "#8cff9b",
                }}
              >
                {message}
              </span>
            )}
          </div>
        </section>

        <section style={styles.accountCard}>
          <div>
            <h2 style={styles.accountTitle}>Account</h2>
            <p style={styles.accountText}>
              Signed in as <strong>{email}</strong>
            </p>
          </div>

          <button style={styles.logoutButton} onClick={logout}>
            Sign out
          </button>
        </section>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#0b0d10",
    color: "#f1f2f3",
    padding: "40px 20px",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "850px",
    margin: "0 auto",
  },

  loading: {
    minHeight: "90vh",
    display: "grid",
    placeItems: "center",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "20px",
    marginBottom: "28px",
  },

  eyebrow: {
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.14em",
    color: "#8b9098",
    marginBottom: "8px",
  },

  title: {
    fontSize: "34px",
    lineHeight: 1.1,
    margin: 0,
    letterSpacing: "-0.03em",
  },

  subtitle: {
    color: "#8b9098",
    marginTop: "10px",
    marginBottom: 0,
    fontSize: "15px",
  },

  backButton: {
    border: "1px solid #242830",
    background: "#111419",
    color: "#f1f2f3",
    padding: "10px 14px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },

  card: {
    background: "#111419",
    border: "1px solid #242830",
    borderRadius: "12px",
    padding: "28px",
  },

  profileTop: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
  },

  avatarWrapper: {
    width: "78px",
    height: "78px",
    flexShrink: 0,
  },

  avatar: {
    width: "78px",
    height: "78px",
    objectFit: "cover",
    borderRadius: "50%",
    display: "block",
  },

  avatarPlaceholder: {
    width: "78px",
    height: "78px",
    borderRadius: "50%",
    background: "#242830",
    display: "grid",
    placeItems: "center",
    fontSize: "27px",
    fontWeight: 700,
  },

  profileName: {
    margin: 0,
    fontSize: "21px",
  },

  profileEmail: {
    color: "#8b9098",
    margin: "5px 0 8px",
    fontSize: "14px",
  },

  ownerBadge: {
    display: "inline-block",
    fontSize: "10px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    background: "#e8ff3f",
    color: "#0b0d10",
    padding: "4px 7px",
    borderRadius: "4px",
  },

  divider: {
    height: "1px",
    background: "#242830",
    margin: "28px 0",
  },

  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 650,
    marginBottom: "20px",
  },

  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    marginTop: "8px",
    padding: "12px 13px",
    borderRadius: "8px",
    border: "1px solid #242830",
    background: "#0b0d10",
    color: "#f1f2f3",
    outline: "none",
    fontSize: "14px",
  },

  textarea: {
    display: "block",
    width: "100%",
    minHeight: "110px",
    boxSizing: "border-box",
    marginTop: "8px",
    padding: "12px 13px",
    borderRadius: "8px",
    border: "1px solid #242830",
    background: "#0b0d10",
    color: "#f1f2f3",
    outline: "none",
    fontSize: "14px",
    resize: "vertical",
    fontFamily: "inherit",
  },

  counter: {
    display: "block",
    textAlign: "right",
    color: "#8b9098",
    fontSize: "11px",
    marginTop: "5px",
  },

  uploadRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginTop: "8px",
  },

  uploadButton: {
    display: "inline-block",
    border: "1px solid #242830",
    background: "#0b0d10",
    color: "#f1f2f3",
    padding: "10px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },

  removeButton: {
    border: "1px solid #4a2525",
    background: "#241313",
    color: "#ff7d7d",
    padding: "10px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },

  actions: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  saveButton: {
    border: "none",
    background: "#e8ff3f",
    color: "#0b0d10",
    padding: "12px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 750,
  },

  message: {
    fontSize: "13px",
  },

  accountCard: {
    marginTop: "18px",
    padding: "22px 24px",
    borderRadius: "12px",
    border: "1px solid #242830",
    background: "#111419",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  accountTitle: {
    margin: 0,
    fontSize: "16px",
  },

  accountText: {
    margin: "6px 0 0",
    color: "#8b9098",
    fontSize: "13px",
  },

  logoutButton: {
    border: "1px solid #4a2525",
    background: "transparent",
    color: "#ff7d7d",
    padding: "9px 13px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "13px",
  },
};