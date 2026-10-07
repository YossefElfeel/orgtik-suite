"use client";
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/redux/app/hooks';
import { baseApi } from '@/redux/app/baseApi';
// Private hosted graphs have no global Socket.IO room. Poll the bound workspace instead.
export function Realtime() {
  const token = useAppSelector(state => state.auth.token), workspaceId = useAppSelector(state => state.auth.user?.workspaceContext?.workspace.id), dispatch = useAppDispatch();
  useEffect(() => {
    if (!token || !workspaceId) return;
    const refresh = () => dispatch(baseApi.util.invalidateTags(['Notifications', 'Project', 'Task']));
    const timer = window.setInterval(refresh, 10000); window.addEventListener('focus', refresh);
    return () => { window.clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, [token, workspaceId, dispatch]);
  return null;
}
