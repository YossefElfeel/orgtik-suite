'use client';
import { useParams } from 'next/navigation';
import { OwnerPayLink } from '@/components/console-links/OwnerPayLink';
export default function Page() { const { id } = useParams<{ id: string }>(); return <OwnerPayLink key={id} id={id} />; }
