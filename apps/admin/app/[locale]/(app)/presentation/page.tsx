import { notFound } from "next/navigation";
import { Operations } from "@/components/presentation/Operations";
export default function PresentationPage() { if (process.env.NODE_ENV !== "development" && process.env.NEXT_PUBLIC_DEMO_PANEL !== "1") notFound(); return <Operations />; }
