"use client";
import { useEffect, useState } from "react";
import { suiteApiRoot, useSuite } from "@orgtik/ui";
import type { AccountFileReference } from "@/types/file-references";
export function WorkspaceLogo({ reference, name }: { reference: AccountFileReference | null | undefined; name: string }) {
  const suite=useSuite(), token=suite.session?.tokens.accessToken, workspaceId=suite.snapshot?.workspace.id;
  const [image,setImage]=useState<{key:string;url:string}>();
  const key=JSON.stringify([workspaceId,reference,token]);
  useEffect(()=>{
    if(!reference||!token||reference.workspaceId!==workspaceId||!suite.accessibleTools.includes("files"))return;
    let live=true,url:string|undefined;const controller=new AbortController();
    void fetch(`${suiteApiRoot(suite.apiUrl||"")}/files/${encodeURIComponent(reference.fileId)}/versions/${encodeURIComponent(reference.versionId)}/content`,{headers:{Authorization:"Bearer "+token},signal:controller.signal}).then(async response=>{
      if(!response.ok||!['image/png','image/jpeg','image/gif','image/webp'].includes(response.headers.get('content-type')?.split(';')[0]||''))return;
      const bytes=await response.blob();if(!live)return;url=URL.createObjectURL(bytes);setImage({key,url});
    }).catch(()=>{});
    return()=>{live=false;controller.abort();if(url)URL.revokeObjectURL(url);};
  },[key,suite.apiUrl]);
  return image?.key===key?<img src={image.url} alt={name} className="size-12 shrink-0 rounded-field object-contain"/>:null;
}
