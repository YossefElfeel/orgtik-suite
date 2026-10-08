import type { DemoDeal, DemoStage } from "./presentation";
export type StageEditorValues = { label: string; probability: number };
export type StageEditorProps = { stages: DemoStage[]; deals: DemoDeal[]; canManage: boolean; labelOf:(id:string)=>string; onChange:(stages:DemoStage[])=>void };
