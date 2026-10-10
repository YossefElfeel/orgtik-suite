'use client';
import {PencilSimple,UserCircle} from '@phosphor-icons/react';
import {Card,CardHeader,Button,cn} from '@orgtik/ui';
import {useTranslations} from 'next-intl';
import type {InfoCardProps} from '@/types/display';
export type {InfoCardItem} from '@/types/display';
export {InfoCardSkeleton} from '@/components/shared/EmployeeFactsSkeleton';
export function InfoCard({title,icon:Icon=UserCircle,onEdit,items,children,className,gridClassName}:InfoCardProps){const t=useTranslations('actions');return <Card className={cn('flex w-full flex-col gap-4',className)}><CardHeader title={<span className='flex items-center gap-2'><Icon className='size-5' aria-hidden='true'/>{title}</span>} actions={onEdit?<Button size='sm' variant='ghost' aria-label={t('edit')} startIcon={<PencilSimple/>} onClick={onEdit}>{t('edit')}</Button>:undefined}/>{items?.length?<dl className={cn('grid gap-4 md:grid-cols-2',gridClassName)}>{items.map(item=><div key={item.id} className='flex min-w-0 items-start gap-3'>{item.icon?<item.icon className='mt-0.5 size-4 shrink-0 text-fg-muted' aria-hidden='true'/>:null}<dt className='w-32 shrink-0 text-body-sm text-fg-muted'>{item.label}</dt><dd className='min-w-0 flex-1 break-words text-body-sm'>{item.userContent&&item.value!=null&&!['-','—','--'].includes(String(item.value))?<bdi>{item.value}</bdi>:item.value}</dd></div>)}</dl>:null}{children}</Card>;}
