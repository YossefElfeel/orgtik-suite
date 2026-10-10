'use client';
import {useEffect,useState} from 'react';
import {useTranslations} from 'next-intl';
import {PageHeader,Button,EmptyState,LoadingState,ErrorState,Card,Switch,useSuite} from '@orgtik/ui';
import HrActionSheet from '@/components/sheets/HrActionSheet';
import {hrRequest} from '@/lib/hr-workspace';
import {useHrWorkspace} from '@/hooks/useHrWorkspace';
import {Link} from '@/i18n/routing';
import type {HrActionSpec,HrCareerOpening} from '@/types/workspace';
export default function CareersPage(){
  const t=useTranslations('HrWorkspace'),suite=useSuite(),{data:workspace,change}=useHrWorkspace();
  const [jobs,setJobs]=useState<HrCareerOpening[]>(),[error,setError]=useState(false),[action,setAction]=useState<HrActionSpec|null>(null),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);
  const load=async()=>{setError(false);try{setJobs(await hrRequest<HrCareerOpening[]>('/hr/careers'));}catch{setError(true);}};
  useEffect(()=>{void load();},[]);
  return <div className='flex flex-col gap-5'><PageHeader title={t('careers')} description={t('careersIntro')}/>
  {workspace?.canManage?<div className='flex flex-wrap items-center justify-between gap-4'><Switch label={t('publishCareers')} checked={workspace.careersEnabled} disabled={!suite.toolState('hr')?.canWrite||suite.snapshot?.actor.readOnly} onCheckedChange={enabled=>void change('/hr/careers/settings','PUT',{enabled:!!enabled}).catch(()=>{})}/>{workspace.careersEnabled?<Link href={'/jobs/'+suite.snapshot?.workspace.id}>{t('publicLink')}</Link>:null}</div>:null}
  {saved?<p role='status' className='text-success'>{t('applicationSent')}</p>:null}
  {error?<ErrorState onRetry={()=>void load()}/>:!jobs?<LoadingState rows={4}/>:jobs.length?jobs.map(job=><Card key={job.id}><h2 className='text-heading-sm'>{job.title}</h2><p className='mt-2 text-body-sm text-fg-muted'>{job.location}</p><Button className='mt-4' onClick={()=>setAction({title:t('apply'),submitLabel:t('apply'),path:'/recruitment/jobs/'+job.id+'/apply',fields:[{key:'fullName',label:t('name')},{key:'email',label:t('email'),type:'email'},{key:'phoneNumber',label:t('phoneNumber'),optional:true},{key:'coverLetter',label:t('coverLetter'),type:'textarea',optional:true}]})}>{t('apply')}</Button></Card>):<EmptyState title={t('noOpenings')}/>}
  <HrActionSheet action={action} onClose={()=>setAction(null)} busy={busy} onSubmit={async(spec,values)=>{setBusy(true);try{await hrRequest(spec.path,'POST',values);setSaved(true);}finally{setBusy(false);}}}/></div>;
}
