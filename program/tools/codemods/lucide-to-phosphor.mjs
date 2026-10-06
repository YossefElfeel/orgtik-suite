// lucide-react / @iconify → @phosphor-icons/react (D-008), for the dashboard waves (HR, Marketing, Sales).
//
//   node lucide-to-phosphor.mjs <app dir> [--check]     --check: list what would change, write nothing
//
// Imports are rewritten with aliases (`import { Trash as Trash2 } from "@phosphor-icons/react"`), so
// no usage in the file changes and no name can collide (a lucide `Calendar` next to a UI `Calendar`).
// `LucideIcon` (the type) becomes Phosphor's `Icon`. Literal iconify ids (`<Icon icon="solar:…" />`)
// become the Phosphor component; dynamic ids are listed for a hand fix. Every target name is checked
// against the installed @phosphor-icons/react before anything is written.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

// lucide name → Phosphor name. Weight stays "regular" (the library default) unless a lucide name
// meant a filled glyph.
export const LUCIDE = {
  ActivitySquare: "Pulse", AlertCircle: "WarningCircle", AlignCenter: "TextAlignCenter", AlignJustify: "TextAlignJustify",
  AlignLeft: "TextAlignLeft", AlignRight: "TextAlignRight", ArrowLeft: "ArrowLeft", ArrowRight: "ArrowRight", ArrowUpRight: "ArrowUpRight",
  BadgeCheck: "SealCheck", Banknote: "Money", BarChart2: "ChartBar", Bold: "TextB", Briefcase: "Briefcase", BriefcaseBusiness: "Briefcase",
  Building2: "Buildings", Cake: "Cake", Calendar: "CalendarBlank", CalendarClock: "CalendarDots", CalendarDays: "CalendarDots",
  CalendarIcon: "CalendarBlank", Camera: "Camera", Check: "Check", CheckCircle2: "CheckCircle", CheckIcon: "Check", ChevronDown: "CaretDown",
  ChevronDownIcon: "CaretDown", ChevronLeft: "CaretLeft", ChevronLeftIcon: "CaretLeft", ChevronRight: "CaretRight", ChevronRightIcon: "CaretRight",
  ChevronUp: "CaretUp", ChevronUpIcon: "CaretUp", ChevronsUpDown: "CaretUpDown", CircleCheck: "CheckCircle", CircleDollarSign: "CurrencyCircleDollar",
  CircleUser: "UserCircle", CircleUserRound: "UserCircle", Clock: "Clock", Clock3: "Clock", Code2: "Code", Coins: "Coins", Columns3: "Columns",
  CornerDownLeft: "ArrowElbowDownLeft", CreditCard: "CreditCard", DollarSign: "CurrencyDollar", Download: "DownloadSimple", Edit2: "PencilSimple",
  Edit3Icon: "PencilSimpleLine", Eye: "Eye", EyeOff: "EyeSlash", File: "File", FileCode: "FileCode", FileMinus2: "FileMinus", FileText: "FileText",
  Flag: "Flag", FolderOpen: "FolderOpen", Gift: "Gift", Globe: "Globe", GraduationCap: "GraduationCap", GripVertical: "DotsSixVertical",
  HardDrive: "HardDrive", Hash: "Hash", Heading1: "TextHOne", Heading2: "TextHTwo", Heading3: "TextHThree", Image: "Image", ImageIcon: "Image",
  Info: "Info", InfoIcon: "Info", Italic: "TextItalic", Landmark: "Bank", LifeBuoy: "Lifebuoy", Link: "Link", Link2: "LinkSimple", List: "List",
  ListOrdered: "ListNumbers", Loader: "CircleNotch", Loader2: "CircleNotch", LogOut: "SignOut", Mail: "Envelope", MapPin: "MapPin", Menu: "List",
  MessageCircle: "ChatCircle", Mic: "Microphone", Minus: "Minus", MoreHorizontalIcon: "DotsThree", MoreVertical: "DotsThreeVertical",
  Network: "TreeStructure", Paperclip: "Paperclip", Pen: "Pen", Pencil: "PencilSimple", Phone: "Phone", PieChart: "ChartPie", PlaneTakeoff: "AirplaneTakeoff",
  Plus: "Plus", RefreshCcw: "ArrowsCounterClockwise", RefreshCw: "ArrowsClockwise", RotateCcw: "ArrowCounterClockwise", ScanFace: "ScanSmiley",
  Search: "MagnifyingGlass", Send: "PaperPlaneRight", SeparatorHorizontal: "Minus", Settings: "Gear", Share2: "ShareNetwork",
  ShieldCheck: "ShieldCheck", ShieldPlus: "ShieldPlus", Signature: "Signature", Smartphone: "DeviceMobile", Snowflake: "Snowflake",
  Sparkles: "Sparkle", StickyNote: "Note", Ticket: "Ticket", Trash: "Trash", Trash2: "Trash", TrendingDown: "TrendDown", TrendingUp: "TrendUp",
  Underline: "TextUnderline", Upload: "UploadSimple", User: "User", UserCheck: "UserCheck", UserCheck2: "UserCheck", UserCircle2: "UserCircle",
  UserRound: "User", Users: "Users", Wallet: "Wallet", Wand2: "MagicWand", X: "X", XIcon: "X",
};

// Literal iconify ids → Phosphor (+ weight when the id meant a filled or duotone glyph).
export const ICONIFY = {
  "lucide:plus": ["Plus"], "lucide:trash-2": ["Trash"], "lucide:pencil-line": ["PencilSimpleLine"], "lucide:eye": ["Eye"],
  "lucide:download": ["DownloadSimple"], "solar:add-circle-bold": ["PlusCircle", "fill"], "solar:users-group-two-rounded-outline": ["UsersThree"],
  "solar:user-id-outline": ["IdentificationCard"], "solar:user-heart-linear": ["UserCircle"], "solar:upload-bold": ["UploadSimple", "bold"],
  "solar:trash-bin-trash-bold": ["Trash", "fill"], "solar:restart-bold-duotone": ["ArrowCounterClockwise", "duotone"],
  "solar:money-bag-bold": ["Money", "fill"], "solar:camera-bold": ["Camera", "fill"], "solar:bell-bold-duotone": ["Bell", "duotone"],
  "material-symbols:paid-outline": ["CurrencyCircleDollar"], "material-symbols:folder-zip-outline": ["FileZip"],
  "material-symbols:file-download-outline": ["FileArrowDown"], "material-symbols:arrow-right-alt-rounded": ["ArrowRight"],
  "ep:arrow-down": ["CaretDown"], "svg-spinners:180-ring": ["CircleNotch", "spin"], "line-md:loading-twotone-loop": ["CircleNotch", "spin"],
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const root = path.resolve(process.argv[2] ?? ".");
  const check = process.argv.includes("--check");
  const require = createRequire(path.join(root, "package.json"));
  // Each icon ships as dist/csr/<Name>.es.js: that list is the set of valid names (no need to load React).
  const csr = path.join(path.dirname(require.resolve("@phosphor-icons/react/package.json")), "dist", "csr");
  const phosphor = Object.fromEntries(fs.readdirSync(csr).filter((f) => f.endsWith(".es.js")).map((f) => [f.slice(0, -6), true]));
  const missing = [...new Set([...Object.values(LUCIDE), ...Object.values(ICONIFY).map((v) => v[0])])].filter((n) => !(n in phosphor));
  if (missing.length) {
    console.error("Not in @phosphor-icons/react:", missing.join(" "));
    process.exit(1);
  }

  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) return /node_modules|\.next|\.git/.test(e.name) ? [] : walk(p);
    return /\.(tsx?|jsx?)$/.test(e.name) ? [p] : [];
  });
  const files = ["app", "components", "lib", "hooks", "constants"].map((d) => path.join(root, d)).filter(fs.existsSync).flatMap(walk);
  const unknown = new Set();
  const dynamic = [];
  let changed = 0;

  for (const f of files) {
    let s = fs.readFileSync(f, "utf8");
    const before = s;
    const fromPhosphor = new Map(); // local name -> phosphor name (or "type:Icon")
    // 1. lucide imports
    s = s.replace(/import\s*(type\s*)?\{([^}]*)\}\s*from\s*["']lucide-react["'];?\r?\n?/g, (m, typeOnly, list) => {
      for (const raw of list.split(",").map((x) => x.trim()).filter(Boolean)) {
        const isType = Boolean(typeOnly) || raw.startsWith("type ");
        const [name, alias] = raw.replace(/^type\s+/, "").split(/\s+as\s+/).map((x) => x.trim());
        const local = alias ?? name;
        if (name === "LucideIcon" || name === "LucideProps") { fromPhosphor.set(local, `type:${name === "LucideIcon" ? "Icon" : "IconProps"}`); continue; }
        const target = LUCIDE[name];
        if (!target) { unknown.add(name); return m; }
        fromPhosphor.set(local, isType ? `type:${target}` : target);
      }
      return "";
    });
    // 2. iconify literal ids
    const usesIconify = /from\s*["']@iconify\/react[^"']*["']/.test(s);
    if (usesIconify) {
      s = s.replace(/<Icon(\s[^>]*?)\bicon=(?:"([^"]+)"|\{"([^"]+)"\})([^>]*?)\/>/g, (m, a, id1, id2, b) => {
        const id = id1 ?? id2;
        const hit = ICONIFY[id];
        if (!hit) { unknown.add(id); return m; }
        const [name, extra] = hit;
        const local = `${name}Icon`;
        fromPhosphor.set(local, name);
        const weight = extra && extra !== "spin" ? ` weight="${extra}"` : "";
        let attrs = `${a}${b}`.replace(/\s+$/, "");
        if (extra === "spin") attrs = /className="/.test(attrs) ? attrs.replace(/className="/, 'className="animate-spin ') : `${attrs} className="animate-spin"`;
        return `<${local}${attrs}${weight} aria-hidden="true" />`;
      });
      if (/<Icon[\s>]/.test(s)) dynamic.push(path.relative(root, f));
      else s = s.replace(/import\s*\{\s*Icon\s*\}\s*from\s*["']@iconify\/react[^"']*["'];?\r?\n/, "");
    }
    if (s === before) continue;
    if (fromPhosphor.size) {
      const nl = s.includes("\r\n") ? "\r\n" : "\n";
      const values = [...fromPhosphor].filter(([, v]) => !v.startsWith("type:")).map(([local, v]) => (local === v ? v : `${v} as ${local}`));
      const types = [...fromPhosphor].filter(([, v]) => v.startsWith("type:")).map(([local, v]) => (local === v.slice(5) ? v.slice(5) : `${v.slice(5)} as ${local}`));
      const lines = [];
      if (values.length) lines.push(`import { ${[...new Set(values)].sort().join(", ")} } from "@phosphor-icons/react";`);
      if (types.length) lines.push(`import type { ${[...new Set(types)].sort().join(", ")} } from "@phosphor-icons/react";`);
      // After "use client" (it must stay first) and before the first import.
      const m = s.match(/^(\s*(["'])use client\2;?\r?\n)/);
      const at = m ? m[0].length : 0;
      s = s.slice(0, at) + lines.join(nl) + nl + s.slice(at);
    }
    changed++;
    if (!check) fs.writeFileSync(f, s);
    else console.log("would change", path.relative(root, f));
  }
  console.log(`${check ? "would change" : "changed"} ${changed} files`);
  if (unknown.size) console.log("NOT MAPPED (left as they were):", [...unknown].join(" "));
  if (dynamic.length) console.log("Dynamic iconify ids, fix by hand:", dynamic.join(" "));
}
