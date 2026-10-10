// Company audiences, segments, CSV contact imports, and messaging senders/templates (Email, SMS, WhatsApp).
const fs = require("fs");
const { send, error, newId, nowIso, paginate, textMatch, listParam, slugify } = require("../lib");

// Minimal RFC-4180-ish CSV parser (quotes, escaped quotes, CRLF, ; or , delimiters, BOM).
function parseCsv(text) {
  const src = String(text || "").replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/)[0] || "";
  const delim = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ";" : ",";
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === delim) { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const clean = rows.filter((r) => r.some((x) => String(x).trim() !== ""));
  const headers = (clean.shift() || []).map((h, i) => String(h).trim() || `Column ${i + 1}`);
  const records = clean.map((r) => Object.fromEntries(headers.map((h, i) => [h, String(r[i] ?? "").trim()])));
  return { headers, records };
}

module.exports = function audienceRoutes(app, { ctx, getDb, views, h }) {
  // ---------------------------------------------------------------- audiences
  app.get("/audiences", h.handle((req, res, u, project) => {
    const list = getDb().audiences.filter((a) => a.projectId === project.id && textMatch(req.query.q || req.query.search, a.name, a.description))
      .sort((a, b) => b.contactsCount - a.contactsCount);
    const { items, meta } = paginate(list, req.query, 50);
    send(res, { items: items.map(views.audienceView), meta }, "Audiences fetched successfully");
  }));

  // ---------------------------------------------------------------- segments
  app.get("/audiences/segments", h.handle((req, res, u, project) => {
    const audienceId = req.query.audienceId || null;
    const list = getDb().segments.filter((s) => s.projectId === project.id && (!audienceId || !s.audienceId || s.audienceId === audienceId) && textMatch(req.query.q || req.query.search, s.name, s.description))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const { items, meta } = paginate(list, req.query, 50);
    send(res, { items: items.map((s) => views.segmentView(s, audienceId)), meta }, "Segments fetched successfully");
  }));

  const cleanRules = (r = {}) => ({
    ...(r.source ? { source: String(r.source).trim() } : {}), ...(r.type ? { type: String(r.type).trim() } : {}),
    ...(r.interest ? { interest: String(r.interest).trim() } : {}), ...(r.qualifiedOnly ? { qualifiedOnly: true } : {}),
  });

  app.post("/audiences/segments", h.handle((req, res, u, project) => {
    const name = String(req.body?.name || "").trim();
    if (!name) return error(res, 422, "Segment name is required", { errors: { name: ["Segment name is required"] } });
    const s = { id: newId(), projectId: project.id, audienceId: req.body?.audienceId || null, name, description: req.body?.description?.trim() || null, rules: cleanRules(req.body?.rules), createdAt: nowIso(), updatedAt: nowIso() };
    getDb().segments.push(s);
    send(res, views.segmentView(s), "Segment created successfully", 201);
  }));

  app.patch("/audiences/segments/:id", h.handle((req, res, u, project) => {
    const s = getDb().segments.find((x) => x.id === req.params.id && x.projectId === project.id);
    if (!s) return h.notFound(res, "Segment");
    if (req.body?.name !== undefined) s.name = String(req.body.name).trim() || s.name;
    if (req.body?.description !== undefined) s.description = String(req.body.description || "").trim() || null;
    if (req.body?.rules !== undefined) s.rules = cleanRules(req.body.rules);
    s.updatedAt = nowIso();
    send(res, views.segmentView(s), "Segment updated successfully");
  }));

  app.delete("/audiences/segments/:id", h.handle((req, res, u, project) => {
    const db = getDb();
    const s = db.segments.find((x) => x.id === req.params.id && x.projectId === project.id);
    if (!s) return h.notFound(res, "Segment");
    db.segments = db.segments.filter((x) => x.id !== s.id);
    send(res, { id: s.id }, "Segment deleted successfully");
  }));

  // Historical imports remain readable; current master contacts are owned by CRM.
  app.post("/audiences/imports", h.handle((_req,res)=>res.status(410).json({success:false,code:"managed_in_crm",path:"/our-audience/contacts",message:"Choose canonical CRM contact references."}),{needsProject:false}));
  app.post("/audiences/imports/:id/commit", h.handle((_req,res)=>res.status(410).json({success:false,code:"managed_in_crm",path:"/our-audience/contacts",message:"Choose canonical CRM contact references."}),{needsProject:false}));
  // ---------------------------------------------------------------- CSV imports
  // POST /audiences/imports (multipart `file`) -> preview { id, headers, preview, totalRows, status }
  app.post("/audiences/imports", ctx.upload.any(), h.handle((req, res, u, project) => {
    const file = (req.files || []).find((f) => f.fieldname === "file") || (req.files || [])[0];
    if (!file) return error(res, 422, "Please upload a .csv or .xlsx file");
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    let headers;
    let records;
    if (ext === "csv" || ext === "txt" || /csv|text/.test(file.mimetype)) {
      ({ headers, records } = parseCsv(fs.readFileSync(file.path, "utf8")));
      if (!headers.length || !records.length) return error(res, 422, "The file has no data rows — add a header row and at least one contact");
    } else if (ext === "xlsx" || ext === "xls") {
      // No spreadsheet parser in the local mock: show a representative preview so the flow can continue.
      headers = ["Full name", "Email", "Phone", "City"];
      records = [["Mariam Adel", "mariam.adel@example.com", "+20 100 123 4567", "Alexandria"], ["Khaled Nasser", "khaled.nasser@example.com", "+966 50 222 1100", "Riyadh"], ["Laila Hamdy", "laila.hamdy@example.com", "+971 55 410 8890", "Dubai"], ["Omar Fathi", "omar.fathi@example.com", "+20 122 900 3344", "Cairo"]]
        .map((r) => Object.fromEntries(headers.map((h2, i) => [h2, r[i]])));
      records = Array.from({ length: 48 }, (_, i) => records[i % records.length]);
    } else {
      return error(res, 422, "Unsupported file type — upload a .csv or .xlsx file");
    }
    const imp = { id: newId(), projectId: project.id, userId: u.id, fileName: file.originalname, status: "PREVIEW_READY", headers, rows: records, totalRows: records.length, mapping: null, savedAudienceId: null, createdAt: nowIso(), updatedAt: nowIso() };
    getDb().imports.push(imp);
    send(res, { id: imp.id, fileName: imp.fileName, headers, preview: records.slice(0, 5), totalRows: records.length, status: imp.status }, `${records.length} contacts found in ${file.originalname}`, 201);
  }));

  app.get("/audiences/imports/:id", h.handle((req, res, u, project) => {
    const imp = getDb().imports.find((x) => x.id === req.params.id && x.projectId === project.id);
    if (!imp) return h.notFound(res, "Import");
    send(res, { id: imp.id, fileName: imp.fileName, headers: imp.headers, preview: (imp.rows || []).slice(0, 5), totalRows: imp.totalRows, status: imp.status, savedAudienceId: imp.savedAudienceId }, "Import fetched successfully");
  }));

  // POST /audiences/imports/:id/commit { nameColumn, emailColumn?, phoneColumn?, saveAsCompanyAudience, audienceName? }
  app.post("/audiences/imports/:id/commit", h.handle((req, res, u, project) => {
    const db = getDb();
    const imp = db.imports.find((x) => x.id === req.params.id && x.projectId === project.id);
    if (!imp) return h.notFound(res, "Import");
    const b = req.body || {};
    if (!b.nameColumn || !imp.headers.includes(b.nameColumn)) return error(res, 422, "Choose which column holds the contact name");
    for (const col of [b.emailColumn, b.phoneColumn]) if (col && !imp.headers.includes(col)) return error(res, 422, `Column "${col}" is not in the file`);
    if (!b.emailColumn && !b.phoneColumn) return error(res, 422, "Map an email or a phone column so contacts can be reached");
    const valid = (imp.rows || []).filter((r) => String(r[b.nameColumn] || "").trim() && (String(r[b.emailColumn] || "").includes("@") || String(r[b.phoneColumn] || "").replace(/\D/g, "").length >= 8));
    imp.mapping = { nameColumn: b.nameColumn, emailColumn: b.emailColumn || null, phoneColumn: b.phoneColumn || null };
    imp.status = "COMPLETED";
    imp.importedCount = valid.length;
    imp.skippedCount = imp.totalRows - valid.length;
    imp.updatedAt = nowIso();
    let audience = null;
    if (b.saveAsCompanyAudience) {
      const name = String(b.audienceName || "").trim() || imp.fileName.replace(/\.[^.]+$/, "");
      audience = { id: newId(), projectId: project.id, name, description: `Imported from ${imp.fileName} on ${new Date().toLocaleDateString("en-GB")}`, contactsCount: valid.length, createdAt: nowIso(), updatedAt: nowIso() };
      db.audiences.push(audience);
      imp.savedAudienceId = audience.id;
    }
    send(res, { id: imp.id, status: imp.status, importedCount: valid.length, skippedCount: imp.skippedCount, audienceId: audience?.id || null, ...(audience ? { audience: views.audienceView(audience) } : {}) },
      audience ? `${valid.length} contacts saved to "${audience.name}"` : `${valid.length} contacts imported`);
  }));

  app.get("/audiences/:id", h.handle((req, res, u, project) => {
    const a = getDb().audiences.find((x) => x.id === req.params.id && x.projectId === project.id);
    if (!a) return h.notFound(res, "Audience");
    send(res, views.audienceView(a), "Audience fetched successfully");
  }));

  // ---------------------------------------------------------------- messaging senders & templates
  const inScope = (x, project) => !x.projectId || x.projectId === project.id;

  app.get("/messaging/sender-configs", h.handle((req, res, u, project) => {
    const channel = req.query.channel ? String(req.query.channel).toUpperCase() : null;
    const list = getDb().senders.filter((s) => inScope(s, project) && (!channel || s.channel === channel) && textMatch(req.query.q, s.name, JSON.stringify(s.configuration)));
    const { items, meta } = paginate(list, req.query, 50);
    send(res, { items: items.map(views.senderView), meta }, "Sender configurations fetched successfully");
  }));

  app.get("/messaging/templates", h.handle((req, res, u, project) => {
    const channel = req.query.channel ? String(req.query.channel).toUpperCase() : null;
    const list = getDb().templates.filter((t) => inScope(t, project) && (!channel || t.channel === channel) && textMatch(req.query.q, t.name, t.subject, t.body))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const { items, meta } = paginate(list, req.query, 50);
    send(res, { items: items.map(views.templateView), meta }, "Templates fetched successfully");
  }));

  app.post("/messaging/templates", h.handle((req, res, u, project) => {
    const b = req.body || {};
    const db = getDb();
    const channel = String(b.channel || "").toUpperCase();
    if (!["EMAIL", "SMS", "WHATSAPP"].includes(channel)) return error(res, 422, "channel must be EMAIL, SMS or WHATSAPP");
    const name = String(b.name || "").trim();
    const body = String(b.body || "").trim();
    if (!name || !body) return error(res, 422, "Template name and body are required");
    const sender = b.senderConfigId ? db.senders.find((s) => s.id === b.senderConfigId && inScope(s, project)) : db.senders.find((s) => s.channel === channel && inScope(s, project) && s.isActive);
    if (!sender) return error(res, 422, "Choose a sender for this template");
    if (sender.channel !== channel) return error(res, 422, `The selected sender is not a ${channel} sender`);
    if (channel === "SMS" && body.length > 612) return error(res, 422, "SMS templates are limited to 612 characters (4 segments)");
    const found = (`${b.subject || ""} ${body}`.match(/\{\{\s*([\w.-]+)\s*\}\}/g) || []).map((m) => m.replace(/[{}\s]/g, ""));
    const t = {
      id: newId(), projectId: project.id, channel, senderConfigId: sender.id, name, subject: channel === "EMAIL" ? String(b.subject || "").trim() || null : null, body,
      variables: [...new Set([...(listParam(b.variables)), ...found])],
      providerData: channel === "WHATSAPP" ? { status: "APPROVED", category: "MARKETING", language: /[؀-ۿ]/.test(body) ? "ar" : "en", templateName: slugify(name).replace(/-/g, "_"), ...(b.providerData || {}) } : { ...(b.providerData || {}) },
      isActive: true, createdByUserId: u.id, createdAt: nowIso(), updatedAt: nowIso(),
    };
    db.templates.push(t);
    send(res, views.templateView(t), "Template created successfully", 201);
  }));
};

module.exports.parseCsv = parseCsv;
