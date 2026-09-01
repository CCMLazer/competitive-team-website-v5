"use client";

import { useEffect, useState } from "react";
import { DEFAULT, Site } from "@/lib/site";
import { getSite } from "@/lib/store";

function normalizeSite(data: any): Site {
  return {
    ...DEFAULT,
    ...(data || {}),

    background: {
      ...DEFAULT.background,
      ...(data?.background || {}),
    },

    visible: {
      ...DEFAULT.visible,
      ...(data?.visible || {}),
    },

    games: {
      ...DEFAULT.games,
      ...(data?.games || {}),

      gt: {
        ...DEFAULT.games.gt,
        ...(data?.games?.gt || {}),
      },

      od: {
        ...DEFAULT.games.od,
        ...(data?.games?.od || {}),
      },
    },

    colors: {
      ...DEFAULT.colors,
      ...(data?.colors || {}),
    },

    players: Array.isArray(data?.players)
      ? data.players
      : DEFAULT.players,
  };
}

const defaultLayout = {
  intro: {
    x: 0,
    y: 0,
    width: 100,
    fontSize: 12,
  },

  logo: {
    x: 0,
    y: 70,
    width: 90,
    height: 90,
  },

  name: {
    x: 0,
    y: 190,
    width: 800,
    fontSize: 90,
  },

  tag: {
    x: 0,
    y: 310,
    width: 700,
    fontSize: 32,
  },

  description: {
    x: 0,
    y: 380,
    width: 650,
    fontSize: 18,
  },

  buttons: {
    x: 0,
    y: 500,
    width: 400,
    fontSize: 14,
  },
};

export default function Home() {
  const [site, setSite] = useState<Site>(DEFAULT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSite()
      .then((data) => {
        setSite(normalizeSite(data));
      })
      .catch((error) => {
        console.error("Failed to load site:", error);
        setSite(DEFAULT);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0d10",
          color: "#f1f2f3",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading...
      </main>
    );
  }

  const layout = {
    ...defaultLayout,
    ...((site as any).layout || {}),
  };

  return (
    <main
      style={
        {
          "--bg": site.colors.bg,
          "--card": site.colors.card,
          "--text": site.colors.text,
          "--muted": site.colors.muted,
          "--accent": site.colors.accent,
          "--line": site.colors.line,

          backgroundColor: site.colors.bg,

          backgroundImage: site.background.image
            ? `linear-gradient(rgba(0,0,0,${site.background.overlay}), rgba(0,0,0,${site.background.overlay})), url("${site.background.image}")`
            : "none",

          backgroundPosition: site.background.position,
          backgroundSize: site.background.size,
          backgroundRepeat: site.background.repeat,
          backgroundAttachment: "fixed",

          minHeight: "100vh",
        } as React.CSSProperties
      }
    >
      {/* NAVIGATION */}

      <nav
        style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 6vw",
          borderBottom: `1px solid ${site.colors.line}`,
          background: "rgba(11,13,16,.72)",
          backdropFilter: "blur(14px)",
          color: site.colors.text,
          position: "relative",
          zIndex: 10,
        }}
      >
        <strong
          style={{
            fontSize: 18,
            letterSpacing: "-0.02em",
          }}
        >
          {site.name}
        </strong>

        <div
          style={{
            display: "flex",
            gap: 28,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          {site.visible.games && <a href="#games">GAMES</a>}
          {site.visible.roster && <a href="#roster">ROSTER</a>}
          {site.visible.about && <a href="#about">ABOUT</a>}
        </div>
      </nav>

      {/* HERO */}

      <section
        style={{
          minHeight: 650,
          position: "relative",
          overflow: "hidden",
          color: site.colors.text,
          borderBottom: `1px solid ${site.colors.line}`,
          background: "rgba(11,13,16,.18)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: 1200,
            height: 650,
            margin: "0 auto",
          }}
        >
          <p
            style={{
              position: "absolute",
              left: `calc(8vw + ${layout.intro.x}px)`,
              top: layout.intro.y + 70,
              width: layout.intro.width,
              margin: 0,
              color: site.colors.muted,
              fontSize: layout.intro.fontSize,
              fontWeight: 700,
              letterSpacing: "0.16em",
            }}
          >
            {site.intro}
          </p>

          {site.teamLogo && (
            <img
              src={site.teamLogo}
              alt={`${site.name} logo`}
              style={{
                position: "absolute",
                left: `calc(8vw + ${layout.logo.x}px)`,
                top: layout.logo.y + 70,
                width: layout.logo.width,
                height: layout.logo.height,
                objectFit: "contain",
              }}
            />
          )}

          <h1
            style={{
              position: "absolute",
              left: `calc(8vw + ${layout.name.x}px)`,
              top: layout.name.y + 70,
              width: layout.name.width,
              margin: 0,
              fontSize: layout.name.fontSize,
              lineHeight: 0.9,
              letterSpacing: "-0.07em",
              fontWeight: 900,
            }}
          >
            {site.name}
          </h1>

          <h2
            style={{
              position: "absolute",
              left: `calc(8vw + ${layout.tag.x}px)`,
              top: layout.tag.y + 70,
              width: layout.tag.width,
              margin: 0,
              color: site.colors.accent,
              fontSize: layout.tag.fontSize,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
            }}
          >
            {site.tag}
          </h2>

          <p
            style={{
              position: "absolute",
              left: `calc(8vw + ${layout.description.x}px)`,
              top: layout.description.y + 70,
              width: layout.description.width,
              margin: 0,
              color: site.colors.muted,
              fontSize: layout.description.fontSize,
              lineHeight: 1.7,
            }}
          >
            {site.description}
          </p>

          <div
            style={{
              position: "absolute",
              left: `calc(8vw + ${layout.buttons.x}px)`,
              top: layout.buttons.y + 70,
              display: "flex",
              gap: 12,
            }}
          >
            <a
              href={site.discord}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                padding: "0 22px",
                background: site.colors.accent,
                color: site.colors.bg,
                fontWeight: 800,
                textDecoration: "none",
                borderRadius: 7,
                fontSize: layout.buttons.fontSize,
              }}
            >
              {site.heroButton}
            </a>

            <a
              href={site.tiktok}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 48,
                padding: "0 22px",
                border: `1px solid ${site.colors.line}`,
                color: site.colors.text,
                fontWeight: 700,
                textDecoration: "none",
                borderRadius: 7,
                fontSize: layout.buttons.fontSize,
                background: "rgba(0,0,0,.2)",
              }}
            >
              TikTok
            </a>
          </div>
        </div>
      </section>

      {/* GAMES */}

      {site.visible.games && (
        <section
          id="games"
          style={{
            padding: "90px 8vw",
            background: "rgba(11,13,16,.88)",
            color: site.colors.text,
          }}
        >
          <p
            style={{
              color: site.colors.muted,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
            }}
          >
            01 / GAMES
          </p>

          <h2
            style={{
              margin: "12px 0 40px",
              fontSize: 42,
              letterSpacing: "-0.04em",
            }}
          >
            What we play
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 16,
            }}
          >
            <GameCard
              title={site.games.gt.title}
              description={site.games.gt.desc}
              logo={site.games.gt.logo}
              site={site}
            />

            <GameCard
              title={site.games.od.title}
              description={site.games.od.desc}
              logo={site.games.od.logo}
              site={site}
            />
          </div>
        </section>
      )}

      {/* ROSTER */}

      {site.visible.roster && (
        <section
          id="roster"
          style={{
            padding: "90px 8vw",
            background: "rgba(17,20,25,.94)",
            color: site.colors.text,
            borderTop: `1px solid ${site.colors.line}`,
            borderBottom: `1px solid ${site.colors.line}`,
          }}
        >
          <p
            style={{
              color: site.colors.muted,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
            }}
          >
            02 / ROSTER
          </p>

          <h2
            style={{
              margin: "12px 0 40px",
              fontSize: 42,
              letterSpacing: "-0.04em",
            }}
          >
            The team
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(230px, 1fr))",
              gap: 12,
            }}
          >
            {site.players.map((player) => (
              <div
                key={player.id}
                style={{
                  minHeight: 170,
                  padding: 22,
                  border: `1px solid ${site.colors.line}`,
                  borderRadius: 8,
                  background: site.colors.bg,
                }}
              >
                {player.image && (
                  <img
                    src={player.image}
                    alt={player.name}
                    style={{
                      width: 56,
                      height: 56,
                      objectFit: "cover",
                      borderRadius: 6,
                      marginBottom: 18,
                    }}
                  />
                )}

                <h3 style={{ margin: 0, fontSize: 20 }}>
                  {player.name}
                </h3>

                <p
                  style={{
                    margin: "7px 0 0",
                    color: site.colors.muted,
                    fontSize: 13,
                  }}
                >
                  {player.game}
                </p>

                <p
                  style={{
                    margin: "4px 0 0",
                    color: site.colors.accent,
                    fontSize: 11,
                    fontWeight: 800,
                    textTransform: "uppercase",
                  }}
                >
                  {player.role}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ABOUT */}

      {site.visible.about && (
        <section
          id="about"
          style={{
            padding: "90px 8vw",
            background: "rgba(11,13,16,.92)",
            color: site.colors.text,
          }}
        >
          <p
            style={{
              color: site.colors.muted,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.16em",
            }}
          >
            03 / ABOUT
          </p>

          <h2
            style={{
              margin: "12px 0 20px",
              fontSize: 42,
              letterSpacing: "-0.04em",
            }}
          >
            {site.name}
          </h2>

          <p
            style={{
              maxWidth: 700,
              color: site.colors.muted,
              lineHeight: 1.8,
              fontSize: 17,
            }}
          >
            {site.description}
          </p>
        </section>
      )}

      <footer
        style={{
          padding: "30px 8vw",
          borderTop: `1px solid ${site.colors.line}`,
          background: "rgba(11,13,16,.95)",
          color: site.colors.muted,
          fontSize: 12,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{site.footer}</span>

        <a
          href="/admin"
          style={{
            color: site.colors.muted,
            textDecoration: "none",
          }}
        >
          Admin
        </a>
      </footer>
    </main>
  );
}

function GameCard({
  title,
  description,
  logo,
  site,
}: {
  title: string;
  description: string;
  logo: string;
  site: Site;
}) {
  return (
    <div
      style={{
        minHeight: 240,
        padding: 28,
        border: `1px solid ${site.colors.line}`,
        borderRadius: 8,
        background: site.colors.card,
      }}
    >
      {logo && (
        <img
          src={logo}
          alt={title}
          style={{
            width: 60,
            height: 60,
            objectFit: "contain",
            marginBottom: 30,
          }}
        />
      )}

      <h3 style={{ margin: 0, fontSize: 25 }}>
        {title}
      </h3>

      <p
        style={{
          color: site.colors.muted,
          lineHeight: 1.6,
          marginTop: 10,
        }}
      >
        {description}
      </p>
    </div>
  );
}