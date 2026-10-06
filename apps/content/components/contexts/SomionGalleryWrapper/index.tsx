"use client"
import { SomionGalleryProvider } from "@somion/gallery";
import { useAppSelector } from '@/redux/app/hooks';
import { API_URL } from '@/constants/env';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

function SomionGalleryWrapper({ children }: { children: React.ReactNode }) {
    const token = useAppSelector(state => state.auth.token) as string;

    return (
        <SomionGalleryProvider
            baseApi={`${API_URL}/galleries`}
            token={token}
            components={{
                Button: Button as any,
                Dialog: {
                    Root: Dialog,
                    Trigger: DialogTrigger,
                    Content: DialogContent,
                    Title: DialogTitle,
                    Description: DialogDescription,
                    Close: DialogClose,
                },
                DropdownMenu: {
                    Root: DropdownMenu,
                    Trigger: DropdownMenuTrigger,
                    Content: DropdownMenuContent,
                    Item: DropdownMenuItem,
                }
            }}
        >
            {children}
        </SomionGalleryProvider>
    );
}

export default SomionGalleryWrapper;