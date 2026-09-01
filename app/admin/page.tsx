"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT, Site, Player } from "@/lib/site";
import { clearSite, getSite, putSite } from "@/lib/store";
import { requireAdmin, isStatusAdmin } from "@/lib/adminGuard";
import { supabase } from "@/lib/supabase";

/* ================================================== */
/* TYPES                                              */
/* ================================================== */

type LayoutItem = {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
};

type Layout = {
  intro: LayoutItem;
  logo: LayoutItem;
  name: LayoutItem;
  tag: LayoutItem;
  description: LayoutItem;
  buttons: LayoutItem;
};

type TeamMember = {
  id: string;
  user_id: string;
  username: string;
  created_at: string;
};

type StatusRow = {
  id: string;
  user_id: string;
  status: string;
  updated_at: string;
};

type RoleRow = {
  id: string;
  user_id: string;
  role_name: string;
  icon: string;
  created_at?: string;
};

type ChatMessage = {
  id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  message: string;
  created_at: string;
};

const OWNER_ID =
  "82530f6b-67cf-4283-84b4-b58a1a299b5e";

const STATUS_OPTIONS = [
  "Online",
  "Offline",
  "Level Editing",
  "In Game",
  "Working",
  "Away",
  "Busy",
];

const DEFAULT_LAYOUT: Layout = {
  intro: {
    x: 40,
    y: 50,
    width: 500,
    height: 30,
    fontSize: 12,
  },

  logo: {
    x: 40,
    y: 95,
    width: 90,
    height: 90,
    fontSize: 16,
  },

  name: {
    x: 40,
    y: 200,
    width: 700,
    height: 100,
    fontSize: 82,
  },

  tag: {
    x: 40,
    y: 315,
    width: 650,
    height: 60,
    fontSize: 30,
  },

  description: {
    x: 40,
    y: 390,
    width: 620,
    height: 100,
    fontSize: 18,
  },

  buttons: {
    x: 40,
    y: 500,
    width: 300,
    height: 55,
    fontSize: 14,
  },
};

const ELEMENT_NAMES: Record<keyof Layout, string> = {
  intro: "Small intro",
  logo: "Team logo",
  name: "Team name",
  tag: "Tagline",
  description: "Description",
  buttons: "Buttons",
};

/* ================================================== */
/* NORMALIZE SITE                                     */
/* ================================================== */

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

    background: {
      ...(DEFAULT as any).background,
      ...(data?.background || {}),
    },

    layout: {
      ...DEFAULT_LAYOUT,
      ...(data?.layout || {}),

      intro: {
        ...DEFAULT_LAYOUT.intro,
        ...(data?.layout?.intro || {}),
      },

      logo: {
        ...DEFAULT_LAYOUT.logo,
        ...(data?.layout?.logo || {}),
      },

      name: {
        ...DEFAULT_LAYOUT.name,
        ...(data?.layout?.name || {}),
      },

      tag: {
        ...DEFAULT_LAYOUT.tag,
        ...(data?.layout?.tag || {}),
      },

      description: {
        ...DEFAULT_LAYOUT.description,
        ...(data?.layout?.description || {}),
      },

      buttons: {
        ...DEFAULT_LAYOUT.buttons,
        ...(data?.layout?.buttons || {}),
      },
    },
  };
}

/* ================================================== */
/* ADMIN                                              */
/* ================================================== */

export default function Admin() {
  const [s, setS] = useState<Site>(DEFAULT);

  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [statusAdmin, setStatusAdmin] = useState(false);

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);

  const [currentUserId, setCurrentUserId] =
    useState("");

  const [currentUsername, setCurrentUsername] =
    useState("");

  const [currentAvatar, setCurrentAvatar] =
    useState("");

  const [currentStatus, setCurrentStatus] =
    useState("Offline");

  const [selectedMember, setSelectedMember] =
    useState<TeamMember | null>(null);

  const [memberSearch, setMemberSearch] =
    useState("");

  const [newRoleName, setNewRoleName] =
    useState("");

  const [newRoleIcon, setNewRoleIcon] =
    useState("");

  const [roleSaving, setRoleSaving] =
    useState(false);

  const [statusSaving, setStatusSaving] =
    useState(false);

  const [teamLoading, setTeamLoading] =
    useState(false);

  const [selected, setSelected] =
    useState<keyof Layout>("name");

  const canvasRef =
    useRef<HTMLDivElement>(null);

  /* ================================================== */
  /* CHAT STATE                                         */
  /* ================================================== */

  const [chatMessages, setChatMessages] =
    useState<ChatMessage[]>([]);

  const [chatInput, setChatInput] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);

  const [chatSending, setChatSending] =
    useState(false);

  const chatEndRef =
    useRef<HTMLDivElement>(null);

  /* ================================================== */
  /* LOAD EVERYTHING                                    */
  /* ================================================== */

  useEffect(() => {
    async function start() {
      try {
        const user = await requireAdmin();

        if (!user) {
          setLoading(false);
          return;
        }

        setCurrentUserId(user.id);

        /*
         * Try to get profile information.
         */

        try {
          const { data: profile } =
            await supabase
              .from("admin_profiles")
              .select("*")
              .eq("user_id", user.id)
              .maybeSingle();

          if (profile) {
            setCurrentUsername(
              profile.username ||
                user.email?.split("@")[0] ||
                "Admin"
            );

            setCurrentAvatar(
              profile.avatar_url || ""
            );
          } else {
            setCurrentUsername(
              user.email?.split("@")[0] ||
                "Admin"
            );
          }
        } catch {
          setCurrentUsername(
            user.email?.split("@")[0] ||
              "Admin"
          );
        }

        const site = await getSite();

        setS(normalizeSite(site));

        const allowed =
          await isStatusAdmin();

        setStatusAdmin(allowed);

        /*
         * Chat is available to everyone
         * who can access /admin.
         */

        await loadChat();

        if (allowed) {
          await loadTeam(user.id);
        }
      } catch (error) {
        console.error(
          "ADMIN LOAD ERROR:",
          error
        );

        setS(normalizeSite(DEFAULT));
      } finally {
        setLoading(false);
      }
    }

    start();
  }, []);

  /* ================================================== */
  /* CHAT REALTIME                                      */
  /* ================================================== */

  useEffect(() => {
    if (!currentUserId) {
      return;
    }

    const channel =
      supabase
        .channel("admin-team-chat")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "team_chat_messages",
          },
          (payload) => {
            if (
              payload.eventType ===
              "INSERT"
            ) {
              const message =
                payload.new as ChatMessage;

              setChatMessages((old) => {
                if (
                  old.some(
                    (x) =>
                      x.id ===
                      message.id
                  )
                ) {
                  return old;
                }

                return [
                  ...old,
                  message,
                ].sort(
                  (a, b) =>
                    new Date(
                      a.created_at
                    ).getTime() -
                    new Date(
                      b.created_at
                    ).getTime()
                );
              });
            }

            if (
              payload.eventType ===
              "DELETE"
            ) {
              const deleted =
                payload.old as ChatMessage;

              setChatMessages((old) =>
                old.filter(
                  (x) =>
                    x.id !==
                    deleted.id
                )
              );
            }

            if (
              payload.eventType ===
              "UPDATE"
            ) {
              const updated =
                payload.new as ChatMessage;

              setChatMessages((old) =>
                old.map((x) =>
                  x.id ===
                  updated.id
                    ? updated
                    : x
                )
              );
            }
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        channel
      );
    };
  }, [currentUserId]);

  /* ================================================== */
  /* CHAT AUTO SCROLL                                   */
  /* ================================================== */

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chatMessages]);

  /* ================================================== */
  /* LOAD CHAT                                          */
  /* ================================================== */

  const loadChat = async () => {
    setChatLoading(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("team_chat_messages")
        .select("*")
        .order("created_at", {
          ascending: true,
        });

      if (error) {
        console.error(
          "FAILED TO LOAD CHAT:",
          error
        );

        return;
      }

      setChatMessages(
        (data || []) as ChatMessage[]
      );
    } finally {
      setChatLoading(false);
    }
  };

  /* ================================================== */
  /* SEND CHAT MESSAGE                                  */
  /* ================================================== */

  const sendChatMessage = async () => {
    const message =
      chatInput.trim();

    if (!message) {
      return;
    }

    if (!currentUserId) {
      return;
    }

    if (chatSending) {
      return;
    }

    setChatSending(true);

    try {
      const {
        data,
        error,
      } = await supabase
        .from("team_chat_messages")
        .insert({
          user_id:
            currentUserId,

          username:
            currentUsername ||
            "Admin",

          avatar_url:
            currentAvatar || "",

          message,
        })
        .select()
        .single();

      if (error) {
        console.error(
          "FAILED TO SEND CHAT:",
          error
        );

        alert(
          "Failed to send message."
        );

        return;
      }

      /*
       * Realtime normally adds this.
       * We also add it locally if needed.
       */

      if (data) {
        setChatMessages((old) => {
          if (
            old.some(
              (x) =>
                x.id ===
                data.id
            )
          ) {
            return old;
          }

          return [
            ...old,
            data as ChatMessage,
          ];
        });
      }

      setChatInput("");
    } finally {
      setChatSending(false);
    }
  };

  /* ================================================== */
  /* CHAT ENTER KEY                                     */
  /* ================================================== */

  const handleChatKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      sendChatMessage();
    }
  };

  /* ================================================== */
  /* DELETE CHAT MESSAGE                                */
  /* ================================================== */

  const deleteChatMessage = async (
    message: ChatMessage
  ) => {
    const canDelete =
      message.user_id ===
        currentUserId ||
      currentUserId ===
        OWNER_ID;

    if (!canDelete) {
      return;
    }

    if (
      !confirm(
        "Delete this message?"
      )
    ) {
      return;
    }

    try {
      const {
        error,
      } = await supabase
        .from("team_chat_messages")
        .delete()
        .eq(
          "id",
          message.id
        );

      if (error) {
        console.error(
          "FAILED TO DELETE CHAT MESSAGE:",
          error
        );

        alert(
          "Failed to delete message."
        );

        return;
      }

      setChatMessages((old) =>
        old.filter(
          (x) =>
            x.id !==
            message.id
        )
      );
    } catch (error) {
      console.error(
        "CHAT DELETE ERROR:",
        error
      );

      alert(
        "Failed to delete message."
      );
    }
  };

  /* ================================================== */
  /* LOAD TEAM                                          */
  /* ================================================== */

  const loadTeam = async (
    userId: string
  ) => {
    setTeamLoading(true);

    try {
      const {
        data: memberData,
        error: memberError,
      } = await supabase
        .from("team_members")
        .select("*")
        .order("username", {
          ascending: true,
        });

      if (memberError) {
        console.error(
          "FAILED TO LOAD MEMBERS:",
          memberError
        );
      } else {
        setMembers(
          memberData || []
        );

        const me =
          (memberData || []).find(
            (x) =>
              x.user_id ===
              userId
          );

        if (me) {
          setCurrentUsername(
            me.username
          );
        }
      }

      const {
        data: statusData,
        error: statusError,
      } = await supabase
        .from("team_status")
        .select("*");

      if (statusError) {
        console.error(
          "FAILED TO LOAD STATUSES:",
          statusError
        );
      } else {
        setStatuses(
          statusData || []
        );

        const mine =
          (statusData || []).find(
            (x) =>
              x.user_id ===
              userId
          );

        if (mine?.status) {
          setCurrentStatus(
            mine.status
          );
        }
      }

      const {
        data: roleData,
        error: roleError,
      } = await supabase
        .from("team_roles")
        .select("*")
        .order("created_at", {
          ascending: true,
        });

      if (roleError) {
        console.error(
          "FAILED TO LOAD ROLES:",
          roleError
        );
      } else {
        setRoles(
          roleData || []
        );
      }
    } finally {
      setTeamLoading(false);
    }
  };

  /* ================================================== */
  /* SITE EDITOR                                        */
  /* ================================================== */

  const set = (
    path: string,
    value: any
  ) => {
    setS((old) => {
      const n =
        structuredClone(old) as any;

      const parts =
        path.split(".");

      let o = n;

      for (
        let i = 0;
        i <
        parts.length - 1;
        i++
      ) {
        if (!o[parts[i]]) {
          o[parts[i]] = {};
        }

        o =
          o[parts[i]];
      }

      o[
        parts[
          parts.length - 1
        ]
      ] = value;

      return normalizeSite(n);
    });
  };

  /* ================================================== */
  /* UPLOAD                                             */
  /* ================================================== */

  const upload = (
    path: string,
    file: File
  ) => {
    const reader =
      new FileReader();

    reader.onload = () => {
      set(
        path,
        String(
          reader.result
        )
      );
    };

    reader.readAsDataURL(file);
  };

  /* ================================================== */
  /* LAYOUT                                             */
  /* ================================================== */

  const updateLayout = (
    element: keyof Layout,
    changes: Partial<LayoutItem>
  ) => {
    setS((old) => ({
      ...old,

      layout: {
        ...((old as any).layout ||
          {}),

        [element]: {
          ...(
            (old as any).layout?.[
              element
            ] ||
            DEFAULT_LAYOUT[
              element
            ]
          ),

          ...changes,
        },
      },
    }));
  };

  const resetLayout = () => {
    if (
      !confirm(
        "Reset all element positions and sizes?"
      )
    ) {
      return;
    }

    setS((old) => ({
      ...old,

      layout:
        structuredClone(
          DEFAULT_LAYOUT
        ),
    }));
  };

  /* ================================================== */
  /* ROSTER                                             */
  /* ================================================== */

  const addPlayer = () => {
    setS((old) => ({
      ...old,

      players: [
        ...old.players,

        {
          id:
            crypto.randomUUID(),

          name:
            "New Player",

          game:
            "Gorilla Tag",

          role:
            "Player",

          image:
            "",
        },
      ],
    }));
  };

  const removePlayer = (
    id: string
  ) => {
    if (
      !confirm(
        "Remove this player from the roster?"
      )
    ) {
      return;
    }

    setS((old) => ({
      ...old,

      players:
        old.players.filter(
          (p) =>
            p.id !== id
        ),
    }));
  };

  const updatePlayer = (
    index: number,
    key: keyof Player,
    value: string
  ) => {
    setS((old) => {
      const players = [
        ...old.players,
      ];

      players[index] = {
        ...players[index],
        [key]: value,
      };

      return {
        ...old,
        players,
      };
    });
  };

  /* ================================================== */
  /* SAVE                                               */
  /* ================================================== */

  const save = async () => {
    setSaving(true);

    try {
      await putSite(
        normalizeSite(s)
      );

      setSaved(true);

      setTimeout(
        () =>
          setSaved(false),
        1500
      );
    } catch (error) {
      console.error(
        "FAILED TO SAVE:",
        error
      );

      alert(
        "Failed to save website. Check the terminal."
      );
    } finally {
      setSaving(false);
    }
  };

  /* ================================================== */
  /* RESET                                              */
  /* ================================================== */

  const reset = async () => {
    if (
      !confirm(
        "Reset the entire website?"
      )
    ) {
      return;
    }

    try {
      await clearSite();

      setS(
        normalizeSite(
          DEFAULT
        )
      );

      setSaved(true);

      setTimeout(
        () =>
          setSaved(false),
        1500
      );
    } catch (error) {
      console.error(
        "FAILED TO RESET:",
        error
      );

      alert(
        "Failed to reset website."
      );
    }
  };

  /* ================================================== */
  /* STATUS                                             */
  /* ================================================== */

  const getStatus = (
    userId: string
  ) => {
    const row =
      statuses.find(
        (x) =>
          x.user_id ===
          userId
      );

    if (!row) {
      return "Offline";
    }

    const last =
      new Date(
        row.updated_at
      ).getTime();

    const now =
      Date.now();

    const twoMinutes =
      2 * 60 * 1000;

    if (
      now - last >
      twoMinutes
    ) {
      return "Offline";
    }

    return row.status;
  };

  const statusColor = (
    status: string
  ) => {
    if (
      status ===
      "Online"
    ) {
      return "#45ff78";
    }

    if (
      status ===
      "Offline"
    ) {
      return "#777";
    }

    if (
      status ===
      "Level Editing"
    ) {
      return "#e8ff3f";
    }

    if (
      status ===
      "Busy"
    ) {
      return "#ff6464";
    }

    return "#62b0ff";
  };

  /* ================================================== */
  /* SAVE STATUS                                        */
  /* ================================================== */

  const saveMyStatus =
    async (
      value: string
    ) => {
      if (!statusAdmin) {
        return;
      }

      setStatusSaving(
        true
      );

      try {
        const {
          data: existing,
          error: findError,
        } = await supabase
          .from(
            "team_status"
          )
          .select("id")
          .eq(
            "user_id",
            currentUserId
          )
          .maybeSingle();

        if (findError) {
          throw findError;
        }

        if (existing?.id) {
          const {
            error,
          } = await supabase
            .from(
              "team_status"
            )
            .update({
              status:
                value,

              updated_at:
                new Date().toISOString(),
            })
            .eq(
              "id",
              existing.id
            );

          if (error) {
            throw error;
          }
        } else {
          const {
            error,
          } = await supabase
            .from(
              "team_status"
            )
            .insert({
              user_id:
                currentUserId,

              status:
                value,

              updated_at:
                new Date().toISOString(),
            });

          if (error) {
            throw error;
          }
        }

        setCurrentStatus(
          value
        );

        await loadTeam(
          currentUserId
        );
      } catch (error) {
        console.error(
          "FAILED TO SAVE STATUS:",
          error
        );

        alert(
          "Failed to save status."
        );
      } finally {
        setStatusSaving(
          false
        );
      }
    };

  /* ================================================== */
  /* TEAM MEMBERS                                       */
  /* ================================================== */

  const removeMember =
    async (
      member: TeamMember
    ) => {
      if (
        member.user_id ===
        OWNER_ID
      ) {
        alert(
          "The Owner cannot be removed."
        );

        return;
      }

      if (
        !confirm(
          `Remove ${member.username} from the team?`
        )
      ) {
        return;
      }

      try {
        const {
          error,
        } = await supabase
          .from(
            "team_members"
          )
          .delete()
          .eq(
            "id",
            member.id
          );

        if (error) {
          throw error;
        }

        setMembers((old) =>
          old.filter(
            (x) =>
              x.id !==
              member.id
          )
        );

        if (
          selectedMember?.id ===
          member.id
        ) {
          setSelectedMember(
            null
          );
        }
      } catch (error) {
        console.error(
          "FAILED TO REMOVE MEMBER:",
          error
        );

        alert(
          "Failed to remove team member."
        );
      }
    };

  /* ================================================== */
  /* ROLES                                              */
  /* ================================================== */

  const getMemberRoles = (
    userId: string
  ) => {
    return roles.filter(
      (role) =>
        role.user_id ===
        userId
    );
  };

  const createRoleForMember =
    async () => {
      if (
        !selectedMember
      ) {
        alert(
          "Select a team member first."
        );

        return;
      }

      const name =
        newRoleName.trim();

      if (!name) {
        alert(
          "Enter a role name."
        );

        return;
      }

      setRoleSaving(
        true
      );

      try {
        const {
          data,
          error,
        } = await supabase
          .from(
            "team_roles"
          )
          .insert({
            user_id:
              selectedMember.user_id,

            role_name:
              name,

            icon:
              newRoleIcon ||
              "",
          })
          .select()
          .single();

        if (error) {
          throw error;
        }

        setRoles((old) => [
          ...old,
          data,
        ]);

        setNewRoleName(
          ""
        );

        setNewRoleIcon(
          ""
        );
      } catch (error) {
        console.error(
          "FAILED TO CREATE ROLE:",
          error
        );

        alert(
          "Failed to create role."
        );
      } finally {
        setRoleSaving(
          false
        );
      }
    };

  const deleteRole =
    async (
      role: RoleRow
    ) => {
      if (
        !confirm(
          `Remove the ${role.role_name} role?`
        )
      ) {
        return;
      }

      try {
        const {
          error,
        } = await supabase
          .from(
            "team_roles"
          )
          .delete()
          .eq(
            "id",
            role.id
          );

        if (error) {
          throw error;
        }

        setRoles((old) =>
          old.filter(
            (x) =>
              x.id !==
              role.id
          )
        );
      } catch (error) {
        console.error(
          "FAILED TO DELETE ROLE:",
          error
        );

        alert(
          "Failed to delete role."
        );
      }
    };

  const uploadRoleIcon = (
    role: RoleRow,
    file: File
  ) => {
    const reader =
      new FileReader();

    reader.onload =
      async () => {
        const icon =
          String(
            reader.result
          );

        try {
          const {
            error,
          } = await supabase
            .from(
              "team_roles"
            )
            .update({
              icon,
            })
            .eq(
              "id",
              role.id
            );

          if (error) {
            throw error;
          }

          setRoles((old) =>
            old.map((x) =>
              x.id ===
              role.id
                ? {
                    ...x,
                    icon,
                  }
                : x
            )
          );
        } catch (error) {
          console.error(
            "FAILED TO UPDATE ROLE ICON:",
            error
          );

          alert(
            "Failed to update role icon."
          );
        }
      };

    reader.readAsDataURL(
      file
    );
  };

  const filteredMembers =
    members.filter(
      (member) =>
        member.username
          .toLowerCase()
          .includes(
            memberSearch
              .toLowerCase()
          )
    );

  /* ================================================== */
  /* LOADING                                            */
  /* ================================================== */

  if (loading) {
    return (
      <main className="admin">
        <div
          style={{
            minHeight:
              "100vh",

            display:
              "grid",

            placeItems:
              "center",

            color:
              "#fff",
          }}
        >
          <div>
            <h1>
              Checking access...
            </h1>

            <p>
              Connecting to
              your admin
              account...
            </p>
          </div>
        </div>
      </main>
    );
  }

  const layout =
    ((s as any)
      .layout as Layout) ||
    DEFAULT_LAYOUT;

  const current =
    layout[selected] ||
    DEFAULT_LAYOUT[
      selected
    ];

  return (
    <main className="admin">

      {/* ================================================== */}
      {/* HEADER                                             */}
      {/* ================================================== */}

      <header className="adminHeader">

        <a href="/">
          ← View site
        </a>

        <b>
          TEAM BUILDER
        </b>

        <span>
          V6
        </span>

      </header>

      {/* ================================================== */}
      {/* BUILDER                                            */}
      {/* ================================================== */}

      <div className="builder">

        {/* ================================================== */}
        {/* SIDEBAR                                            */}
        {/* ================================================== */}

        <aside>

          <div className="sideTitle">
            EDIT SITE
          </div>

          {[
            "branding",
            "hero",
            "games",
            "visibility",
            "background",
            "layout",
            "colors",
            "roster",
            "links",
          ].map(
            (item) => (
              <a
                href={`#${item}`}
                key={item}
              >
                {item}
              </a>
            )
          )}

          {statusAdmin && (
            <>
              <div
                className="sideTitle"
                style={{
                  marginTop:
                    20,
                }}
              >
                TEAM
              </div>

              <a href="#team">
                Members
              </a>

              <a href="#status">
                Status
              </a>

              <a href="#roles">
                Roles
              </a>
            </>
          )}

          <div
            className="sideTitle"
            style={{
              marginTop:
                20,
            }}
          >
            COMMUNICATION
          </div>

          <a href="#chat">
            Team Chat
          </a>

          <a
            href="/admin/account"
            style={{
              marginTop:
                16,
            }}
          >
            My Account
          </a>

          <button
            onClick={reset}
          >
            Reset
          </button>

        </aside>

        {/* ================================================== */}
        {/* SETTINGS                                           */}
        {/* ================================================== */}

        <section className="settings">

          <div className="settingsIntro">

            <small>
              NO CODE NEEDED
            </small>

            <h1>
              Customize your team
            </h1>

            <p>
              Edit your website,
              team members,
              roles, statuses,
              and communicate
              with your staff.
            </p>

          </div>

          {/* ================================================== */}
          {/* BRANDING                                           */}
          {/* ================================================== */}

          <Block
            id="branding"
            title="Branding"
          >

            <Field
              label="Team name"
              value={s.name}
              onChange={(v) =>
                set(
                  "name",
                  v
                )
              }
            />

            <Field
              label="Tagline"
              value={s.tag}
              onChange={(v) =>
                set(
                  "tag",
                  v
                )
              }
            />

            <ImageField
              label="Team logo"
              value={
                s.teamLogo
              }
              onChange={(v) =>
                set(
                  "teamLogo",
                  v
                )
              }
              onUpload={(f) =>
                upload(
                  "teamLogo",
                  f
                )
              }
            />

          </Block>

          {/* ================================================== */}
          {/* HERO                                               */}
          {/* ================================================== */}

          <Block
            id="hero"
            title="Hero"
          >

            <Field
              label="Small intro"
              value={
                s.intro
              }
              onChange={(v) =>
                set(
                  "intro",
                  v
                )
              }
            />

            <Field
              label="Main tagline"
              value={
                s.tag
              }
              onChange={(v) =>
                set(
                  "tag",
                  v
                )
              }
            />

            <Area
              label="Hero description"
              value={
                s.description
              }
              onChange={(v) =>
                set(
                  "description",
                  v
                )
              }
            />

            <Field
              label="Main button text"
              value={
                s.heroButton
              }
              onChange={(v) =>
                set(
                  "heroButton",
                  v
                )
              }
            />

          </Block>

          {/* ================================================== */}
          {/* GAMES                                              */}
          {/* ================================================== */}

          <Block
            id="games"
            title="Games"
          >

            <GameEdit
              title="Gorilla Tag"
              data={
                s.games.gt
              }
              set={(
                key,
                value
              ) =>
                set(
                  `games.gt.${key}`,
                  value
                )
              }
              upload={(file) =>
                upload(
                  "games.gt.logo",
                  file
                )
              }
            />

            <GameEdit
              title="Orion Drift"
              data={
                s.games.od
              }
              set={(
                key,
                value
              ) =>
                set(
                  `games.od.${key}`,
                  value
                )
              }
              upload={(file) =>
                upload(
                  "games.od.logo",
                  file
                )
              }
            />

          </Block>

          {/* ================================================== */}
          {/* VISIBILITY                                         */}
          {/* ================================================== */}

          <Block
            id="visibility"
            title="Sections"
          >

            <Toggle
              label="Games section"
              value={
                s.visible
                  .games
              }
              onChange={(v) =>
                set(
                  "visible.games",
                  v
                )
              }
            />

            <Toggle
              label="Roster section"
              value={
                s.visible
                  .roster
              }
              onChange={(v) =>
                set(
                  "visible.roster",
                  v
                )
              }
            />

            <Toggle
              label="About section"
              value={
                s.visible
                  .about
              }
              onChange={(v) =>
                set(
                  "visible.about",
                  v
                )
              }
            />

          </Block>

          {/* ================================================== */}
          {/* BACKGROUND                                         */}
          {/* ================================================== */}

          <Block
            id="background"
            title="Background"
          >

            <ImageField
              label="Background image"
              value={
                (s as any)
                  .background
                  ?.image || ""
              }
              onChange={(v) =>
                set(
                  "background.image",
                  v
                )
              }
              onUpload={(f) =>
                upload(
                  "background.image",
                  f
                )
              }
            />

            <Field
              label="Position"
              value={
                (s as any)
                  .background
                  ?.position ||
                "center"
              }
              onChange={(v) =>
                set(
                  "background.position",
                  v
                )
              }
            />

            <Field
              label="Size"
              value={
                (s as any)
                  .background
                  ?.size ||
                "cover"
              }
              onChange={(v) =>
                set(
                  "background.size",
                  v
                )
              }
            />

            <label className="field">
              Overlay

              <input
                type="range"
                min="0"
                max="0.9"
                step="0.05"
                value={
                  (s as any)
                    .background
                    ?.overlay ??
                  0.35
                }
                onChange={(
                  e
                ) =>
                  set(
                    "background.overlay",
                    Number(
                      e.target
                        .value
                    )
                  )
                }
              />
            </label>

          </Block>

          {/* ================================================== */}
          {/* LAYOUT                                             */}
          {/* ================================================== */}

          <Block
            id="layout"
            title="Layout / Canvas"
          >

            <div className="elementList">

              {(
                Object.keys(
                  ELEMENT_NAMES
                ) as Array<
                  keyof Layout
                >
              ).map(
                (key) => (
                  <button
                    key={key}
                    className={
                      selected ===
                      key
                        ? "selectedElement"
                        : ""
                    }
                    onClick={() =>
                      setSelected(
                        key
                      )
                    }
                  >

                    <span>
                      {
                        ELEMENT_NAMES[
                          key
                        ]
                      }
                    </span>

                    <small>
                      {Math.round(
                        layout[
                          key
                        ]
                          .width
                      )}
                      px
                    </small>

                  </button>
                )
              )}

            </div>

            <div className="layoutControls">

              <h3>
                {
                  ELEMENT_NAMES[
                    selected
                  ]
                }
              </h3>

              <NumberField
                label="X position"
                value={
                  current.x
                }
                onChange={(v) =>
                  updateLayout(
                    selected,
                    {
                      x: v,
                    }
                  )
                }
              />

              <NumberField
                label="Y position"
                value={
                  current.y
                }
                onChange={(v) =>
                  updateLayout(
                    selected,
                    {
                      y: v,
                    }
                  )
                }
              />

              <NumberField
                label="Width"
                value={
                  current.width
                }
                onChange={(v) =>
                  updateLayout(
                    selected,
                    {
                      width:
                        Math.max(
                          20,
                          v
                        ),
                    }
                  )
                }
              />

              <NumberField
                label="Height"
                value={
                  current.height
                }
                onChange={(v) =>
                  updateLayout(
                    selected,
                    {
                      height:
                        Math.max(
                          20,
                          v
                        ),
                    }
                  )
                }
              />

              <NumberField
                label="Font size"
                value={
                  current.fontSize
                }
                onChange={(v) =>
                  updateLayout(
                    selected,
                    {
                      fontSize:
                        Math.max(
                          6,
                          v
                        ),
                    }
                  )
                }
              />

              <button
                className="secondaryButton"
                onClick={
                  resetLayout
                }
              >
                Reset layout
              </button>

            </div>

            <EditorCanvas
              site={s}
              layout={layout}
              selected={
                selected
              }
              setSelected={
                setSelected
              }
              updateLayout={
                updateLayout
              }
              canvasRef={
                canvasRef
              }
            />

          </Block>

          {/* ================================================== */}
          {/* COLORS                                             */}
          {/* ================================================== */}

          <Block
            id="colors"
            title="Colors"
          >

            <div className="colorGrid">

              {Object.entries(
                s.colors
              ).map(
                ([key, value]) => (
                  <div
                    className="colorRow"
                    key={key}
                  >

                    <label>
                      {key}

                      <input
                        value={
                          value
                        }
                        onChange={(
                          e
                        ) =>
                          set(
                            `colors.${key}`,
                            e.target
                              .value
                          )
                        }
                      />
                    </label>

                    <input
                      type="color"
                      value={
                        value
                      }
                      onChange={(
                        e
                      ) =>
                        set(
                          `colors.${key}`,
                          e.target
                            .value
                        )
                      }
                    />

                  </div>
                )
              )}

            </div>

          </Block>

          {/* ================================================== */}
          {/* ROSTER                                             */}
          {/* ================================================== */}

          <Block
            id="roster"
            title="Roster"
          >

            <div className="rosterTools">

              <span>
                {
                  s.players
                    .length
                }{" "}
                players
              </span>

              <button
                onClick={
                  addPlayer
                }
              >
                + Add player
              </button>

            </div>

            {s.players.map(
              (
                player,
                index
              ) => (
                <div
                  className="playerEdit"
                  key={
                    player.id
                  }
                >

                  <div className="playerEditHead">

                    <b>
                      {
                        player.name
                      }
                    </b>

                    <button
                      onClick={() =>
                        removePlayer(
                          player.id
                        )
                      }
                    >
                      Remove
                    </button>

                  </div>

                  <Field
                    label="Name"
                    value={
                      player.name
                    }
                    onChange={(v) =>
                      updatePlayer(
                        index,
                        "name",
                        v
                      )
                    }
                  />

                  <Field
                    label="Game"
                    value={
                      player.game
                    }
                    onChange={(v) =>
                      updatePlayer(
                        index,
                        "game",
                        v
                      )
                    }
                  />

                  <Field
                    label="Role"
                    value={
                      player.role
                    }
                    onChange={(v) =>
                      updatePlayer(
                        index,
                        "role",
                        v
                      )
                    }
                  />

                  <ImageField
                    label="Player image"
                    value={
                      player.image
                    }
                    onChange={(v) =>
                      updatePlayer(
                        index,
                        "image",
                        v
                      )
                    }
                    onUpload={(
                      file
                    ) => {
                      const reader =
                        new FileReader();

                      reader.onload =
                        () =>
                          updatePlayer(
                            index,
                            "image",
                            String(
                              reader.result
                            )
                          );

                      reader.readAsDataURL(
                        file
                      );
                    }}
                  />

                </div>
              )
            )}

          </Block>

          {/* ================================================== */}
          {/* LINKS                                              */}
          {/* ================================================== */}

          <Block
            id="links"
            title="Socials"
          >

            <Field
              label="Discord link"
              value={
                s.discord
              }
              onChange={(v) =>
                set(
                  "discord",
                  v
                )
              }
            />

            <Field
              label="TikTok link"
              value={
                s.tiktok
              }
              onChange={(v) =>
                set(
                  "tiktok",
                  v
                )
              }
            />

            <Field
              label="Footer text"
              value={
                s.footer
              }
              onChange={(v) =>
                set(
                  "footer",
                  v
                )
              }
            />

          </Block>

          {/* ================================================== */}
          {/* TEAM MEMBERS                                       */}
          {/* ================================================== */}

          {statusAdmin && (
            <>
              <Block
                id="team"
                title="Team Members"
              >

                <p
                  style={{
                    opacity:
                      0.65,
                  }}
                >
                  Registered
                  users who
                  are members
                  of your team.
                </p>

                <input
                  placeholder="Search usernames..."
                  value={
                    memberSearch
                  }
                  onChange={(e) =>
                    setMemberSearch(
                      e.target
                        .value
                    )
                  }
                  style={{
                    width:
                      "100%",
                    padding:
                      "12px 14px",
                    marginBottom:
                      15,
                  }}
                />

                {teamLoading ? (
                  <p>
                    Loading
                    team...
                  </p>
                ) : filteredMembers.length ===
                  0 ? (
                  <div
                    style={{
                      padding:
                        20,

                      border:
                        "1px solid rgba(255,255,255,.08)",

                      borderRadius:
                        12,

                      opacity:
                        0.7,
                    }}
                  >
                    No team
                    members
                    found.
                  </div>
                ) : (
                  <div
                    style={{
                      display:
                        "grid",

                      gap:
                        10,
                    }}
                  >

                    {filteredMembers.map(
                      (
                        member
                      ) => {

                        const status =
                          getStatus(
                            member.user_id
                          );

                        const memberRoles =
                          getMemberRoles(
                            member.user_id
                          );

                        return (
                          <div
                            key={
                              member.id
                            }
                            onClick={() =>
                              setSelectedMember(
                                member
                              )
                            }
                            style={{
                              padding:
                                15,

                              border:
                                selectedMember?.id ===
                                member.id
                                  ? `2px solid ${s.colors.accent}`
                                  : "1px solid rgba(255,255,255,.08)",

                              borderRadius:
                                12,

                              background:
                                "rgba(255,255,255,.025)",

                              cursor:
                                "pointer",
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                justifyContent:
                                  "space-between",

                                gap:
                                  15,
                              }}
                            >

                              <div>

                                <strong
                                  style={{
                                    fontSize:
                                      17,
                                  }}
                                >
                                  {
                                    member.username
                                  }
                                </strong>

                                <div
                                  style={{
                                    display:
                                      "flex",

                                    alignItems:
                                      "center",

                                    gap:
                                      7,

                                    marginTop:
                                      5,

                                    fontSize:
                                      13,
                                  }}
                                >

                                  <span
                                    style={{
                                      width:
                                        8,

                                      height:
                                        8,

                                      borderRadius:
                                        "50%",

                                      background:
                                        statusColor(
                                          status
                                        ),
                                    }}
                                  />

                                  <span
                                    style={{
                                      opacity:
                                        0.7,
                                    }}
                                  >
                                    {
                                      status
                                    }
                                  </span>

                                </div>

                              </div>

                              <div
                                style={{
                                  display:
                                    "flex",

                                  gap:
                                    5,
                                }}
                              >

                                {memberRoles.map(
                                  (
                                    role
                                  ) => (
                                    <span
                                      key={
                                        role.id
                                      }
                                      title={
                                        role.role_name
                                      }
                                      style={{
                                        width:
                                          32,

                                        height:
                                          32,

                                        borderRadius:
                                          8,

                                        overflow:
                                          "hidden",

                                        display:
                                          "grid",

                                        placeItems:
                                          "center",

                                        background:
                                          "rgba(255,255,255,.08)",
                                      }}
                                    >
                                      {role.icon ? (
                                        <img
                                          src={
                                            role.icon
                                          }
                                          alt={
                                            role.role_name
                                          }
                                          style={{
                                            width:
                                              "100%",

                                            height:
                                              "100%",

                                            objectFit:
                                              "cover",
                                          }}
                                        />
                                      ) : (
                                        "★"
                                      )}
                                    </span>
                                  )
                                )}

                              </div>

                            </div>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

                {selectedMember && (
                  <div
                    style={{
                      marginTop:
                        25,

                      padding:
                        20,

                      border:
                        "1px solid rgba(255,255,255,.1)",

                      borderRadius:
                        12,

                      background:
                        "rgba(255,255,255,.025)",
                    }}
                  >

                    <h3
                      style={{
                        marginTop:
                          0,
                      }}
                    >
                      {
                        selectedMember.username
                      }
                    </h3>

                    <p
                      style={{
                        opacity:
                          0.6,

                        fontSize:
                          12,
                      }}
                    >
                      User ID:
                      <br />
                      {
                        selectedMember.user_id
                      }
                    </p>

                    <p>
                      <strong>
                        Status:
                      </strong>{" "}
                      {
                        getStatus(
                          selectedMember.user_id
                        )
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        removeMember(
                          selectedMember
                        )
                      }
                      style={{
                        padding:
                          "10px 14px",

                        border:
                          0,

                        borderRadius:
                          7,

                        background:
                          "#ff4f4f",

                        color:
                          "#fff",

                        fontWeight:
                          800,
                      }}
                    >
                      Remove from
                      team
                    </button>

                  </div>
                )}

              </Block>

              {/* ================================================== */}
              {/* STATUS                                             */}
              {/* ================================================== */}

              <Block
                id="status"
                title="Statuses"
              >

                <div
                  style={{
                    padding:
                      20,

                    border:
                      "1px solid rgba(255,255,255,.08)",

                    borderRadius:
                      12,
                  }}
                >

                  <small
                    style={{
                      opacity:
                        0.55,

                      textTransform:
                        "uppercase",
                    }}
                  >
                    MY STATUS
                  </small>

                  <h2>
                    {
                      currentStatus
                    }
                  </h2>

                  <label className="field">

                    Status

                    <select
                      value={
                        currentStatus
                      }
                      disabled={
                        statusSaving
                      }
                      onChange={(
                        e
                      ) =>
                        saveMyStatus(
                          e.target
                            .value
                        )
                      }
                    >

                      {STATUS_OPTIONS.map(
                        (
                          status
                        ) => (
                          <option
                            key={
                              status
                            }
                            value={
                              status
                            }
                          >
                            {
                              status
                            }
                          </option>
                        )
                      )}

                    </select>

                  </label>

                </div>

                <h3
                  style={{
                    marginTop:
                      25,
                  }}
                >
                  All Members
                </h3>

                <div
                  style={{
                    display:
                      "grid",

                    gap:
                      8,
                  }}
                >

                  {members.map(
                    (
                      member
                    ) => {

                      const status =
                        getStatus(
                          member.user_id
                        );

                      return (
                        <div
                          key={
                            member.id
                          }
                          style={{
                            display:
                              "flex",

                            justifyContent:
                              "space-between",

                            alignItems:
                              "center",

                            padding:
                              "12px 15px",

                            border:
                              "1px solid rgba(255,255,255,.08)",

                            borderRadius:
                              9,
                          }}
                        >

                          <strong>
                            {
                              member.username
                            }
                          </strong>

                          <span
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                7,
                            }}
                          >

                            <i
                              style={{
                                width:
                                  9,

                                height:
                                  9,

                                borderRadius:
                                  "50%",

                                background:
                                  statusColor(
                                    status
                                  ),
                              }}
                            />

                            {
                              status
                            }

                          </span>

                        </div>
                      );
                    }
                  )}

                </div>

              </Block>

              {/* ================================================== */}
              {/* ROLES                                              */}
              {/* ================================================== */}

              <Block
                id="roles"
                title="Roles"
              >

                <p
                  style={{
                    opacity:
                      0.65,
                  }}
                >
                  Select a team
                  member above,
                  then create
                  roles for them.
                </p>

                {!selectedMember ? (
                  <div
                    style={{
                      padding:
                        20,

                      border:
                        "1px solid rgba(255,255,255,.08)",

                      borderRadius:
                        12,
                    }}
                  >
                    Select a member
                    from the Team
                    Members section
                    first.
                  </div>
                ) : (
                  <>

                    <div
                      style={{
                        padding:
                          15,

                        marginBottom:
                          20,

                        border:
                          "1px solid rgba(255,255,255,.08)",

                        borderRadius:
                          10,
                      }}
                    >
                      Managing roles
                      for{" "}
                      <strong>
                        {
                          selectedMember.username
                        }
                      </strong>
                    </div>

                    <div
                      style={{
                        display:
                          "flex",

                        flexWrap:
                          "wrap",

                        gap:
                          10,

                        marginBottom:
                          25,
                      }}
                    >

                      {getMemberRoles(
                        selectedMember.user_id
                      ).map(
                        (
                          role
                        ) => (
                          <div
                            key={
                              role.id
                            }
                            title={
                              role.role_name
                            }
                            style={{
                              display:
                                "flex",

                              alignItems:
                                "center",

                              gap:
                                8,

                              padding:
                                "8px 10px",

                              border:
                                "1px solid rgba(255,255,255,.1)",

                              borderRadius:
                                9,
                            }}
                          >

                            <span
                              title={
                                role.role_name
                              }
                              style={{
                                width:
                                  36,

                                height:
                                  36,

                                borderRadius:
                                  8,

                                overflow:
                                  "hidden",

                                display:
                                  "grid",

                                placeItems:
                                  "center",

                                background:
                                  "rgba(255,255,255,.08)",

                                cursor:
                                  "help",
                              }}
                            >

                              {role.icon ? (
                                <img
                                  src={
                                    role.icon
                                  }
                                  alt={
                                    role.role_name
                                  }
                                  style={{
                                    width:
                                      "100%",

                                    height:
                                      "100%",

                                    objectFit:
                                      "cover",
                                  }}
                                />
                              ) : (
                                "★"
                              )}

                            </span>

                            <strong>
                              {
                                role.role_name
                              }
                            </strong>

                            <label
                              style={{
                                fontSize:
                                  11,

                                opacity:
                                  0.6,

                                cursor:
                                  "pointer",
                              }}
                            >
                              Change
                              icon

                              <input
                                type="file"
                                accept="image/*"
                                style={{
                                  display:
                                    "none",
                                }}
                                onChange={(
                                  e
                                ) => {
                                  const file =
                                    e
                                      .target
                                      .files?.[0];

                                  if (
                                    file
                                  ) {
                                    uploadRoleIcon(
                                      role,
                                      file
                                    );
                                  }
                                }}
                              />

                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                deleteRole(
                                  role
                                )
                              }
                              style={{
                                border:
                                  0,

                                background:
                                  "transparent",

                                color:
                                  "#ff6464",

                                cursor:
                                  "pointer",

                                fontSize:
                                  18,
                              }}
                            >
                              ×
                            </button>

                          </div>
                        )
                      )}

                    </div>

                    <div
                      style={{
                        padding:
                          18,

                        border:
                          "1px solid rgba(255,255,255,.08)",

                        borderRadius:
                          12,
                      }}
                    >

                      <h3>
                        Give Role
                      </h3>

                      <Field
                        label="Role name"
                        value={
                          newRoleName
                        }
                        onChange={
                          setNewRoleName
                        }
                      />

                      <label className="field">

                        Role icon

                        <input
                          type="file"
                          accept="image/*"
                          onChange={(
                            e
                          ) => {
                            const file =
                              e
                                .target
                                .files?.[0];

                            if (
                              !file
                            ) {
                              return;
                            }

                            const reader =
                              new FileReader();

                            reader.onload =
                              () =>
                                setNewRoleIcon(
                                  String(
                                    reader.result
                                  )
                                );

                            reader.readAsDataURL(
                              file
                            );
                          }}
                        />

                      </label>

                      {newRoleIcon && (
                        <div
                          style={{
                            marginBottom:
                              15,
                          }}
                        >

                          <img
                            src={
                              newRoleIcon
                            }
                            alt="Role preview"
                            style={{
                              width:
                                45,

                              height:
                                45,

                              objectFit:
                                "cover",

                              borderRadius:
                                9,
                            }}
                          />

                        </div>
                      )}

                      <button
                        type="button"
                        onClick={
                          createRoleForMember
                        }
                        disabled={
                          roleSaving
                        }
                        style={{
                          padding:
                            "11px 16px",

                          border:
                            0,

                          borderRadius:
                            8,

                          background:
                            s.colors
                              .accent,

                          color:
                            "#000",

                          fontWeight:
                            800,

                          cursor:
                            "pointer",
                        }}
                      >
                        {roleSaving
                          ? "Creating..."
                          : "+ Give role"}
                      </button>

                    </div>

                  </>
                )}

              </Block>
            </>
          )}

          {/* ================================================== */}
          {/* STAFF CHAT                                         */}
          {/* ================================================== */}

          <Block
            id="chat"
            title="Team Chat"
          >

            <p
              style={{
                opacity:
                  0.65,
                marginTop:
                  -5,
              }}
            >
              Private staff chat.
              Only users who can
              access the admin panel
              can see these messages.
            </p>

            <div
              style={{
                border:
                  "1px solid rgba(255,255,255,.1)",

                borderRadius:
                  14,

                overflow:
                  "hidden",

                background:
                  "rgba(0,0,0,.2)",
              }}
            >

              {/* CHAT HEADER */}

              <div
                style={{
                  display:
                    "flex",

                  alignItems:
                    "center",

                  justifyContent:
                    "space-between",

                  padding:
                    "14px 16px",

                  borderBottom:
                    "1px solid rgba(255,255,255,.08)",
                }}
              >

                <div>

                  <strong>
                    Staff Chat
                  </strong>

                  <div
                    style={{
                      fontSize:
                        12,

                      opacity:
                        0.5,

                      marginTop:
                        3,
                    }}
                  >
                    {chatMessages.length}{" "}
                    messages
                  </div>

                </div>

                <span
                  style={{
                    fontSize:
                      11,

                    padding:
                      "5px 8px",

                    borderRadius:
                      6,

                    background:
                      "rgba(69,255,120,.1)",

                    color:
                      "#45ff78",
                  }}
                >
                  LIVE
                </span>

              </div>

              {/* CHAT MESSAGES */}

              <div
                style={{
                  height:
                    460,

                  overflowY:
                    "auto",

                  padding:
                    16,

                  display:
                    "flex",

                  flexDirection:
                    "column",

                  gap:
                    12,
                }}
              >

                {chatLoading ? (
                  <div
                    style={{
                      display:
                        "grid",

                      placeItems:
                        "center",

                      minHeight:
                        200,

                      opacity:
                        0.6,
                    }}
                  >
                    Loading chat...
                  </div>
                ) : chatMessages.length ===
                  0 ? (
                  <div
                    style={{
                      display:
                        "grid",

                      placeItems:
                        "center",

                      minHeight:
                        300,

                      textAlign:
                        "center",

                      opacity:
                        0.55,
                    }}
                  >

                    <div>

                      <div
                        style={{
                          fontSize:
                            34,

                          marginBottom:
                            10,
                        }}
                      >
                        💬
                      </div>

                      <strong>
                        No messages yet
                      </strong>

                      <p
                        style={{
                          marginTop:
                            5,
                        }}
                      >
                        Start the staff
                        conversation.
                      </p>

                    </div>

                  </div>
                ) : (
                  chatMessages.map(
                    (
                      message
                    ) => {

                      const messageRoles =
                        getMemberRoles(
                          message.user_id
                        );

                      const canDelete =
                        message.user_id ===
                          currentUserId ||
                        currentUserId ===
                          OWNER_ID;

                      const isMine =
                        message.user_id ===
                        currentUserId;

                      return (
                        <div
                          key={
                            message.id
                          }
                          style={{
                            display:
                              "flex",

                            alignItems:
                              "flex-start",

                            gap:
                              10,

                            position:
                              "relative",
                          }}
                        >

                          {/* AVATAR */}

                          <div
                            style={{
                              width:
                                38,

                              height:
                                38,

                              minWidth:
                                38,

                              borderRadius:
                                "50%",

                              overflow:
                                "hidden",

                              background:
                                "rgba(255,255,255,.08)",

                              display:
                                "grid",

                              placeItems:
                                "center",

                              fontWeight:
                                800,
                            }}
                          >

                            {message.avatar_url ? (
                              <img
                                src={
                                  message.avatar_url
                                }
                                alt=""
                                style={{
                                  width:
                                    "100%",

                                  height:
                                    "100%",

                                  objectFit:
                                    "cover",
                                }}
                              />
                            ) : (
                              message.username
                                .charAt(
                                  0
                                )
                                .toUpperCase()
                            )}

                          </div>

                          {/* MESSAGE */}

                          <div
                            style={{
                              minWidth:
                                0,

                              flex:
                                1,
                            }}
                          >

                            <div
                              style={{
                                display:
                                  "flex",

                                alignItems:
                                  "center",

                                gap:
                                  7,

                                flexWrap:
                                  "wrap",
                              }}
                            >

                              <strong
                                style={{
                                  fontSize:
                                    14,
                                }}
                              >
                                {
                                  message.username
                                }
                              </strong>

                              {/* ROLE ICONS */}

                              {messageRoles.map(
                                (
                                  role
                                ) => (
                                  <span
                                    key={
                                      role.id
                                    }
                                    title={
                                      role.role_name
                                    }
                                    style={{
                                      width:
                                        19,

                                      height:
                                        19,

                                      borderRadius:
                                        5,

                                      overflow:
                                        "hidden",

                                      display:
                                        "grid",

                                      placeItems:
                                        "center",

                                      background:
                                        "rgba(255,255,255,.08)",

                                      fontSize:
                                        10,

                                      cursor:
                                        "help",
                                    }}
                                  >

                                    {role.icon ? (
                                      <img
                                        src={
                                          role.icon
                                        }
                                        alt={
                                          role.role_name
                                        }
                                        style={{
                                          width:
                                            "100%",

                                          height:
                                            "100%",

                                          objectFit:
                                            "cover",
                                        }}
                                      />
                                    ) : (
                                      "★"
                                    )}

                                  </span>
                                )
                              )}

                              <span
                                style={{
                                  fontSize:
                                    11,

                                  opacity:
                                    0.4,
                                }}
                              >
                                {
                                  formatChatTime(
                                    message.created_at
                                  )
                                }
                              </span>

                              {isMine && (
                                <span
                                  style={{
                                    fontSize:
                                      10,

                                    opacity:
                                      0.35,
                                  }}
                                >
                                  YOU
                                </span>
                              )}

                            </div>

                            <div
                              style={{
                                marginTop:
                                  3,

                                fontSize:
                                  14,

                                lineHeight:
                                  1.5,

                                wordBreak:
                                  "break-word",

                                whiteSpace:
                                  "pre-wrap",
                              }}
                            >
                              {
                                message.message
                              }
                            </div>

                          </div>

                          {/* DELETE */}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() =>
                                deleteChatMessage(
                                  message
                                )
                              }
                              title={
                                currentUserId ===
                                OWNER_ID
                                  ? "Delete message"
                                  : "Delete your message"
                              }
                              style={{
                                border:
                                  0,

                                background:
                                  "transparent",

                                color:
                                  "#ff6464",

                                opacity:
                                  0.55,

                                cursor:
                                  "pointer",

                                fontSize:
                                  16,

                                padding:
                                  "3px 5px",

                                borderRadius:
                                  5,
                              }}
                              onMouseEnter={(
                                e
                              ) => {
                                e.currentTarget.style.opacity =
                                  "1";
                              }}
                              onMouseLeave={(
                                e
                              ) => {
                                e.currentTarget.style.opacity =
                                  "0.55";
                              }}
                            >
                              🗑
                            </button>
                          )}

                        </div>
                      );
                    }
                  )
                )}

                <div
                  ref={
                    chatEndRef
                  }
                />

              </div>

              {/* CHAT INPUT */}

              <div
                style={{
                  padding:
                    12,

                  borderTop:
                    "1px solid rgba(255,255,255,.08)",

                  background:
                    "rgba(0,0,0,.15)",
                }}
              >

                <div
                  style={{
                    display:
                      "flex",

                    gap:
                      8,
                  }}
                >

                  <input
                    value={
                      chatInput
                    }
                    onChange={(e) =>
                      setChatInput(
                        e.target
                          .value
                      )
                    }
                    onKeyDown={
                      handleChatKeyDown
                    }
                    placeholder="Message staff..."
                    maxLength={
                      2000
                    }
                    disabled={
                      chatSending
                    }
                    style={{
                      flex:
                        1,

                      minWidth:
                        0,

                      padding:
                        "12px 14px",

                      borderRadius:
                        9,

                      border:
                        "1px solid rgba(255,255,255,.1)",

                      background:
                        "rgba(255,255,255,.04)",

                      color:
                        "#fff",

                      outline:
                        "none",
                    }}
                  />

                  <button
                    type="button"
                    onClick={
                      sendChatMessage
                    }
                    disabled={
                      chatSending ||
                      !chatInput.trim()
                    }
                    style={{
                      padding:
                        "0 18px",

                      border:
                        0,

                      borderRadius:
                        9,

                      background:
                        s.colors
                          .accent,

                      color:
                        "#000",

                      fontWeight:
                        800,

                      cursor:
                        chatSending ||
                        !chatInput.trim()
                          ? "not-allowed"
                          : "pointer",

                      opacity:
                        chatSending ||
                        !chatInput.trim()
                          ? 0.5
                          : 1,
                    }}
                  >
                    {chatSending
                      ? "..."
                      : "Send"}
                  </button>

                </div>

                <div
                  style={{
                    marginTop:
                      6,

                    fontSize:
                      10,

                    opacity:
                      0.35,
                  }}
                >
                  Press Enter to
                  send
                </div>

              </div>

            </div>

          </Block>

        </section>

        {/* ================================================== */}
        {/* LIVE PREVIEW                                       */}
        {/* ================================================== */}

        <Preview
          site={s}
          layout={layout}
        />

      </div>

      {/* ================================================== */}
      {/* SAVE BAR                                            */}
      {/* ================================================== */}

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

/* ================================================== */
/* CHAT TIME                                          */
/* ================================================== */

function formatChatTime(
  timestamp: string
) {
  const date =
    new Date(timestamp);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const now =
    new Date();

  const sameDay =
    date.toDateString() ===
    now.toDateString();

  if (sameDay) {
    return date.toLocaleTimeString(
      [],
      {
        hour:
          "numeric",

        minute:
          "2-digit",
      }
    );
  }

  return date.toLocaleDateString(
    [],
    {
      month:
        "short",

      day:
        "numeric",

      hour:
        "numeric",

      minute:
        "2-digit",
    }
  );
}

/* ================================================== */
/* CANVAS EDITOR                                      */
/* ================================================== */

function EditorCanvas({
  site,
  layout,
  selected,
  setSelected,
  updateLayout,
  canvasRef,
}: {
  site: Site;

  layout: Layout;

  selected:
    keyof Layout;

  setSelected: (
    value: keyof Layout
  ) => void;

  updateLayout: (
    element:
      keyof Layout,
    changes:
      Partial<LayoutItem>
  ) => void;

  canvasRef:
    React.RefObject<
      HTMLDivElement | null
    >;
}) {
  const drag =
    useRef<{
      type:
        | "move"
        | "resize";

      element:
        keyof Layout;

      startX:
        number;

      startY:
        number;

      original:
        LayoutItem;
    } | null>(null);

  const beginDrag = (
    e: React.PointerEvent,
    element:
      keyof Layout,
    type:
      | "move"
      | "resize"
  ) => {
    e.preventDefault();

    e.stopPropagation();

    setSelected(
      element
    );

    drag.current = {
      type,

      element,

      startX:
        e.clientX,

      startY:
        e.clientY,

      original: {
        ...layout[
          element
        ],
      },
    };

    (
      e.currentTarget as HTMLElement
    ).setPointerCapture(
      e.pointerId
    );
  };

  const move = (
    e: React.PointerEvent
  ) => {
    if (
      !drag.current
    ) {
      return;
    }

    const d =
      drag.current;

    const dx =
      e.clientX -
      d.startX;

    const dy =
      e.clientY -
      d.startY;

    if (
      d.type ===
      "move"
    ) {
      updateLayout(
        d.element,
        {
          x:
            Math.max(
              0,
              d.original.x +
                dx
            ),

          y:
            Math.max(
              0,
              d.original.y +
                dy
            ),
        }
      );
    } else {
      updateLayout(
        d.element,
        {
          width:
            Math.max(
              30,
              d.original
                .width +
                dx
            ),

          height:
            Math.max(
              30,
              d.original
                .height +
                dy
            ),
        }
      );
    }
  };

  const stop = () => {
    drag.current =
      null;
  };

  const itemStyle = (
    key:
      keyof Layout
  ): React.CSSProperties => {
    const item =
      layout[key];

    return {
      position:
        "absolute",

      left:
        item.x,

      top:
        item.y,

      width:
        item.width,

      height:
        item.height,

      border:
        selected ===
        key
          ? "2px solid #fff"
          : "1px dashed rgba(255,255,255,.18)",

      boxSizing:
        "border-box",

      cursor:
        "move",

      userSelect:
        "none",

      touchAction:
        "none",
    };
  };

  return (
    <div
      ref={
        canvasRef
      }
      className="designCanvas"
      onPointerMove={
        move
      }
      onPointerUp={
        stop
      }
      onPointerCancel={
        stop
      }
      style={{
        position:
          "relative",

        width:
          "100%",

        height:
          650,

        overflow:
          "hidden",

        borderRadius:
          12,

        border:
          `1px solid ${site.colors.line}`,

        backgroundColor:
          site.colors.bg,

        backgroundImage:
          (site as any)
            .background
            ?.image
            ? `linear-gradient(rgba(0,0,0,${
                (site as any)
                  .background
                  ?.overlay ??
                0.35
              }),rgba(0,0,0,${
                (site as any)
                  .background
                  ?.overlay ??
                0.35
              })),url("${(site as any).background.image}")`
            : "none",

        backgroundPosition:
          (site as any)
            .background
            ?.position ||
          "center",

        backgroundSize:
          (site as any)
            .background
            ?.size ||
          "cover",
      }}
    >

      <div
        style={{
          position:
            "absolute",

          inset:
            0,

          padding:
            12,

          pointerEvents:
            "none",

          color:
            site.colors
              .muted,

          fontSize:
            10,

          letterSpacing:
            ".12em",
        }}
      >
        DRAG ELEMENTS •
        DRAG CORNER TO
        RESIZE
      </div>

      {/* INTRO */}

      <div
        style={
          itemStyle(
            "intro"
          )
        }
        onPointerDown={(
          e
        ) =>
          beginDrag(
            e,
            "intro",
            "move"
          )
        }
      >

        <span
          style={{
            color:
              site.colors
                .muted,

            fontSize:
              layout
                .intro
                .fontSize,

            fontWeight:
              800,

            letterSpacing:
              ".12em",
          }}
        >
          {
            site.intro
          }
        </span>

        {selected ===
          "intro" && (
          <ResizeHandle
            onPointerDown={(
              e
            ) =>
              beginDrag(
                e,
                "intro",
                "resize"
              )
            }
          />
        )}

      </div>

      {/* LOGO */}

      {site.teamLogo && (
        <div
          style={
            itemStyle(
              "logo"
            )
          }
          onPointerDown={(
            e
          ) =>
            beginDrag(
              e,
              "logo",
              "move"
            )
          }
        >

          <img
            src={
              site.teamLogo
            }
            alt=""
            style={{
              width:
                "100%",

              height:
                "100%",

              objectFit:
                "contain",

              pointerEvents:
                "none",
            }}
          />

          {selected ===
            "logo" && (
            <ResizeHandle
              onPointerDown={(
                e
              ) =>
                beginDrag(
                  e,
                  "logo",
                  "resize"
                )
              }
            />
          )}

        </div>
      )}

      {/* NAME */}

      <div
        style={
          itemStyle(
            "name"
          )
        }
        onPointerDown={(
          e
        ) =>
          beginDrag(
            e,
            "name",
            "move"
          )
        }
      >

        <strong
          style={{
            fontSize:
              layout
                .name
                .fontSize,

            lineHeight:
              0.9,

            color:
              site.colors
                .text,

            whiteSpace:
              "nowrap",
          }}
        >
          {
            site.name
          }
        </strong>

        {selected ===
          "name" && (
          <ResizeHandle
            onPointerDown={(
              e
            ) =>
              beginDrag(
                e,
                "name",
                "resize"
              )
            }
          />
        )}

      </div>

      {/* TAG */}

      <div
        style={
          itemStyle(
            "tag"
          )
        }
        onPointerDown={(
          e
        ) =>
          beginDrag(
            e,
            "tag",
            "move"
          )
        }
      >

        <strong
          style={{
            fontSize:
              layout
                .tag
                .fontSize,

            color:
              site.colors
                .accent,

            whiteSpace:
              "nowrap",
          }}
        >
          {
            site.tag
          }
        </strong>

        {selected ===
          "tag" && (
          <ResizeHandle
            onPointerDown={(
              e
            ) =>
              beginDrag(
                e,
                "tag",
                "resize"
              )
            }
          />
        )}

      </div>

      {/* DESCRIPTION */}

      <div
        style={
          itemStyle(
            "description"
          )
        }
        onPointerDown={(
          e
        ) =>
          beginDrag(
            e,
            "description",
            "move"
          )
        }
      >

        <p
          style={{
            margin:
              0,

            fontSize:
              layout
                .description
                .fontSize,

            color:
              site.colors
                .muted,

            lineHeight:
              1.5,
          }}
        >
          {
            site.description
          }
        </p>

        {selected ===
          "description" && (
          <ResizeHandle
            onPointerDown={(
              e
            ) =>
              beginDrag(
                e,
                "description",
                "resize"
              )
            }
          />
        )}

      </div>

      {/* BUTTONS */}

      <div
        style={
          itemStyle(
            "buttons"
          )
        }
        onPointerDown={(
          e
        ) =>
          beginDrag(
            e,
            "buttons",
            "move"
          )
        }
      >

        <div
          style={{
            display:
              "flex",

            gap:
              8,

            pointerEvents:
              "none",
          }}
        >

          <button
            style={{
              height:
                45,

              padding:
                "0 18px",

              background:
                site.colors
                  .accent,

              border:
                0,

              borderRadius:
                6,

              fontWeight:
                800,

              fontSize:
                layout
                  .buttons
                  .fontSize,
            }}
          >
            {
              site.heroButton
            }
          </button>

          <button
            style={{
              height:
                45,

              padding:
                "0 18px",

              background:
                "transparent",

              color:
                site.colors
                  .text,

              border:
                `1px solid ${site.colors.line}`,

              borderRadius:
                6,

              fontWeight:
                700,

              fontSize:
                layout
                  .buttons
                  .fontSize,
            }}
          >
            TikTok
          </button>

        </div>

        {selected ===
          "buttons" && (
          <ResizeHandle
            onPointerDown={(
              e
            ) =>
              beginDrag(
                e,
                "buttons",
                "resize"
              )
            }
          />
        )}

      </div>

    </div>
  );
}

/* ================================================== */
/* RESIZE HANDLE                                      */
/* ================================================== */

function ResizeHandle({
  onPointerDown,
}: {
  onPointerDown: (
    e: React.PointerEvent
  ) => void;
}) {
  return (
    <div
      onPointerDown={
        onPointerDown
      }
      style={{
        position:
          "absolute",

        right:
          -6,

        bottom:
          -6,

        width:
          14,

        height:
          14,

        borderRadius:
          3,

        background:
          "#fff",

        border:
          "2px solid #111",

        cursor:
          "nwse-resize",

        zIndex:
          20,
      }}
    />
  );
}

/* ================================================== */
/* PREVIEW                                            */
/* ================================================== */

function Preview({
  site,
  layout,
}: {
  site: Site;
  layout: Layout;
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
          rel="noreferrer"
        >
          Open ↗
        </a>

      </div>

      <div
        className="previewFrame"
        style={{
          backgroundColor:
            site.colors.bg,

          backgroundImage:
            (site as any)
              .background
              ?.image
              ? `linear-gradient(rgba(0,0,0,${
                  (site as any)
                    .background
                    ?.overlay ??
                  0.35
                }),rgba(0,0,0,${
                  (site as any)
                    .background
                    ?.overlay ??
                  0.35
                })),url("${(site as any).background.image}")`
              : "none",

          backgroundPosition:
            (site as any)
              .background
              ?.position ||
            "center",

          backgroundSize:
            (site as any)
              .background
              ?.size ||
            "cover",

          color:
            site.colors.text,
        }}
      >

        <div className="pNav">

          <b>
            {
              site.name
            }
          </b>

          <span>
            GAMES　 ROSTER　 ABOUT
          </span>

        </div>

        <div
          style={{
            position:
              "relative",

            height:
              560,

            overflow:
              "hidden",
          }}
        >

          <div
            style={{
              position:
                "absolute",

              left:
                layout
                  .intro
                  .x,

              top:
                layout
                  .intro
                  .y,

              width:
                layout
                  .intro
                  .width,

              color:
                site.colors
                  .muted,

              fontSize:
                layout
                  .intro
                  .fontSize,

              fontWeight:
                800,
            }}
          >
            {
              site.intro
            }
          </div>

          {site.teamLogo && (
            <img
              src={
                site.teamLogo
              }
              alt=""
              style={{
                position:
                  "absolute",

                left:
                  layout
                    .logo
                    .x,

                top:
                  layout
                    .logo
                    .y,

                width:
                  layout
                    .logo
                    .width,

                height:
                  layout
                    .logo
                    .height,

                objectFit:
                  "contain",
              }}
            />
          )}

          <strong
            style={{
              position:
                "absolute",

              left:
                layout
                  .name
                  .x,

              top:
                layout
                  .name
                  .y,

              width:
                layout
                  .name
                  .width,

              fontSize:
                layout
                  .name
                  .fontSize,

              lineHeight:
                0.9,
            }}
          >
            {
              site.name
            }
          </strong>

          <strong
            style={{
              position:
                "absolute",

              left:
                layout
                  .tag
                  .x,

              top:
                layout
                  .tag
                  .y,

              width:
                layout
                  .tag
                  .width,

              color:
                site.colors
                  .accent,

              fontSize:
                layout
                  .tag
                  .fontSize,
            }}
          >
            {
              site.tag
            }
          </strong>

          <p
            style={{
              position:
                "absolute",

              left:
                layout
                  .description
                  .x,

              top:
                layout
                  .description
                  .y,

              width:
                layout
                  .description
                  .width,

              color:
                site.colors
                  .muted,

              fontSize:
                layout
                  .description
                  .fontSize,
            }}
          >
            {
              site.description
            }
          </p>

          <div
            style={{
              position:
                "absolute",

              left:
                layout
                  .buttons
                  .x,

              top:
                layout
                  .buttons
                  .y,
            }}
          >

            <button>
              {
                site.heroButton
              }
            </button>

            <button>
              TikTok
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ================================================== */
/* BLOCK                                              */
/* ================================================== */

function Block({
  id,
  title,
  children,
}: {
  id:
    string;

  title:
    string;

  children:
    React.ReactNode;
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
          {
            title
          }
        </h2>

      </div>

      {children}

    </section>
  );
}

/* ================================================== */
/* FIELD                                              */
/* ================================================== */

function Field({
  label,
  value,
  onChange,
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value:
      string
  ) => void;
}) {
  return (
    <label className="field">

      {
        label
      }

      <input
        value={
          value || ""
        }
        onChange={(
          e
        ) =>
          onChange(
            e.target
              .value
          )
        }
      />

    </label>
  );
}

/* ================================================== */
/* NUMBER FIELD                                       */
/* ================================================== */

function NumberField({
  label,
  value,
  onChange,
}: {
  label:
    string;

  value:
    number;

  onChange: (
    value:
      number
  ) => void;
}) {
  return (
    <label className="field">

      {
        label
      }

      <input
        type="number"
        value={Math.round(
          value
        )}
        onChange={(
          e
        ) =>
          onChange(
            Number(
              e.target
                .value
            )
          )
        }
      />

    </label>
  );
}

/* ================================================== */
/* TEXT AREA                                          */
/* ================================================== */

function Area({
  label,
  value,
  onChange,
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value:
      string
  ) => void;
}) {
  return (
    <label className="field">

      {
        label
      }

      <textarea
        rows={5}
        value={
          value || ""
        }
        onChange={(
          e
        ) =>
          onChange(
            e.target
              .value
          )
        }
      />

    </label>
  );
}

/* ================================================== */
/* IMAGE FIELD                                        */
/* ================================================== */

function ImageField({
  label,
  value,
  onChange,
  onUpload,
}: {
  label:
    string;

  value:
    string;

  onChange: (
    value:
      string
  ) => void;

  onUpload: (
    file:
      File
  ) => void;
}) {
  return (
    <div className="imageField">

      <Field
        label={`${label} URL (optional)`}
        value={
          value
        }
        onChange={
          onChange
        }
      />

      <label className="upload">

        Choose from
        computer

        <input
          type="file"
          accept="image/*"
          onChange={(
            e
          ) => {
            const file =
              e.target
                .files?.[0];

            if (file) {
              onUpload(
                file
              );
            }
          }}
        />

      </label>

      {value && (
        <img
          src={
            value
          }
          alt="preview"
        />
      )}

    </div>
  );
}

/* ================================================== */
/* GAME EDIT                                          */
/* ================================================== */

function GameEdit({
  title,
  data,
  set,
  upload,
}: {
  title:
    string;

  data: {
    title:
      string;

    desc:
      string;

    logo:
      string;
  };

  set: (
    key:
      string,
    value:
      string
  ) => void;

  upload: (
    file:
      File
  ) => void;
}) {
  return (
    <div className="gameEdit">

      <h3>
        {
          title
        }
      </h3>

      <Field
        label="Title"
        value={
          data.title
        }
        onChange={(v) =>
          set(
            "title",
            v
          )
        }
      />

      <Field
        label="Description"
        value={
          data.desc
        }
        onChange={(v) =>
          set(
            "desc",
            v
          )
        }
      />

      <ImageField
        label="Logo"
        value={
          data.logo
        }
        onChange={(v) =>
          set(
            "logo",
            v
          )
        }
        onUpload={
          upload
        }
      />

    </div>
  );
}

/* ================================================== */
/* TOGGLE                                             */
/* ================================================== */

function Toggle({
  label,
  value,
  onChange,
}: {
  label:
    string;

  value:
    boolean;

  onChange: (
    value:
      boolean
  ) => void;
}) {
  return (
    <label className="toggle">

      <span>
        {
          label
        }
      </span>

      <button
        type="button"
        className={
          value
            ? "on"
            : ""
        }
        onClick={() =>
          onChange(
            !value
          )
        }
      >
        <i />
      </button>

    </label>
  );
}