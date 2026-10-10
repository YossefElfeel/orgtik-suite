import {Card,Skeleton,cn} from '@orgtik/ui';
import type {InfoCardSkeletonProps} from '@/types/display';
export function InfoCardSkeleton({itemCount=6,className,gridClassName,children}:InfoCardSkeletonProps){return <Card className={cn('flex w-full flex-col gap-4',className)}><Skeleton className='h-6 w-40'/><div className={cn('grid gap-4 md:grid-cols-2',gridClassName)}>{Array.from({length:itemCount},(_,i)=><div key={i} className='flex items-center gap-3'><Skeleton className='h-4 w-28'/><Skeleton className='h-4 flex-1'/></div>)}</div>{children}</Card>;}
