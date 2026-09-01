export type Player = {
  id: string;
  name: string;
  game: string;
  role: string;
  image: string;
};

export type Site = {
  name: string;
  tag: string;
  intro: string;
  description: string;
  teamLogo: string;
  discord: string;
  tiktok: string;
  heroButton: string;
  footer: string;

  background: {
    image: string;
    position: string;
    size: "cover" | "contain" | "auto";
    repeat: "no-repeat" | "repeat" | "repeat-x" | "repeat-y";
    overlay: number;
  };

  visible: {
    games: boolean;
    roster: boolean;
    about: boolean;
  };

  games: {
    gt: {
      title: string;
      desc: string;
      logo: string;
    };
    od: {
      title: string;
      desc: string;
      logo: string;
    };
  };

  colors: {
    bg: string;
    card: string;
    text: string;
    muted: string;
    accent: string;
    line: string;
  };

  players: Player[];
};

export const DEFAULT: Site = {
  name: "YOUR TEAM",
  tag: "COMPETE WITHOUT EXCUSES.",
  intro: "GORILLA TAG / ORION DRIFT",

  description:
    "A competitive team built around good players, good people, and getting better every day.",

  teamLogo: "",

  discord: "https://discord.gg/YOURSERVER",

  tiktok: "https://www.tiktok.com/@YOURTEAM",

  heroButton: "Join Discord",

  footer: "YOUR TEAM — VR COMPETITION",

  background: {
    image: "",
    position: "center",
    size: "cover",
    repeat: "no-repeat",
    overlay: 0.25,
  },

  visible: {
    games: true,
    roster: true,
    about: true,
  },

  games: {
    gt: {
      title: "Gorilla Tag",
      desc: "Competitive roster and events.",
      logo: "",
    },

    od: {
      title: "Orion Drift",
      desc: "Players, teams and competition.",
      logo: "",
    },
  },

  colors: {
    bg: "#0b0d10",
    card: "#111419",
    text: "#f1f2f3",
    muted: "#8b9098",
    accent: "#e8ff3f",
    line: "#242830",
  },

  players: [
    {
      id: "1",
      name: "Player 01",
      game: "Gorilla Tag",
      role: "Player",
      image: "",
    },

    {
      id: "2",
      name: "Player 02",
      game: "Orion Drift",
      role: "Player",
      image: "",
    },
  ],
};