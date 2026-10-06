// A client CMS's logo, or a neutral globe when it has none. Decorative: the name is next to it.
import { Globe } from "@phosphor-icons/react/dist/ssr";
import { ICMSInstance } from "@/types/CMS";

export function CmsLogo({ cms }: { cms: Pick<ICMSInstance, "logoUrl" | "name"> }) {
  return cms.logoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={cms.logoUrl} alt="" className="size-9 shrink-0 rounded-field border border-line bg-white object-contain p-1" />
  ) : (
    <span aria-hidden="true" className="grid size-9 shrink-0 place-items-center rounded-field bg-sunken text-fg-muted [&>svg]:size-5">
      <Globe />
    </span>
  );
}
