import type {HrChecklistItem,HrTaskReference,HrEffectiveChecklistStep} from '@/types/workspace';
/** Linked work follows the currently visible Tasks status; manual steps follow their saved checkbox. */
export function effectiveOnboardingSteps(items:HrChecklistItem[],references:HrTaskReference[]):HrEffectiveChecklistStep[]{return items.map(item=>{const task=item.taskId?references.find(row=>String(row.id)===item.taskId):undefined;return{...item,complete:item.taskId?task?.status==='done':item.done,...(task?{task}:{})};});}
export function onboardingIsComplete(steps:HrEffectiveChecklistStep[]):boolean{return steps.length>0&&steps.every(step=>step.complete);}
