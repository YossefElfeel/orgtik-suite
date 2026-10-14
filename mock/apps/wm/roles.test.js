const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const http = require("node:http");
// Native HTTP permits every OS-assigned ephemeral port, including fetch's blocked ports.
function request(url, { body, ...options }) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, res => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", chunk => { text += chunk; });
      res.on("end", () => resolve({ status: res.statusCode, text: async () => text, json: async () => JSON.parse(text) }));
      res.on("error", reject);
    });
    req.on("error", reject);
    req.end(body);
  });
}
const { registerRoles, validateRoleOverrides } = require("./roles");
const { permissionsFor } = require("./permissions");
const { registerUsers } = require("./users");

test("Role edits enforce authority, versions and self-protection, and immediately change effective access", async (t) => {
  const overrides = {},
    audit = [];
  const actorRoles = {
    admin: ["wm_admin"],
    editor: ["wm_editor"],
    owner: ["wm_owner"],
  };
  const identity = {
    grants: { global: { owner: { roles: ["super_admin"] } } },
  };
  const app = express();
  app.use(express.json());
  const need = (permission) => (req, res, next) => {
    const key = req.get("actor") || "admin";
    req.who = {
      user: { key },
      roles: actorRoles[key],
      permissions: permissionsFor(actorRoles[key], overrides),
    };
    if (!req.who.permissions.includes(permission))
      return res.status(403).json({ code: "forbidden" });
    next();
  };
  registerRoles(app, {
    identity,
    store: { audit },
    overrides,
    need,
    ok: (res, data) => res.json({ data }),
    fail: (res, status, code) => res.status(status).json({ code }),
  });
  app.post("/create", need("content:create"), (_req, res) =>
    res.status(204).end(),
  );
  app.patch("/edit", need("content:edit"), (_req, res) =>
    res.status(204).end(),
  );
  app.delete("/delete", need("content:delete"), (_req, res) =>
    res.status(204).end(),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      }),
  );
  const call = async (method, url, body, version, actor = "admin") => {
    const response = await request(
      `http://127.0.0.1:${server.address().port}${url}`,
      {
        method,
        headers: {
          actor,
          "content-type": "application/json",
          ...(version ? { "if-match": version } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    return {
      status: response.status,
      body: response.status === 204 ? null : await response.json(),
    };
  };
  const roles = (await call("GET", "/v2/admin/roles")).body.data;
  assert.deepEqual(
    roles.slice(0, 3).map((r) => r.label),
    ["Owner", "Super admin", "Admin"],
  );
  const editor = roles.find((r) => r.key === "wm_editor");
  const permissions = editor.permissions.filter(
    (p) => !["content:create", "content:delete"].includes(p),
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/v2/admin/roles/wm_editor",
        { permissions },
        editor.version,
        "editor",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/v2/admin/roles/wm_owner",
        { permissions },
        roles[0].version,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/v2/admin/roles/wm_editor",
        { permissions: ["unknown:grant"] },
        editor.version,
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/v2/admin/roles/wm_editor",
        { permissions: ["content:view", "content:view"] },
        editor.version,
      )
    ).status,
    422,
  );
  assert.equal(
    (await call("PATCH", "/v2/admin/roles/wm_editor", { permissions }, "stale"))
      .status,
    412,
  );
  const saved = await call(
    "PATCH",
    "/v2/admin/roles/wm_editor",
    { permissions },
    editor.version,
  );
  assert.equal(saved.status, 200);
  assert.notEqual(saved.body.data.version, editor.version);
  assert.equal(
    (await call("POST", "/create", {}, undefined, "editor")).status,
    403,
  );
  assert.equal(
    (await call("DELETE", "/delete", undefined, undefined, "editor")).status,
    403,
  );
  assert.equal(
    (await call("PATCH", "/edit", {}, undefined, "editor")).status,
    204,
  );
  assert.equal(
    (
      await call(
        "PATCH",
        "/v2/admin/roles/wm_editor",
        { permissions },
        editor.version,
      )
    ).status,
    412,
  );
  assert.equal(audit[0].action, "role_permissions");
  const admin = roles.find((r) => r.key === "wm_admin");
  assert.equal(
    (
      await call(
        "PATCH",
        "/v2/admin/roles/wm_admin",
        { permissions: admin.permissions.filter((p) => p !== "roles:manage") },
        admin.version,
      )
    ).body.code,
    "self_lockout",
  );
  assert.deepEqual(validateRoleOverrides(overrides), overrides);
  assert.throws(() => validateRoleOverrides({ wm_editor: ["unknown:grant"] }));
});

test("Custom role definitions validate names and grants, update assigned access, and cannot delete assigned or built-in roles", async t => {
  const definitions = {}, overrides = {}, audit = [];
  const users = [{id:1,key:"admin",firstName:"Admin",lastName:"Test",email:"admin@test.invalid",isActive:true},{id:2,key:"staff",firstName:"Staff",lastName:"Test",email:"staff@test.invalid",isActive:true}];
  const identity = {users,grants:{website_manager:{admin:{roles:["wm_admin"]},staff:{roles:["wm_viewer"]}}},fullName:user=>user.firstName+" "+user.lastName,userScopes:user=>[{scope:"website_manager",roles:identity.grants.website_manager[user.key].roles}],findUser:id=>users.find(user=>user.id===Number(id))};
  const S = {db:{},workspace:()=>({members:users.map(user=>({userKey:user.key,status:"active",role:"member"}))}),log(){}};
  const app = express(); app.use(express.json());
  const fail = (res,status,code)=>res.status(status).json({code});
  const need = permission => (req,res,next) => {
    const user=users.find(user=>user.key===(req.get("actor")||"admin")),roles=identity.grants.website_manager[user.key].roles;
    req.who={user,roles,permissions:permissionsFor(roles,overrides)};
    return req.who.permissions.includes(permission)?next():fail(res,403,"forbidden");
  };
  const shared={identity,store:{audit},overrides,definitions,need,fail,ok:(res,data,_meta,status=200)=>res.status(status).json({data})};
  registerRoles(app,shared);
  registerUsers(app,{...shared,platform:()=>S,page:(_req,rows)=>({rows,meta:{}})});
  app.get("/access",need("content:edit"),(_req,res)=>res.status(204).end());
  const server=app.listen(0,"127.0.0.1");await new Promise(resolve=>server.once("listening",resolve));t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections();}));
  const call=async(method,url,body,version,actor="admin")=>{const r=await request(`http://127.0.0.1:${server.address().port}${url}`,{method,headers:{actor,"content-type":"application/json",...(version?{"if-match":version}:{})},...(body?{body:JSON.stringify(body)}:{})});const text=await r.text();return{status:r.status,...(text?JSON.parse(text):{})};};
  const route="/v2/admin/roles",grants=["settings:view","content:view"];
  assert.equal((await call("POST",route,{label:"Forbidden",permissions:[]},undefined,"staff")).status,403);
  for(const label of ["",null,"x".repeat(101)," Admin "])assert.equal((await call("POST",route,{label,permissions:grants})).status,422);
  for(const permissions of [["unknown:grant"],["content:view","content:view"],null])assert.equal((await call("POST",route,{label:"Test role",permissions})).status,422);
  const created=await call("POST",route,{label:" Review team ",permissions:grants});assert.equal(created.status,201);const role=created.data;
  assert.equal(role.label,"Review team");assert.equal(role.builtin,false);assert.equal(role.protected,false);assert.equal(role.assignedCount,0);
  assert.equal((await call("POST",route,{label:"review TEAM",permissions:grants})).status,422);
  assert.equal((await call("PATCH",route+"/"+role.key,{label:null},role.version)).status,422);
  const beforeInvalid=JSON.stringify({definitions,overrides});assert.equal((await call("PATCH",route+"/"+role.key,{label:"Renamed",permissions:["bad"]},role.version)).status,422);assert.equal(JSON.stringify({definitions,overrides}),beforeInvalid);
  const staff=(await call("GET","/v2/admin/users")).data.find(user=>user.key==="staff");
  const assigned=await call("PATCH","/v2/admin/users/2",{roles:[role.key]},staff.version);assert.equal(assigned.status,200);assert.equal((await call("GET","/access",undefined,undefined,"staff")).status,403);
  const renamed=await call("PATCH",route+"/"+role.key,{label:"Review editors",permissions:[...grants,"content:edit","users:view","users:manage","roles:manage"]},role.version);assert.equal(renamed.status,200);assert.notEqual(renamed.data.version,role.version);assert.equal(renamed.data.assignedCount,1);
  assert.equal((await call("GET","/access",undefined,undefined,"staff")).status,204);
  assert.equal((await call("PATCH","/v2/admin/users/2",{roles:[]},assigned.data.version,"staff")).code,"self_lockout");
  assert.equal((await call("DELETE",route+"/"+role.key,undefined,renamed.data.version)).code,"role_in_use");
  assert.equal((await call("DELETE",route+"/wm_viewer",undefined,"any")).code,"builtin_role");
  assert.equal((await call("PATCH",route+"/wm_owner",{label:"Forged owner"},"any")).status,403);
  assert.equal((await call("PATCH","/v2/admin/users/2",{roles:[]},assigned.data.version)).status,200);
  assert.equal((await call("DELETE",route+"/"+role.key,undefined,role.version)).status,412);
  assert.equal((await call("DELETE",route+"/"+role.key,undefined,renamed.data.version)).status,204);
  assert.equal(definitions[role.key],undefined);assert.equal(overrides[role.key],undefined);
  const current=(await call("GET","/v2/admin/users")).data.find(user=>user.key==="staff");assert.equal((await call("PATCH","/v2/admin/users/2",{roles:[role.key]},current.version)).status,422);
  assert.deepEqual(audit.filter(row=>row.type==="role").map(row=>row.action),["role_delete","role_update","role_create"]);
});
