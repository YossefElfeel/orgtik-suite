import CustomerDetails from "@/components/pages/customers/CustomerDetails";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailsPage({ params }: Props) {
  const { id } = await params;

  return <CustomerDetails id={id} />;
}
