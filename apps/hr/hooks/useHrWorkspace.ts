'use client';
import {useCallback,useEffect,useState} from 'react';
import {useClientSession} from '@orgtik/ui/auth';
import {hrRequest} from '@/lib/hr-workspace';
import type {HrWorkspace} from '@/types/workspace';
export function useHrWorkspace(){const session=useClientSession(),[data,setData]=useState<HrWorkspace>(),[error,setError]=useState<unknown>(),[busy,setBusy]=useState(false),[saved,setSaved]=useState(false);const workspace=session?.workspaceContext?.workspace.id;const reload=useCallback(async()=>{try{setError(undefined);setData(await hrRequest<HrWorkspace>('/hr/workspace'));}catch(e){setError(e);}},[workspace,session?.tokens.accessToken]);useEffect(()=>{setData(undefined);void reload();},[reload]);const change=async(path:string,method='POST',body?:unknown,operationId?:string)=>{setBusy(true);setSaved(false);try{const result=await hrRequest<unknown>(path,method,body,operationId||crypto.randomUUID());await reload();setSaved(true);return result;}catch(e){setError(e);throw e;}finally{setBusy(false);}};return{data,error,busy,saved,reload,change};}
