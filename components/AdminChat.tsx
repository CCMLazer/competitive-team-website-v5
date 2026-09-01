"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type ChatMessage = {
  id: string;
  user_id: string;
  username: string;
  message: string;
  created_at: string;
};

export default function AdminChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("admin_chat")
      .select("*")
      .order("created_at", {
        ascending: true,
      });

    if (error) {
      console.error("Failed to load admin chat:", error);
      return;
    }

    setMessages(data || []);
  };

  useEffect(() => {
    const start = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      setUserId(user.id);

      await loadMessages();

      const channel = supabase
        .channel("admin-chat")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "admin_chat",
          },
          () => {
            loadMessages();
          }
        )
        .subscribe();

      setLoading(false);

      return () => {
        supabase.removeChannel(channel);
      };
    };

    start();
  }, []);

  const sendMessage = async () => {
    const text = message.trim();

    if (!text || sending) {
      return;
    }

    setSending(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        alert("You must be logged in.");
        return;
      }

      const username =
        user.user_metadata?.username ||
        user.user_metadata?.user_name ||
        user.email?.split("@")[0] ||
        "Admin";

      const { error } = await supabase
        .from("admin_chat")
        .insert({
          user_id: user.id,
          username,
          message: text,
        });

      if (error) {
        console.error("Failed to send message:", error);
        alert("Failed to send message.");
        return;
      }

      setMessage("");
      await loadMessages();
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this message?")) {
      return;
    }

    const { error } = await supabase
      .from("admin_chat")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Failed to delete message:", error);
      alert("Failed to delete message.");
      return;
    }

    setMessages((old) =>
      old.filter((msg) => msg.id !== id)
    );
  };

  if (loading) {
    return (
      <section
        style={{
          marginTop: 30,
          padding: 20,
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,.08)",
          background: "rgba(255,255,255,.03)",
        }}
      >
        Loading admin chat...
      </section>
    );
  }

  if (!userId) {
    return null;
  }

  return (
    <section
      style={{
        marginTop: 30,
        padding: 20,
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,.08)",
        background: "rgba(255,255,255,.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <div>
          <h2 style={{ margin: 0 }}>
            Owner Chat
          </h2>

          <p
            style={{
              margin: "5px 0 0",
              opacity: 0.6,
              fontSize: 13,
            }}
          >
            Private chat for website administrators.
          </p>
        </div>
      </div>

      <div
        style={{
          height: 350,
          overflowY: "auto",
          padding: 12,
          borderRadius: 10,
          background: "rgba(0,0,0,.2)",
          border: "1px solid rgba(255,255,255,.06)",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 ? (
          <div
            style={{
              height: "100%",
              display: "grid",
              placeItems: "center",
              opacity: 0.5,
            }}
          >
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                padding: "10px 12px",
                marginBottom: 8,
                borderRadius: 10,
                background:
                  msg.user_id === userId
                    ? "rgba(80,140,255,.12)"
                    : "rgba(255,255,255,.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <strong>
                  {msg.username}
                </strong>

                <button
                  onClick={() =>
                    deleteMessage(msg.id)
                  }
                  style={{
                    border: 0,
                    background: "transparent",
                    color: "#ff6666",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  Delete
                </button>
              </div>

              <div
                style={{
                  marginTop: 5,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {msg.message}
              </div>

              <div
                style={{
                  marginTop: 5,
                  fontSize: 11,
                  opacity: 0.45,
                }}
              >
                {new Date(
                  msg.created_at
                ).toLocaleString()}
              </div>
            </div>
          ))
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <input
          value={message}
          onChange={(e) =>
            setMessage(e.target.value)
          }
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              !e.shiftKey
            ) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Message the other owners..."
          maxLength={1000}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 9,
            border:
              "1px solid rgba(255,255,255,.1)",
            background: "rgba(0,0,0,.2)",
            color: "#fff",
            outline: "none",
          }}
        />

        <button
          onClick={sendMessage}
          disabled={sending || !message.trim()}
          style={{
            padding: "12px 18px",
            borderRadius: 9,
            border: 0,
            cursor:
              sending || !message.trim()
                ? "not-allowed"
                : "pointer",
            opacity:
              sending || !message.trim()
                ? 0.5
                : 1,
          }}
        >
          {sending ? "Sending..." : "Send"}
        </button>
      </div>
    </section>
  );
}