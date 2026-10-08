import type { LeadStatus } from "@/types/customers";
import type { DemoDeal, SalesScene } from "@/types/presentation";

export const people: Record<string,string> = { current: "Omar Farouk", mona: "Mona Adel", nour: "Nour Khaled", rana: "Rana Saad", omar: "Omar Farouk", salma: "Salma Nabil", hoda: "Hoda Ashraf", hany: "Hany Samir" };
export const spaces: Record<string,{name:string;currency:string}> = { current: {name:"Nile Foods",currency:"EGP"}, nile: {name:"Nile Foods",currency:"EGP"},orgtik:{name:"OrgTik",currency:"CHF"},spree:{name:"Spree",currency:"EUR"},desert:{name:"Desert",currency:"AED"},new:{name:"New workspace",currency:"EGP"} };
export const keyFor = (workspace: string) => `orgtik:presentation:sales:${workspace}`;
export const probabilityFor: Partial<Record<LeadStatus,number>> = { new:10, contacted:25, qualified:50, quoted:75, won:100, lost:0 };
export function createDeal(name:string,company:string,email:string,value:number,source:string,owner="Omar Farouk"):DemoDeal { return {id:crypto.randomUUID(),name,company,email,value,source,owner,stage:"new",probability:10,tags:[],fields:{},lostReason:"",timeline:[],tasks:[],offer:{validUntil:"2026-10-21",signedBy:null,expired:false}}; }
export function seedScene(workspace:string):SalesScene {
 const records=[
  {name:"Leila Mansour",company:"Atlas Studio",email:"leila@atlas.example",value:24000,source:"website",stage:"quoted" as LeadStatus},
  {name:"Jonas Weber",company:"Nord Coffee",email:"jonas@nord.example",value:12000,source:"referral",stage:"qualified" as LeadStatus},
  {name:"Sara Amin",company:"Cedar Goods",email:"sara@cedar.example",value:18000,source:"partner",stage:"won" as LeadStatus},
  {name:"Yara Nasser",company:"Field Notes",email:"yara@field.example",value:9000,source:"event",stage:"lost" as LeadStatus},
 ];
 const multiplier=workspace==="spree"||workspace==="orgtik"?0.1:workspace==="desert"?0.3:1;
 return {target:60000*multiplier,rule:{source:"website",owner:"Omar Farouk",enabled:true},deals:workspace==="new"?[]:records.map<DemoDeal>((record,index)=>({...createDeal(record.name,record.company,record.email,record.value*multiplier,record.source),id:`sales-demo-${index+1}`,stage:record.stage,probability:probabilityFor[record.stage]??10,tags:index===0?["priority"]:[],fields:Object.fromEntries(index===0?[["sector","Design"]]:[]),lostReason:record.stage==="lost"?"Budget":"",timeline:[{id:`event-${index}`,text:"Initial conversation recorded for the presentation.",actor:"Omar Farouk"}]}))};
}
/** Text-only CSV, quoted commas and doubled quotes supported; no binary upload. */
export function parseCsv(text:string): string[][] {
 const rows:string[][]=[], row:string[]=[];let value="",quoted=false;
 const push=()=>{row.push(value);value="";};
 for(let i=0;i<text.length;i++){const c=text[i]!;if(c==='"'){if(quoted&&text[i+1]==='"'){value+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted)push();else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;push();if(row.some(cell=>cell.trim()))rows.push([...row]);row.length=0;}else value+=c;}
 if(quoted)throw new Error("Unclosed quoted field");push();if(row.some(cell=>cell.trim()))rows.push([...row]);return rows;
}
export const csvOf=(deals:DemoDeal[])=>["name,company,email,value,source",...deals.map(d=>[d.name,d.company,d.email,String(d.value),d.source].map(value=>'"'+value.replaceAll('"','""')+'"').join(','))].join('\r\n');
