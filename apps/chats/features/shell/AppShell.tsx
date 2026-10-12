'use client';
import {useEffect,type ReactNode} from 'react';
import {SuiteFrame,UserMenu,MenuLinkItem,MenuItem,toast,demoRuntime} from '@orgtik/ui';
import {useClientSession,handoffCode} from '@orgtik/ui/auth';
import {IncomingKnock} from './IncomingKnock';
import {HqSidebar} from './HqSidebar';
import {StatusPicker} from './StatusPicker';
import {SettingsEffects} from './SettingsEffects';
import {LiveRegion,ToastHost} from './ShellExtras';
import {MobileTabs} from './MobileTabs';
import {RegisterServiceWorker} from './RegisterServiceWorker';
import {ClientOnly} from './ClientOnly';
import {InactivityMonitor} from './InactivityMonitor';
import {NavProgress} from './NavProgress';
import {SignedOutScreen} from './SignedOutScreen';
import {SuiteGate} from './SuiteGate';
import {useWorkspace} from '@/store';
import {useI18n,useT} from '@/lib/i18n';
import {resumeAudio} from '@/lib/audio';
import {SOS_URL,SOS_API_URL,signOutOfSuite,stopViewing} from '@/lib/suite-session';
import {CHATS_API_URL} from '@/lib/api-url';
export function AppShell({sidebar,children}:{sidebar?:ReactNode;children:ReactNode}){
  const session=useClientSession(),{setLocale}=useI18n(),t=useT(),signedOut=useWorkspace(state=>state.session.state==='signed_out');
  useEffect(()=>{const arm=()=>resumeAudio();document.addEventListener('pointerdown',arm,{once:true});document.addEventListener('keydown',arm,{once:true});return()=>{document.removeEventListener('pointerdown',arm);document.removeEventListener('keydown',arm);};},[]);
  const navigate=async(href:string)=>{if(!session)return window.location.assign(href);try{const target=new URL(href,SOS_URL),code=await handoffCode(SOS_API_URL,session.tokens.accessToken,'suite');window.location.assign(SOS_URL+'/auth/handoff?code='+encodeURIComponent(code)+'&redirect='+encodeURIComponent(target.pathname+target.search));}catch{toast.error(t('suite.navigationFailed','The destination could not be opened. Try again.'));}};
  if(signedOut)return <ClientOnly><SignedOutScreen/></ClientOnly>;
  const user=session?.user,owner=session?.workspaceContext?.member.role==='owner',readonly=session?.workspaceContext?.actor.readOnly;
  return <ClientOnly><SuiteGate><SuiteFrame currentTool='chat' currentScope='hq' currentHref='/hq/office' width='full' apiUrl={CHATS_API_URL} sosUrl={SOS_URL} onNavigate={href=>void navigate(href)} sidebar={sidebar??<HqSidebar/>} demo={{runtime:demoRuntime(process.env.NEXT_PUBLIC_DEMO_API,process.env.NEXT_PUBLIC_DEMO_WEB_URLS,process.env.NEXT_PUBLIC_DEMO_SOS_API),enabled:process.env.NODE_ENV==='development'||process.env.NEXT_PUBLIC_DEMO_PANEL==='1',appKey:'chats',onLocaleChange:setLocale}} userMenu={<><SettingsEffects/><StatusPicker/>{user?<UserMenu name={[user.firstName,user.lastName].filter(Boolean).join(' ')||user.email||'Chats'} email={user.email||''} onLocaleChange={setLocale} onSignOut={()=>void signOutOfSuite()}><MenuLinkItem href={SOS_URL+'/profile'} onClick={event=>{event.preventDefault();void navigate(SOS_URL+'/profile');}}>{t('suite.accountProfile','Account profile')}</MenuLinkItem>{owner&&!readonly?<MenuLinkItem href={SOS_URL+'/billing'} onClick={event=>{event.preventDefault();void navigate(SOS_URL+'/billing');}}>{t('suite.billing','Billing')}</MenuLinkItem>:null}{readonly?<MenuItem onClick={()=>void stopViewing().catch(()=>toast.error(t('suite.stopViewingFailed',"Couldn't return to your account. Try again, or sign out.")))}>{t('suite.returnToAccount','Return to my account')}</MenuItem>:null}</UserMenu>:null}</>}><NavProgress/><InactivityMonitor/><div className='absolute inset-0 flex min-h-0 min-w-0 flex-col'><IncomingKnock/><div className='flex min-h-0 min-w-0 flex-1 flex-col'>{children}</div><MobileTabs/></div></SuiteFrame><ToastHost/><LiveRegion/><RegisterServiceWorker/></SuiteGate></ClientOnly>;
}
