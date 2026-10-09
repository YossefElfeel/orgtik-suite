import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, Card, Input, Toolbar, PageHeader, Skeleton, tokens, type Density } from "@orgtik/ui";
const meta: Meta = { title: "Foundations/V2", parameters: { layout: "padded" } };
export default meta;

function Foundations() {
  const [query, setQuery] = useState("");
  const [density, setDensity] = useState<Density>("comfortable");
  return <div data-density={density} className="flex flex-col gap-6">
    <PageHeader title="OrgTik DS v2" description="Graphite surfaces, plum actions, Plex UI, compact controls and layered depth." meta={<span>Comfortable 44px · Compact 36px</span>} />
    <Toolbar label="Example list controls" search={{ value: query, onChange: setQuery, label: "Search records" }} density={density} onDensityChange={setDensity} actions={<Button size="sm">New record</Button>} />
    <div className="grid gap-4 sm:grid-cols-3">
      {(["raised", "sunken", "overlay"] as const).map(surface => <Card key={surface} className={`bg-${surface} shadow-sm`} padding="md"><h2 className="font-display text-title-sm">{surface}</h2><p className="text-body text-fg-muted">A neutral layer with brand reserved for actions.</p></Card>)}
    </div>
    <div className="flex flex-wrap items-center gap-3"><Button size="xs">28</Button><Button size="sm">32</Button><Button>36</Button><Button size="lg">40</Button><Button variant="secondary" shape="control">Toolbar action</Button><Input aria-label="Sample field" placeholder="Plex UI text" /><Skeleton className="h-8 w-40" /></div>
    <div className="flex flex-wrap gap-3">{Object.entries(tokens.color.graphite).map(([step,color]) => <div key={step} className="flex flex-col gap-2"><span className="size-12 rounded-field border border-line" style={{background:color}} /><code className="text-caption text-fg-subtle">{step}</code></div>)}</div>
  </div>;
}
export const FoundationsV2: StoryObj = { render: () => <Foundations /> };
