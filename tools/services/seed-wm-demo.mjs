// Install dedicated mock accounts/roles and a real mock website-to-CRM handoff.
// Run explicitly; never reset datasets or change existing people, grants or fixtures.
import { pathToFileURL } from 'node:url';

export const DEMO_ROLES = [
  {label: 'Mock content editor', permissions: ['overview:view','content:view','content:edit','pages:view','media:view','localization:view']},
  {label: 'Mock read-only reviewer', permissions: ['overview:view','content:view','media:view','marketing:view']},
];
export const DEMO_USERS = [
  {firstName: 'Demo Lina', lastName: 'Editor', email: 'wm.demo.editor@orgtik.test', role: 'Mock content editor', active: true, rolePaused: false},
  {firstName: 'Demo Adam', lastName: 'Paused', email: 'wm.demo.paused@orgtik.test', role: 'wm_viewer', active: true, rolePaused: true},
  {firstName: 'Demo Maya', lastName: 'Inactive', email: 'wm.demo.inactive@orgtik.test', role: 'wm_viewer', active: false, rolePaused: false},
];
export const DEMO_LEAD_KEY = 'wm-workflows-v1-crm';
const samePermissions = (left,right) => JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

export function validateOrigin(input, hosted) {
  let url;
  try { url = new URL(input); } catch { throw new Error('Provide the local mock origin, or the confirmed Services mock origin with --hosted.'); }
  const local = ['localhost','127.0.0.1','[::1]'].includes(url.hostname) && url.protocol === 'http:';
  const services = hosted && url.protocol === 'https:' && url.hostname === 'orgtik-suite-services.vercel.app';
  if ((!local && !services) || url.username || url.password || url.pathname !== '/' || url.search || url.hash)
    throw new Error('Mock fixtures are restricted to the local suite or the confirmed Services mock origin with --hosted.');
  return url.origin;
}

export async function installDemo({origin,hosted=false,email='mona.adel@orgtik.test',password,accountPassword,fetcher=fetch}) {
  origin = validateOrigin(origin,hosted);
  if (!password || !accountPassword || accountPassword.length < 8) throw new Error('Supply the mock administrator and new demo-account passwords.');
  let token;
  const report = {createdRoles:[],createdUsers:[],preservedUsers:[],lead:null};
  const request = async (route,{method='GET',body,version}={}) => {
    const response = await fetcher(origin+'/wm/api/backend/wm/v2'+route, {
      method,
      signal: AbortSignal.timeout(25000),
      headers:{...(body?{'content-type':'application/json'}:{}),...(!route.startsWith('/public/')&&token?{authorization:'Bearer '+token}:{}),...(version?{'if-match':String(version)}:{})},
      ...(body?{body:JSON.stringify(body)}:{}),
    });
    let json;
    try { json=await response.json(); } catch { throw new Error('Mock API returned an unreadable response for '+route.split('?')[0]); }
    if (!response.ok) throw new Error('Mock fixture request failed: '+method+' '+route.split('?')[0]+' ('+response.status+', '+(json.error?.code??'request_failed')+').');
    return json;
  };
  const list = async route => {
    const rows=[];
    for(let page=1;page<=100;page++) {
      const value=await request(route+'?pageSize=100&page='+page);
      if(!Array.isArray(value.data))throw new Error('Incomplete fixture inventory for '+route);
      rows.push(...value.data);
      if(value.data.length<100||Number.isFinite(value.meta?.total)&&rows.length>=value.meta.total)return rows;
    }
    throw new Error('Fixture inventory exceeds the supported bound.');
  };
  const login=await fetcher(origin+'/wm/api/backend/sos/api/auth/login',{method:'POST',signal:AbortSignal.timeout(25000),headers:{'content-type':'application/json'},body:JSON.stringify({email,password,mode:'staff',target:'wm'})});
  const session=await login.json();
  if(!login.ok||typeof session.data?.tokens?.accessToken!=='string')throw new Error('Mock administrator sign-in failed.');
  token=session.data.tokens.accessToken;
  try {
    const me=(await request('/admin/me')).data;
    if(!me?.identity?.accounts||!['roles:manage','users:manage','marketing:view'].every(permission=>me.permissions?.includes(permission)))
      throw new Error('A central mock administrator with role, user and marketing access is required.');
    if(me.identity.atomicAccountSetup!==true)
      throw new Error('Update the mock runtime before installing accounts; atomic initial account access is required.');
    const roles=(await request('/admin/roles')).data;
    if(!Array.isArray(roles))throw new Error('Mock roles inventory is unavailable.');
    const users=await list('/admin/users'),leads=await list('/admin/leads');
    let lead=leads.find(lead=>lead.context?.mockFixture===DEMO_LEAD_KEY),site;
    if(!lead) {
      site=(await request('/public/site')).data;
      if(site?.forms?.mode!=='live'||!site.forms.privacyVersion)throw new Error('Website forms are not ready. Their mode and privacy settings were preserved; no mock lead was submitted.');
    }
    for(const fixture of DEMO_ROLES) {
      let role=roles.find(role=>role.label===fixture.label);
      if(role&&(role.builtin||!samePermissions(role.permissions,fixture.permissions)))
        throw new Error('Preserved existing role with different permissions: '+fixture.label+'. No accounts were assigned to it.');
      if(!role) {
        role=(await request('/admin/roles',{method:'POST',body:fixture})).data;
        if(!role?.key)throw new Error('The mock role creation receipt is incomplete.');
        roles.push(role);report.createdRoles.push(role.label);
      }
    }
    for(const fixture of DEMO_USERS) {
      const prior=users.find(user=>user.email.toLowerCase()===fixture.email);
      // Existing accounts may have been edited, resumed, disabled or reassigned during a demo.
      if(prior){report.preservedUsers.push({id:prior.id,email:prior.email});continue;}
      const role=roles.find(role=>role.key===fixture.role||role.label===fixture.role);
      if(!role)throw new Error('The demo user role is unavailable.');
      let account;
      try {
        account=(await request('/admin/users',{method:'POST',body:{firstName:fixture.firstName,lastName:fixture.lastName,email:fixture.email,password:accountPassword,roles:[role.key],active:fixture.active,rolePaused:fixture.rolePaused}})).data;
      } catch(error) {
        // Creation and initial access commit together. A lost success reply, or
        // another creator winning this email, never requires modifying the user.
        const retained=(await list('/admin/users')).find(user=>user.email.toLowerCase()===fixture.email);
        if(!retained)throw error;
        report.preservedUsers.push({id:retained.id,email:retained.email});continue;
      }
      if(!account?.id||!account.version||!Array.isArray(account.roles)||!samePermissions(account.roles,[role.key])||account.active!==fixture.active||account.rolePaused!==fixture.rolePaused)
        throw new Error('The atomic demo account creation receipt is incomplete; inspect User Management before retrying.');
      report.createdUsers.push({id:account.id,email:account.email,active:account.active,rolePaused:account.rolePaused});
    }
    if(!lead) {
      const body={name:'Demo Lina · Northstar Studio',email:'crm-linked@wm-demo.example.test',company:'Mock Northstar Studio',topic:'Brand & design',message:'Mock workflow example: refresh the fictional Northstar Studio identity and packaging. This is test data, not a customer enquiry.',page:'/contact',consent:true,privacyVersion:site.forms.privacyVersion,context:{mockFixture:DEMO_LEAD_KEY}};
      let receipt;
      try { receipt=(await request('/public/leads',{method:'POST',body})).data; }
      catch(error) {
        // A lost response may already have committed the normal intake. Recover by its retained marker.
        lead=(await list('/admin/leads')).find(lead=>lead.context?.mockFixture===DEMO_LEAD_KEY);
        if(!lead)throw error;
      }
      if(!lead) {
        if(typeof receipt?.id!=='string')throw new Error('The mock form did not return an accepted lead receipt.');
        lead=(await request('/admin/leads/'+encodeURIComponent(receipt.id))).data;
      }
    }
    const target=(await request('/admin/studio/lead-target/'+encodeURIComponent(lead.id))).data;
    if(lead.handoff?.state!=='sent'||!target?.canOpen||target.destination!=='record')throw new Error('The retained mock lead exists, but its canonical CRM handoff could not be verified. No CRM identifiers were invented.');
    report.lead={id:lead.id,crmPath:target.path,workspaceId:target.workspaceId};
    return report;
  } finally {
    await fetcher(origin+'/wm/api/backend/sos/api/auth/logout',{method:'POST',signal:AbortSignal.timeout(5000),headers:{'content-type':'application/json',authorization:'Bearer '+token},body:'{}'}).catch(()=>{});
  }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href) {
  installDemo({origin:process.argv[2],hosted:process.argv.includes('--hosted'),email:process.env.ORGTIK_WM_DEMO_EMAIL,password:process.env.ORGTIK_WM_DEMO_PASSWORD,accountPassword:process.env.ORGTIK_WM_DEMO_ACCOUNT_PASSWORD})
    .then(report=>console.log(JSON.stringify(report,null,2)))
    .catch(error=>{console.error(error.message);process.exitCode=1;});
}
