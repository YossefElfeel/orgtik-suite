"use client";

import { useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/app/store";
import { SOS_API_URL } from "@/constants";
import { SuccessResponse } from "@/types";

export interface ISOSScope {
  id: number;
  name: string;
  displayName: string;
  domain: string;
  description: string;
  isActive: boolean;
  metadata?: {
    icon?: string;
    color?: string;
  };
}

export interface ISOSRole {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  scopeId: number | null;
  scopeEntity: ISOSScope | null;
}

export interface ISOSUserScope extends ISOSScope {
  roles: {
    id: number;
    name: string;
    description: string;
    isActive: boolean;
    assignedAt: string;
  }[];
}

export const useSoSApi = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [loading, setLoading] = useState(false);

  const fetcher = useCallback(async <T = any>(path: string, options: RequestInit = {}): Promise<SuccessResponse<T>> => {
    const url = `${SOS_API_URL}${path}`;
    const headers = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    setLoading(true);
    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } finally {
      setLoading(false);
    }
  }, [token]);

  const getScopes = useCallback(async () => {
    return fetcher<ISOSScope[]>("/scopes?isActive=true");
  }, [fetcher]);

  const getUserScopes = useCallback(async (authUserId: string | number) => {
    return fetcher<ISOSUserScope[]>(`/rbac/users/${authUserId}/scopes`);
  }, [fetcher]);

  const getScopeRoles = useCallback(async (scopeName: string) => {
    return fetcher<ISOSRole[]>(`/rbac/roles?scope=${scopeName}`);
  }, [fetcher]);

  const updateUserScopes = useCallback(async (authUserId: string | number, scopes: string[]) => {
    return fetcher(`/rbac/users/${authUserId}/scopes`, {
      method: "POST",
      body: JSON.stringify({ scopes }),
    });
  }, [fetcher]);

  const updateUserRoles = useCallback(async (authUserId: string | number, scope: string, roleIds: number[]) => {
    return fetcher(`/rbac/users/${authUserId}/roles`, {
      method: "POST",
      body: JSON.stringify({ roleIds, scope }),
    });
  }, [fetcher]);

  const toggleScope = useCallback(async (authUserId: string | number, scopeName: string) => {
    return fetcher(`/rbac/users/${authUserId}/scopes/${scopeName}/toggle`, {
      method: "PATCH",
    });
  }, [fetcher]);

  const toggleRole = useCallback(async (authUserId: string | number, roleId: number, scope: string) => {
    return fetcher(`/rbac/users/${authUserId}/roles/${roleId}/toggle?scope=${encodeURIComponent(scope)}`, {
      method: "PATCH",
    });
  }, [fetcher]);

  return {
    getScopes,
    getUserScopes,
    getScopeRoles,
    updateUserScopes,
    updateUserRoles,
    toggleScope,
    toggleRole,
    loading,
  };
};
