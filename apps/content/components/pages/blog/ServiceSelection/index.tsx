import React from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { useFormContext } from 'react-hook-form'
import { useGetServicesListQuery } from '@/redux/features/services/servicesApi'
type Props = {}

function ServiceSelection() {
    // Services
    const form = useFormContext();
    const { data: servicesData } = useGetServicesListQuery();
    const services = servicesData?.data || [];
    if (services.length === 0) return <div>No services found</div>;
    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg">Service</CardTitle>
            </CardHeader>
            <CardContent>

                <Select
                    value={form.watch("serviceId") || undefined}
                    onValueChange={(value) => {
                        form.setValue("serviceId", value, {
                            shouldValidate: true,
                        });
                    }}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                    <SelectContent>
                        {services.map((service) => (
                            <SelectItem
                                key={service.id}
                                value={String(service.id)}
                            >
                                {service.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {form.formState.errors.serviceId && (
                    <p className="text-sm text-red-500 mt-1">
                        {form.formState.errors.serviceId?.message as string}
                    </p>
                )}
            </CardContent>
        </Card>
    )
}

export default ServiceSelection