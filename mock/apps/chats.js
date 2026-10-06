// OrgTik Chats (Somion HQ: chat, calls, virtual office). The app runs on its own built-in
// mock data, so this module only adds its launcher tile and who can open it; no API routes.
module.exports = {
  scopes: [
    {
      name: "hq",
      displayName: "Chats",
      description: "Team chat, calls and the virtual office (Somion HQ).",
      metadata: { icon: "solar:chat-round-dots-bold", color: "#c04170" },
    },
  ],
  // Every staff member gets chat; the customer (Nour) joins client meetings through guest links instead.
  grants: {
    hq: {
      admin: ["owner"],
      manager: ["admin"],
      u15: ["admin"],
      ...Object.fromEntries(["employee", "sales", "finance", "u7", "u8", "u9", "u10", "u11", "u12", "u13", "u14", "u16"].map((k) => [k, ["member"]])),
    },
  },
};
