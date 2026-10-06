"use client";

// A password-protected share link. The library's PasswordInput brings the show/hide button with its
// name; Field ties the label and the error to the input, so "Incorrect password" is read with it;
// an empty submit says what's missing instead of doing nothing.
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, PasswordInput } from "@orgtik/ui";
import { CenteredState } from "@/components/public-share/PublicShareStatus";

interface PublicSharePasswordFormProps {
  error?: boolean;
  submitting?: boolean;
  onSubmit: (password: string) => void | Promise<void>;
}

export function PublicSharePasswordForm({ error = false, submitting = false, onSubmit }: PublicSharePasswordFormProps) {
  const t = useTranslations("PublicShare");
  const [password, setPassword] = useState("");
  const [empty, setEmpty] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = password.trim();
    if (!value) {
      setEmpty(true);
      return;
    }
    await onSubmit(value);
  };

  return (
    <CenteredState>
      <form onSubmit={handleSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4 rounded-card border border-line bg-raised p-6 text-start shadow-raised">
        <div className="flex flex-col gap-1">
          <h1 className="font-display text-title-sm text-fg">{t("passwordTitle")}</h1>
          <p className="text-body-sm text-fg-muted">{t("passwordDescription")}</p>
        </div>
        <Field label={t("passwordLabel")} error={empty ? t("passwordRequired") : error ? t("passwordInvalid") : undefined}>
          <PasswordInput
            autoFocus
            autoComplete="off"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setEmpty(false);
            }}
          />
        </Field>
        <Button type="submit" variant="primary" loading={submitting} className="w-full">
          {t("passwordSubmit")}
        </Button>
      </form>
    </CenteredState>
  );
}
