"use client";

import TimeOffPage from "../../time-off/page";
import { useColumns } from "./columns";

type Props = {};

function Page({}: Props) {
  const columns = useColumns();
  return <TimeOffPage showeHeader={false} columns={columns} />;
}

export default Page;
