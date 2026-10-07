import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Combobox, Field, MoneyField, MultiSelect, NumberField, PercentField, useFormatter } from "@orgtik/ui";
import { useCopy } from "./copy";

const meta: Meta = { title: "P1b/Pickers and numbers", parameters: { layout: "padded" } };
export default meta;

const PEOPLE = [
  { value: "mona", label: "Mona Adel", hint: "mona@acme.example" },
  { value: "karim", label: "Karim Hassan", hint: "karim@acme.example" },
  { value: "hoda", label: "Hoda Samir", hint: "hoda@acme.example" },
  { value: "dina", label: "Dina Fawzy", hint: "dina@acme.example" },
  { value: "salma", label: "سلمى يوسف", hint: "salma@acme.example" },
];

const COPY = {
  en: { owner: "Owner", ownerPh: "Search people", share: "Share with", sharePh: "Add people", seats: "Seats", seatsHelp: "Between 1 and 250.", price: "Monthly price", priceKwd: "Monthly price (KWD)", discount: "Discount", value: "Value" },
  ar: { owner: "المالك", ownerPh: "ابحث عن الأشخاص", share: "مشاركة مع", sharePh: "أضف أشخاصًا", seats: "المقاعد", seatsHelp: "من 1 إلى 250.", price: "السعر الشهري", priceKwd: "السعر الشهري (د.ك)", discount: "الخصم", value: "القيمة" },
};

function All() {
  const s = useCopy(COPY);
  const f = useFormatter();
  const [seats, setSeats] = useState<number | null>(12);
  const [price, setPrice] = useState<number | null>(1290.5);
  return (
    <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
      <Field label={s.owner}><Combobox options={PEOPLE} placeholder={s.ownerPh} defaultValue="karim" /></Field>
      <Field label={s.share}><MultiSelect options={PEOPLE} placeholder={s.sharePh} defaultValue={["mona", "salma"]} /></Field>
      <Field label={s.seats} description={s.seatsHelp}><NumberField value={seats} onValueChange={setSeats} min={1} max={250} /></Field>
      <Field label={s.discount}><PercentField defaultValue={12} /></Field>
      <Field label={s.price} description={`${s.value}: ${price === null ? "—" : f.money(price, "CHF")}`}><MoneyField currency="CHF" value={price} onValueChange={setPrice} /></Field>
      <Field label={s.priceKwd}><MoneyField currency="KWD" defaultValue={12.125} /></Field>
    </div>
  );
}

export const PickersAndNumbers: StoryObj = { render: () => <All /> };
