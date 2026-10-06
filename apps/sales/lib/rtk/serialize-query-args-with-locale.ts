import { getRequestLocale } from "@/lib/i18n/request-locale";

type SerializeQueryArgsParams = {
  endpointName: string;
  queryArgs: unknown;
};

export function serializeQueryArgsWithLocale({
  endpointName,
  queryArgs,
}: SerializeQueryArgsParams) {
  return `${endpointName}(${JSON.stringify(queryArgs)})@${getRequestLocale()}`;
}
