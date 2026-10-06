"use client";

import React from "react";
import { PageHeader } from "@orgtik/ui";

type Props = {
  title?: string;
  description?: string;
  children?: React.ReactNode;
  status?: React.ReactNode;
};

/** A page's title and its actions: the library's PageHeader (the old one slid in from the left, in RTL too). */
function MainTitles({ title, description, children, status }: Props) {
  return <PageHeader title={title ?? ""} description={description} status={status} actions={children} />;
}

export default MainTitles;
