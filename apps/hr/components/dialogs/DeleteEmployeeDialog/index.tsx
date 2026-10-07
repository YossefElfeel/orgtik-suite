"use client";

import { EmployeeOffboardingSheet } from '@/components/sheets/EmployeeOffboardingSheet';
import type { EmployeeOffboardingSheetProps } from '@/types/offboarding';

/** Keeps existing employee action callers while replacing deletion with workspace offboarding. */
export const DeleteEmployeeDialog = (props: EmployeeOffboardingSheetProps) => <EmployeeOffboardingSheet {...props} />;
