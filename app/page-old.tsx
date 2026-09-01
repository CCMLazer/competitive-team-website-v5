"use client";

import { useEffect, useState } from "react";
import { DEFAULT, Site, Player } from "@/lib/site";
import { clearSite, getSite, putSite } from "@/lib/store";

function normalizeSite(data: any): Site {
  return {
    ...DEFAULT,
    ...(data || {}),

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

export default function Admin() {
  const [s, setS] = useState<Site>(DEFAULT);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSite()
      .then((site) => {
        setS(normalizeSite(site));
      })
      .catch((error) => {
        console.error(error);
        setS(DEFAULT);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const set = (path: string, value: any) => {
    setS((old) => {
      const n = structuredClone(old) as any;
      const parts = path.split(".");

      let o = n;

      for (let i = 0; i < parts.length - 1; i++) {
        if (!o[parts[i]]) {
          o[parts[i]] = {};
        }

        o = o[parts[i]];
      }

      o[parts[parts.length - 1]] = value;

      return normalizeSite(n);
    });
  };

  const upload = (path: string, file: File) => {
    const r = new FileReader();

    r.onload = () => {
      set(path, String(r.result));
    };

    r.readAsDataURL(file);
  };

  const addPlayer = () => {
    setS((x) => ({
      ...x,

      players: [
        ...x.players,

        {
          id: crypto.randomUUID(),
          name: "New Player",
          game: "Gorilla Tag",
          role: "Player",
          image: "",
        },
      ],
    }));
  };

  const remove = (id: string) => {
    setS((x) => ({
      ...x,
      players: x.players.filter((p) => p.id !== id),
    }));
  };

  const updatePlayer = (
    i: number,
    key: keyof Player,
    value: string
  ) => {
    setS((x) => {
      const players = [...x.players];

      players[i] = {
        ...players[i],
        [key]: value,
      };

      return {
        ...x,
        players,
      };
    });
  };

  const save = async () => {
    setSaving(true);

    try {
      await putSite(normalizeSite(s));

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 1300);
    } catch (error) {
      console.error(error);
      alert("Failed to save website. Check your terminal.");
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (
      !confirm(
        "Are you sure you want to reset the entire website?"
      )
    ) {
      return;
    }

    try {
      await clearSite();

      setS(DEFAULT);

      setSaved(true);

      setTimeout(() => {
        setSaved(false);
      }, 1300);
    } catch (error) {
      console.error(error);
      alert("Failed to reset website.");
    }
  };

  if (loading) {
    return (
      <main className="admin">
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "40px",
          }}
        >
          <div>
            <h1>Loading builder...</h1>
            <p>Connecting to your database...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="admin">

      <header className="adminHeader">
        <a href="/">← View site</a>

        <b>TEAM BUILDER</b>

        <span>V4</span>
      </header>

      <div className="builder">

        <aside>

          <div className="sideTitle">
            EDIT SITE
          </div>

          {[
            "branding",
            "hero",
            "games",
            "visibility",
            "colors",
            "roster",
            "links",
          ].map((x) => (
            <a
              href={"#" + x}
              key={x}
            >
              {x}
            </a>
          ))}

          <button onClick={reset}>
            Reset
          </button>

        </aside>

        <section className="settings">

          <div className="settingsIntro">

            <small>
              NO CODE NEEDED
            </small>

            <h1>
              Customize your team
            </h1>

            <p>
              Change something on the left and
              the preview updates instantly.
            </p>

          </div>

          <Block
            id="branding"
            title="Branding"
          >

            <Field
              label="Team name"
              value={s.name}
              onChange={(v) =>
                set("name", v)
              }
            />

            <Field
              label="Tagline"
              value={s.tag}
              onChange={(v) =>
                set("tag", v)
              }
            />

            <ImageField
              label="Team logo"
              value={s.teamLogo}
              onChange={(v) =>
                set("teamLogo", v)
              }
              onUpload={(f) =>
                upload("teamLogo", f)
              }
            />

          </Block>

          <Block
            id="hero"
            title="Hero"
          >

            <Field
              label="Small intro"
              value={s.intro}
              onChange={(v) =>
                set("intro", v)
              }
            />

            <Field
              label="Main tagline"
              value={s.tag}
              onChange={(v) =>
                set("tag", v)
              }
            />

            <Area
              label="Hero description"
              value={s.description}
              onChange={(v) =>
                set("description", v)
              }
            />

            <Field
              label="Main button text"
              value={s.heroButton}
              onChange={(v) =>
                set("heroButton", v)
              }
            />

          </Block>

          <Block
            id="games"
            title="Games"
          >

            <GameEdit
              title="Gorilla Tag"
              data={s.games.gt}
              set={(k, v) =>
                set(
                  "games.gt." + k,
                  v
                )
              }
              upload={(f) =>
                upload(
                  "games.gt.logo",
                  f
                )
              }
            />

            <GameEdit
              title="Orion Drift"
              data={s.games.od}
              set={(k, v) =>
                set(
                  "games.od." + k,
                  v
                )
              }
              upload={(f) =>
                upload(
                  "games.od.logo",
                  f
                )
              }
            />

          </Block>

          <Block
            id="visibility"
            title="Sections"
          >

            <Toggle
              label="Games section"
              value={s.visible.games}
              onChange={(v) =>
                set(
                  "visible.games",
                  v
                )
              }
            />

            <Toggle
              label="Roster section"
              value={s.visible.roster}
              onChange={(v) =>
                set(
                  "visible.roster",
                  v
                )
              }
            />

            <Toggle
              label="About section"
              value={s.visible.about}
              onChange={(v) =>
                set(
                  "visible.about",
                  v
                )
              }
            />

          </Block>

          <Block
            id="colors"
            title="Colors"
          >

            <div className="colorGrid">

              {Object.entries(
                s.colors
              ).map(([k, v]) => (

                <div
                  className="colorRow"
                  key={k}
                >

                  <label>

                    {k}

                    <input
                      value={v}
                      onChange={(e) =>
                        set(
                          "colors." + k,
                          e.target.value
                        )
                      }
                    />

                  </label>

                  <input
                    type="color"
                    value={v}
                    onChange={(e) =>
                      set(
                        "colors." + k,
                        e.target.value
                      )
                    }
                  />

                </div>

              ))}

            </div>

          </Block>

          <Block
            id="roster"
            title="Roster"
          >

            <div className="rosterTools">

              <span>
                {s.players.length} players
              </span>

              <button
                onClick={addPlayer}
              >
                + Add player
              </button>

            </div>

            {s.players.map(
              (p, i) => (

                <div
                  className="playerEdit"
                  key={p.id}
                >

                  <div className="playerEditHead">

                    <b>
                      {p.name}
                    </b>

                    <button
                      onClick={() =>
                        remove(p.id)
                      }
                    >
                      Remove
                    </button>

                  </div>

                  <Field
                    label="Name"
                    value={p.name}
                    onChange={(v) =>
                      updatePlayer(
                        i,
                        "name",
                        v
                      )
                    }
                  />

                  <Field
                    label="Game"
                    value={p.game}
                    onChange={(v) =>
                      updatePlayer(
                        i,
                        "game",
                        v
                      )
                    }
                  />

                  <Field
                    label="Role"
                    value={p.role}
                    onChange={(v) =>
                      updatePlayer(
                        i,
                        "role",
                        v
                      )
                    }
                  />

                  <ImageField
                    label="Player image"
                    value={p.image}
                    onChange={(v) =>
                      updatePlayer(
                        i,
                        "image",
                        v
                      )
                    }
                    onUpload={(f) => {

                      const r =
                        new FileReader();

                      r.onload = () =>
                        updatePlayer(
                          i,
                          "image",
                          String(
                            r.result
                          )
                        );

                      r.readAsDataURL(f);

                    }}
                  />

                </div>

              )
            )}

          </Block>

          <Block
            id="links"
            title="Socials"
          >

            <Field
              label="Discord link"
              value={s.discord}
              onChange={(v) =>
                set(
                  "discord",
                  v
                )
              }
            />

            <Field
              label="TikTok link"
              value={s.tiktok}
              onChange={(v) =>
                set(
                  "tiktok",
                  v
                )
              }
            />

            <Field
              label="Footer text"
              value={s.footer}
              onChange={(v) =>
                set(
                  "footer",
                  v
                )
              }
            />

          </Block>

        </section>

        <Preview site={s} />

      </div>

      <div className="saveBar">

        <button
          className="saveButton"
          onClick={save}
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : saved
            ? "✓ Saved"
            : "Save changes"}
        </button>

      </div>

    </main>
  );
}

function Block({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="block"
    >

      <div className="blockHead">

        <span>
          EDIT
        </span>

        <h2>
          {title}
        </h2>

      </div>

      {children}

    </section>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">

      {label}

      <input
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

    </label>
  );
}

function Area({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="field">

      {label}

      <textarea
        rows={5}
        value={value || ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

    </label>
  );
}

function ImageField({
  label,
  value,
  onChange,
  onUpload,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onUpload: (f: File) => void;
}) {
  return (
    <div className="imageField">

      <Field
        label={
          label +
          " URL (optional)"
        }
        value={value}
        onChange={onChange}
      />

      <label className="upload">

        Choose from computer

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {

            const f =
              e.target.files?.[0];

            if (f) {
              onUpload(f);
            }

          }}
        />

      </label>

      {value && (
        <img
          src={value}
          alt="preview"
        />
      )}

    </div>
  );
}

function GameEdit({
  title,
  data,
  set,
  upload,
}: {
  title: string;
  data: {
    title: string;
    desc: string;
    logo: string;
  };
  set: (
    k: string,
    v: string
  ) => void;
  upload: (f: File) => void;
}) {
  return (
    <div className="gameEdit">

      <h3>
        {title}
      </h3>

      <Field
        label="Title"
        value={data.title}
        onChange={(v) =>
          set("title", v)
        }
      />

      <Field
        label="Description"
        value={data.desc}
        onChange={(v) =>
          set("desc", v)
        }
      />

      <ImageField
        label="Logo"
        value={data.logo}
        onChange={(v) =>
          set("logo", v)
        }
        onUpload={upload}
      />

    </div>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="toggle">

      <span>
        {label}
      </span>

      <button
        type="button"
        className={
          value ? "on" : ""
        }
        onClick={() =>
          onChange(!value)
        }
      >
        <i />
      </button>

    </label>
  );
}

function Preview({
  site: s,
}: {
  site: Site;
}) {
  return (
    <div className="preview">

      <div className="previewBar">

        <span>
          LIVE PREVIEW
        </span>

        <a
          href="/"
          target="_blank"
        >
          Open ↗
        </a>

      </div>

      <div
        className="previewFrame"
        style={
          {
            "--bg": s.colors.bg,
            "--card": s.colors.card,
            "--text": s.colors.text,
            "--muted": s.colors.muted,
            "--accent": s.colors.accent,
            "--line": s.colors.line,
          } as React.CSSProperties
        }
      >

        <div className="pNav">

          <b>
            {s.name}
          </b>

          <span>
            GAMES　ROSTER　ABOUT
          </span>

        </div>

        <div className="pHero">

          <small>
            {s.intro}
          </small>

          <strong>
            {s.name}
          </strong>

          <em>
            {s.tag}
          </em>

          <p>
            {s.description}
          </p>

          <div>

            <button>
              {s.heroButton}
            </button>

            <button>
              TikTok
            </button>

          </div>

        </div>

        {s.visible.games && (

          <div className="pSection">

            <small>
              01 / GAMES
            </small>

            <div className="pCards">

              <div>

                <b>
                  {s.games.gt.title}
                </b>

                <p>
                  {s.games.gt.desc}
                </p>

              </div>

              <div>

                <b>
                  {s.games.od.title}
                </b>

                <p>
                  {s.games.od.desc}
                </p>

              </div>

            </div>

          </div>

        )}

        {s.visible.roster && (

          <div className="pSection">

            <small>
              02 / ROSTER
            </small>

            <div className="pRoster">

              {s.players
                .slice(0, 4)
                .map((p) => (

                  <div key={p.id}>

                    <b>
                      {p.name}
                    </b>

                    <small>
                      {p.game}
                    </small>

                  </div>

                ))}

            </div>

          </div>

        )}

      </div>

    </div>
  );
}