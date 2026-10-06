"use client";

import ContactDetails from "@/components/pages/the-contacts/ContactDetails";
import { useParams } from "next/navigation";

export default function ContactDetailsPage() {
  const { contactsId } = useParams();

  return <ContactDetails id={Number(contactsId)} />;
}
