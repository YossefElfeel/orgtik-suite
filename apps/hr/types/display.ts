import type {ReactNode} from 'react';
import type {Icon} from '@phosphor-icons/react';
export type InfoCardItem={id:string;label:string;value:ReactNode;icon?:Icon;userContent?:boolean};
export type InfoCardProps={title:string;icon?:Icon;onEdit?:()=>void;items?:InfoCardItem[];children?:ReactNode;className?:string;gridClassName?:string};
export type InfoCardSkeletonProps={itemCount?:number;className?:string;gridClassName?:string;children?:ReactNode};
export type WizardStepStatus='active'|'done'|'pending';
export type WizardStepProps={step:number;label:string;title:string;status:WizardStepStatus;onClick?:()=>void;disabled?:boolean;className?:string};
export type HrRichTextEditorProps={initialHtml?:string;onHtmlChange?:(html:string)=>void;placeholder?:string;className?:string;'aria-label'?:string;id?:string;'aria-describedby'?:string;'aria-invalid'?:boolean};
