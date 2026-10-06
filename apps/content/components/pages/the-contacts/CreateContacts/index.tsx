"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "sonner";
import { useCreateContactMutation } from "@/redux/features/contacts/contactsApi";
import { ReusableDialog } from "@/components/shared/ReusableDialog/reusable-dialog";
import TextFormEle from "@/components/ui/form/text-form-element";
import { Form } from "@/components/ui/form";
import { useGetServicesListQuery } from "@/redux/features/services/servicesApi";
import SelectFormEle from "@/components/ui/form/select-form-element";

//  Validation Schema
const contactSchema = z.object({
  firstName: z.string().min(2, "First Name is required"),
  lastName: z.string().min(2, "Last Name is required"),
  email: z.string().email("Invalid email"),
  phoneNumber: z
    .string()
    .min(8, "Phone number must be at least 8 digits")
    .max(15, "Phone number too long"),
  // subject: z.string().min(2, "Subject is required"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  companyName: z.string().min(2, "Company Name is required"),
  serviceId: z.string(),
  subServiceId: z.string(),
  // message: z.string(),
});

type ContactFormValues = z.infer<typeof contactSchema>;

export default function CreateContacts({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [createContact, { isLoading }] = useCreateContactMutation();

  const { data } = useGetServicesListQuery();

  console.log("serv", data);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      // subject: "",
      message: "",
      companyName: "",
      serviceId: "",
      subServiceId: "",
    },
  });

  const ServicesLis = data?.data.map((serve) => ({
    value: Number(serve.id),
    label: `${serve.name}`,
  }));

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const res = await createContact(values).unwrap();
      toast.success(res.message || "Contact created successfully!");
      form.reset();
      setOpen(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to create contact");
    }
  };

  return (
    <ReusableDialog
      trigger={children}
      open={open}
      onOpenChange={setOpen}
      title="Create New Contact"
      //   description="Fill in the details below to add a new contact"
      onSuccess={form.handleSubmit(onSubmit)}
      onCancel={() => setOpen(false)}
      onSuccessText="Create"
      onCancelText="Cancel"
      size="xl"
      isLoading={isLoading}
    >
      <Form {...form}>
        <form className="space-y-4">
          <TextFormEle
            form={form}
            name="firstName"
            label="first Name"
            placeholder="Enter customer name"
          />
          <TextFormEle
            form={form}
            name="lastName"
            label="Last Name"
            placeholder="Enter customer name"
          />
          <TextFormEle
            form={form}
            name="companyName"
            label="Company Name"
            placeholder="Enter customer name"
          />
          <TextFormEle
            form={form}
            name="email"
            label="Email"
            placeholder="Enter email address"
          />
          <TextFormEle
            form={form}
            name="phoneNumber"
            label="Phone Number"
            placeholder="Enter phone number"
          />
          {/* <TextFormEle
            form={form}
            name="subject"
            label="Subject"
            placeholder="Enter subject"
          /> */}
          <TextFormEle
            form={form}
            name="message"
            label="Message"
            type="textarea"
            placeholder="Enter message"
          />
          {/* <SelectFormEle
            form={form}
            name="serviceId"
            label="Message"
            type="textarea"
            placeholder="Enter message"
            options={ServicesLis}
          /> */}
        </form>
      </Form>
    </ReusableDialog>
  );
}
