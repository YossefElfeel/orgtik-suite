"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useEmployeeWizard } from "../EmployeeWizardContext";
import { useSearchParams } from "next/navigation";
import { onFormErrorDisplay } from "@/lib/form-error-toast";
import { useSoSApi, ISOSScope, ISOSRole } from "@/hooks/useSoSApi";
import { permissionsSchema, type PermissionsFormValues } from "../schemas";
import { toast } from "sonner";
import { SUITE_APP_ICONS } from "@/constants/suite-icons";

import { Skeleton } from "@/components/ui/skeleton";
import { IOnboardingStepDTO } from "@/types/employee";
import { useUpdateOnboardingStepMutation, useGetEmployeeQuery } from "@/redux/features/employee/employeeApi";
import { useReqWithToaster } from "@/hooks/useReqWithToaster";

type FormType = PermissionsFormValues;

function ScopeBlock({
  scope,
  authUserId,
  api,
  form,
}: {
  scope: ISOSScope;
  authUserId: string | number;
  api: Pick<ReturnType<typeof useSoSApi>, "toggleScope" | "toggleRole" | "getScopeRoles">;
  form: any;
}) {
  const [roles, setRoles] = useState<ISOSRole[]>([]);
  const tFeedback = useTranslations("feedback");
  const [loadingRoles, setLoadingRoles] = useState(false);

  const { getScopeRoles, toggleScope, toggleRole } = api;

  const scopeData = useWatch({
    control: form.control,
    name: `scopes.${scope.name}`,
  });

  const enabled = scopeData?.enabled || false;
  const selectedRoleIds = scopeData?.roleIds || [];

  useEffect(() => {
    if (enabled && roles.length === 0) {
      setLoadingRoles(true);
      getScopeRoles(scope.name)
        .then((res) => setRoles(res.data))
        .catch(() => toast.error(tFeedback("failed")))
        .finally(() => setLoadingRoles(false));
    }
  }, [enabled, roles.length, getScopeRoles, scope.name]);

  const handleToggleScope = async (val: boolean) => {
    // Optimistic update
    form.setValue(`scopes.${scope.name}.enabled`, val);

    try {
      await toggleScope(authUserId, scope.name);
    } catch (err: any) {
      // revert to the old value:
      form.setValue(`scopes.${scope.name}.enabled`, !val);
      toast.error(tFeedback("failed"));
    }
  };

  const handleToggleRole = async (roleId: number, val: boolean) => {
    const newRoleIds = val
      ? [...selectedRoleIds, roleId]
      : selectedRoleIds.filter((id: number) => id !== roleId);

    // Optimistic update
    form.setValue(`scopes.${scope.name}.roleIds`, newRoleIds);

    try {
      await toggleRole(authUserId, roleId, scope.name);
    } catch (err: any) {
      // revert to the old value:
      form.setValue(`scopes.${scope.name}.roleIds`, selectedRoleIds);
      toast.error(tFeedback("failed"));
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-card p-4 border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {SUITE_APP_ICONS[scope.name] && (
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${scope.metadata?.color}15` }}
            >
              <span aria-hidden="true" className="text-[20px] leading-none" style={{ color: scope.metadata?.color }}>
                {SUITE_APP_ICONS[scope.name]}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-sm font-semibold text-foreground">{scope.displayName}</h3>
            <p className="text-xs text-muted-foreground">{scope.description}</p>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleToggleScope}
        />
      </div>

      {enabled && (
        <div className="mt-2 ps-11">
          {loadingRoles ? (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="size-4" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {roles.map((role) => (
                <div key={role.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role.id}-${scope.id}`}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={(checked) => handleToggleRole(role.id, Boolean(checked))}
                    className="size-4"
                  />
                  <label
                    htmlFor={`role-${role.id}-${scope.id}`}
                    className="text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  >
                    {role.name}
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PermissionsStep() {
  const { onNext, onBack, isEdit, isLastStep, setCompletedSteps } = useEmployeeWizard();
  const t = useTranslations("createUpdateEmployee");
  const tFeedback = useTranslations("feedback");
  const reqWithToaster = useReqWithToaster();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("employee_id") as string;
  const api = useSoSApi();
  const { getScopes, getUserScopes } = api;

  const { data: employeeRes } = useGetEmployeeQuery(employeeId!, { skip: !employeeId });
  const authUserId = employeeRes?.data?.authUserId;

  const [availableScopes, setAvailableScopes] = useState<ISOSScope[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [updateOnboarding, { isLoading }] = useUpdateOnboardingStepMutation()

  const form = useForm<FormType>({
    resolver: zodResolver(permissionsSchema),
    defaultValues: {
      scopes: {},
    },
    mode: "onBlur",
  });

  const fetchUserPermissions = useCallback(async () => {
    if (!authUserId) return;
    try {
      const [allScopesRes, userScopesRes] = await Promise.all([
        getScopes(),
        getUserScopes(authUserId)
      ]);

      setAvailableScopes(allScopesRes.data);

      const scopesMap: Record<string, { enabled: boolean; roleIds: number[] }> = {};

      allScopesRes.data.forEach(s => {
        scopesMap[s.name] = { enabled: false, roleIds: [] };
      });

      userScopesRes.data.forEach(us => {
        scopesMap[us.name] = {
          enabled: true,
          roleIds: us.roles.map(r => r.id)
        };
      });

      form.reset({ scopes: scopesMap });
    } catch (err: any) {
      toast.error(tFeedback("failed"));
    } finally {
      setInitialLoading(false);
    }
  }, [authUserId, getScopes, getUserScopes, form]);

  useEffect(() => {
    if (authUserId) {
      fetchUserPermissions();
    }
  }, [authUserId, fetchUserPermissions]);

  const onSubmit = (values: FormType) => {
    reqWithToaster(t("toasts.updatingPermissions"), async () => {
      const onboardingPayload: IOnboardingStepDTO = {
        step: "permissions",
        data: null,
      };
      const res = await updateOnboarding({
        id: employeeId,
        body: onboardingPayload,
      }).unwrap();
      onNext(values);
    })
  };

  if (initialLoading) {
    return (
      <div className="space-y-4">
        <header className="space-y-1 pb-4">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </header>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-3 rounded-xl border border-border p-4 bg-card">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onFormErrorDisplay)} className="space-y-4">
        <header className="space-y-1 pb-4">
          <h2 className="text-lg font-medium leading-6 text-foreground">
            {t("steps.permissions.heading")}
          </h2>
          <p className="text-xs leading-4 text-muted-foreground">
            {t("steps.permissions.description")}
          </p>
        </header>

        <div className="space-y-3">
          {availableScopes.map((scope) => (
            <ScopeBlock
              key={scope.id}
              scope={scope}
              authUserId={authUserId!}
              api={api}
              form={form}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-end gap-3 border-t border-border pt-6 mt-8">
          <Button
            className="min-w-32"
            type="button"
            size="lg"
            variant="outline"
            onClick={onBack} disabled={isLoading}
          >
            {t("nav.back")}
          </Button>
          <Button type="submit" className="min-w-32" size="lg" disabled={isLoading}>
            {isLastStep
              ? isEdit
                ? t("nav.save")
                : t("nav.submit")
              : t("nav.next")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
