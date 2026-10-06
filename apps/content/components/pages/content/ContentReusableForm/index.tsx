"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useEffect, useMemo, useState } from "react";
import { Loader, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import TextFormEle from "@/components/ui/form/text-form-element";
import { motion } from "framer-motion";
import { WEBSITE_LANGUAGES } from "@/constants";
import { handleReqWithToaster } from "@/lib/handle-req-with-toaster";
import {
  useGetSectionContentQuery,
  useUpdateSectionContentMutation,
} from "@/redux/features/seo/seoApi";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { localizeSchema } from "@/schemas/localized-content.schema";
import { GalleryInput, type IGalleryItem } from "@somion/gallery";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TextEditor from "@/components/shared/TextEditor";
import Image from "next/image";

// Helper to generate schema for object properties
const generateObjectSchema = (properties: any, required?: string[]) => {
  const schemaFields: Record<string, any> = {};

  Object.entries(properties).forEach(([key, property]: [string, any]) => {
    if (property.type === "object" && property.properties) {
      // Check if it's a localized field (has x-i18n flag or language properties)
      const isI18nField =
        property["x-i18n"] === true ||
        WEBSITE_LANGUAGES.some((lang) => property.properties[lang.code]);

      if (isI18nField) {
        schemaFields[key] = localizeSchema;
      } else {
        // Handle nested object types
        schemaFields[key] = generateObjectSchema(
          property.properties,
          property.required,
        );
      }
    } else if (property.type === "array" && property.items) {
      // Generate schema for array items
      if (property.items.type === "object" && property.items.properties) {
        schemaFields[key] = z.array(
          generateObjectSchema(
            property.items.properties,
            property.items.required,
          ),
        );
      } else {
        schemaFields[key] = z.array(z.any());
      }
    } else if (property.type === "string") {
      let stringSchema = z.string();
      if (required?.includes(key)) {
        stringSchema = stringSchema.min(1, `${key} is required`);
      }
      schemaFields[key] = stringSchema;
    } else if (property.type === "number") {
      let numberSchema = z.number();
      if (required?.includes(key)) {
        numberSchema = numberSchema.min(1, `${key} is required`);
      }
      schemaFields[key] = numberSchema;
    }
  });

  return z.object(schemaFields);
};

// Dynamic schema generator based on section type schema
const generateFormSchema = (sectionSchema: any, isArrayBased?: boolean) => {
  // Handle array-based schemas (root type is array)
  if (isArrayBased || sectionSchema?.type === "array") {
    if (!sectionSchema?.items || !sectionSchema.items.properties) {
      return z.object({ rootArray: z.array(z.any()) });
    }

    // Generate schema for array items
    const itemSchema = generateObjectSchema(
      sectionSchema.items.properties,
      sectionSchema.items.required,
    );
    // Wrap in object with rootArray key for react-hook-form compatibility
    return z.object({ rootArray: z.array(itemSchema) });
  }

  // Handle object-based schemas (root type is object)
  if (!sectionSchema || !sectionSchema.properties) {
    return z.object({});
  }

  return generateObjectSchema(sectionSchema.properties, sectionSchema.required);
};

// Default schema to prevent 'never' type
const defaultSchema = z.object({
  _placeholder: z.string().optional(),
});

function ContentReusableForm() {
  const t = useTranslations("ContentPage");
  const commonT = useTranslations("SubServicesPage");
  const params = useParams();
  const sectionId = Number(params.sectionId);

  const { data: sectionContent, isLoading } =
    useGetSectionContentQuery(sectionId);
  const [updateSectionContent, { isLoading: isUpdateLoading }] =
    useUpdateSectionContentMutation();

  const isArrayBased = sectionContent?.data?.sectionType?.isArrayBased || false;
  const formSchema = sectionContent?.data?.sectionType?.schema
    ? generateFormSchema(sectionContent.data.sectionType.schema, isArrayBased)
    : defaultSchema;

  type FormValues = z.infer<typeof formSchema>;
  type FormField = any;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: (isArrayBased ? { rootArray: [] } : {}) as FormValues,
  });

  // Track active tab per i18n field
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>({});

  // Helper to find and switch to tab with error for a given field path
  const switchToErrorTab = (fieldPath: string, errors: any) => {
    if (!errors) return;

    // Navigate through error object to find the error
    const pathParts = fieldPath.split(".");
    let currentErrors = errors;

    for (const part of pathParts) {
      if (currentErrors && currentErrors[part]) {
        currentErrors = currentErrors[part];
      } else {
        return;
      }
    }

    // If we found errors, check which language has the error
    if (currentErrors && typeof currentErrors === "object") {
      for (const lang of WEBSITE_LANGUAGES) {
        if (currentErrors[lang.code]) {
          setActiveTabs((prev) => ({
            ...prev,
            [fieldPath]: lang.code,
          }));
          break;
        }
      }
    }
  };

  // Helper to check if field has x-i18n
  const isI18nField = (property: any): boolean => {
    return (
      property["x-i18n"] === true ||
      (property.type === "object" &&
        property.properties &&
        WEBSITE_LANGUAGES.some((lang) => property.properties[lang.code]))
    );
  };

  // Collect all array field paths from the schema
  const arrayFieldPaths = useMemo(() => {
    const paths: string[] = [];
    const schema = sectionContent?.data?.sectionType?.schema;
    const isArrayBasedSchema = isArrayBased || schema?.type === "array";

    const collectArrayPaths = (properties: any, basePath = "") => {
      if (!properties) return;

      Object.entries(properties).forEach(([key, property]: [string, any]) => {
        const currentPath = basePath ? `${basePath}.${key}` : key;

        if (property.type === "array" && property.items) {
          paths.push(currentPath);

          // Check for nested arrays in array items
          if (property.items.properties) {
            collectArrayPaths(property.items.properties, currentPath);
          }
        } else if (property.type === "object" && property.properties) {
          collectArrayPaths(property.properties, currentPath);
        }
      });
    };

    // Handle array-based schema (root is array)
    if (
      isArrayBasedSchema &&
      schema &&
      schema.items &&
      schema.items.properties
    ) {
      // The root array itself doesn't have a path, it's the entire form
      // But we still need to track nested arrays within items
      collectArrayPaths(schema.items.properties, "");
    } else if (schema?.properties) {
      // Handle object-based schema (root is object)
      collectArrayPaths(schema.properties);
    }

    return paths;
  }, [sectionContent?.data?.sectionType?.schema, isArrayBased]);

  // Create field arrays - we'll use a different approach
  const fieldArrayInstances = useMemo(() => {
    const instances: Record<string, any> = {};

    // We can't call useFieldArray here, so we'll handle it differently
    return instances;
  }, []);

  // Helper function to get or create field array
  const getFieldArray = (path: string) => {
    if (!fieldArrayInstances[path]) {
      // Create field array on demand
      try {
        fieldArrayInstances[path] = {
          fields: [],
          append: (value: any) => {
            const formValue = (form as any).getValues(path);
            const currentValues = Array.isArray(formValue) ? formValue : [];
            const newValues = [...currentValues, value];
            (form as any).setValue(path, newValues, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            // Trigger form re-render
            (form as any).trigger(path);
            // Update the fields array to trigger re-render
            fieldArrayInstances[path].fields = newValues.map(
              (value, index) => ({
                id: `${path}-${index}`,
                ...value,
              }),
            );
          },
          remove: (index: number) => {
            const currentValues =
              ((form as any).getValues(path) as any[]) || [];
            const newValues = currentValues.filter((_, i) => i !== index);
            (form as any).setValue(path, newValues, {
              shouldDirty: true,
              shouldTouch: true,
              shouldValidate: true,
            });
            // Trigger form re-render
            (form as any).trigger(path);
            // Update the fields array to trigger re-render
            fieldArrayInstances[path].fields = newValues.map(
              (value, index) => ({
                id: `${path}-${index}`,
                ...value,
              }),
            );
          },
        };
      } catch (error) {
        console.warn(`Failed to create field array for ${path}:`, error);
        return null;
      }
    }

    // Always update fields with current form values to ensure sync
    // @ts-ignore
    const currentValues = ((form as any).watch(path) as any[]) || [];
    fieldArrayInstances[path].fields = currentValues.map((value, index) => ({
      id: `${path}-${index}`,
      ...value,
    }));

    return fieldArrayInstances[path];
  };

  // Set form values when content is loaded
  useEffect(() => {
    if (sectionContent?.data?.content) {
      const content = sectionContent.data.content;

      // Handle array-based content (content is directly an array)
      if (isArrayBased && Array.isArray(content)) {
        (form as any).setValue("rootArray", content);
      } else if (typeof content === "object" && content !== null) {
        // Handle object-based content
        Object.keys(content).forEach((key) => {
          if (key !== "_placeholder") {
            (form as any).setValue(key, content[key as keyof typeof content]);
          }
        });
      }
    }
  }, [sectionContent, form, isArrayBased]);

  const onSubmit = async (values: FormValues) => {
    let submitContent: any;

    // Handle array-based schemas
    if (isArrayBased) {
      const rootArray = (values as any).rootArray || [];
      // Extract actual data from fields (remove id properties)
      submitContent = Array.isArray(rootArray)
        ? rootArray.map((item: any) => {
            if (item && typeof item === "object") {
              const { id, ...itemData } = item;
              return itemData;
            }
            return item;
          })
        : [];
    } else {
      // Handle object-based schemas
      const { _placeholder, ...submitValues } = values as any;

      // Filter array field paths to only include parent arrays (not nested ones)
      const parentArrayPaths = arrayFieldPaths.filter((path) => {
        // Check if this path is a child of another array path
        return !arrayFieldPaths.some(
          (otherPath) => otherPath !== path && path.startsWith(otherPath + "."),
        );
      });

      // Manually collect only parent array field values and add them to submitValues
      parentArrayPaths.forEach((path) => {
        const fieldArray = getFieldArray(path);
        if (fieldArray && fieldArray.fields) {
          // Extract the actual data from the fields (remove the id property we added)
          const arrayData = fieldArray.fields.map((field: any) => {
            const { id, ...fieldData } = field;
            return fieldData;
          });

          // Set the array data in submitValues
          submitValues[path] = arrayData;
        } else {
          // Fallback: try to get from form values directly
          const formValue = (form as any).getValues(path);
          if (formValue) submitValues[path] = formValue;
        }
      });

      submitContent = submitValues;
    }

    console.log(submitContent);

    handleReqWithToaster(t("saving"), async () => {
      updateSectionContent({
        sectionId,
        body: {
          content: submitContent,
        },
      }).unwrap();
    });
  };

  // Handle form submission errors - switch to tabs with errors
  const onError = (errors: any) => {
    // Recursively find all error paths and switch to tabs with errors
    const findErrorPaths = (obj: any, basePath = ""): void => {
      if (!obj || typeof obj !== "object") return;

      Object.entries(obj).forEach(([key, value]: [string, any]) => {
        const currentPath = basePath ? `${basePath}.${key}` : key;

        if (value && typeof value === "object") {
          // Check if this looks like an i18n field (has language codes as keys with errors)
          const hasLangKeys = WEBSITE_LANGUAGES.some(
            (lang) => value[lang.code] !== undefined,
          );

          if (hasLangKeys) {
            // This is an i18n field, switch to the tab with error
            switchToErrorTab(currentPath, errors);
          } else {
            // Continue recursively for nested objects
            findErrorPaths(value, currentPath);
          }
        }
      });
    };

    findErrorPaths(errors);
  };

  // Render i18n field with tabs
  const renderI18nField = (
    fieldPath: string,
    property: any,
    label?: string,
  ) => {
    const fieldLabel =
      label ||
      fieldPath
        .split(".")
        .pop()!
        .replace(/([A-Z])/g, " $1")
        .replace(/^./, (str) => str.toUpperCase());

    const tabKey = fieldPath;
    const activeTab = activeTabs[tabKey] || WEBSITE_LANGUAGES[0].code;
    const isTextarea = property.description?.includes("description");

    // Get available languages from schema properties, or use all WEBSITE_LANGUAGES
    const availableLangs = WEBSITE_LANGUAGES.filter(
      (lang) => property.properties?.[lang.code],
    );

    return (
      <div key={fieldPath} className="space-y-4">
        <h3 className="text-lg font-semibold capitalize">{fieldLabel}</h3>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTabs((prev) => ({ ...prev, [tabKey]: value }))
          }
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 gap-2">
            {availableLangs.map((lang) => (
              <TabsTrigger
                key={lang.code}
                value={lang.code}
                className="flex items-center justify-center gap-2 text-sm"
              >
                <Image
                  src={`/images/flags/${lang.code}.png`}
                  alt={lang.name}
                  width={20}
                  height={20}
                  className="rounded-sm"
                />
                <span>{lang.name}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {availableLangs.map((lang) => {
            const langProperty = property.properties?.[lang.code];
            const isRichText = langProperty?.type === "rich-text";
            const fieldName = `${fieldPath}.${lang.code}` as any;

            return (
              <TabsContent key={lang.code} value={lang.code}>
                {isRichText ? (
                  <TextEditor
                    defaultValue={(form as any).watch(fieldName) || ""}
                    onChange={(html) => {
                      (form as any).setValue(fieldName, html, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      });
                    }}
                    className="bg-gray-50 rounded-xl border border-gray-200"
                  />
                ) : (
                  <TextFormEle
                    form={form as any}
                    name={fieldName}
                    label=""
                    placeholder={`${fieldLabel} (${lang.name})...`}
                    type={isTextarea ? "textarea" : "text"}
                  />
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>
    );
  };

  // Render form fields based on schema
  const renderFormFields = () => {
    const schema = sectionContent?.data?.sectionType?.schema;

    // Handle array-based schema (root is array)
    if (isArrayBased && schema && schema.type === "array" && schema.items) {
      return renderArrayField("rootArray", schema);
    }

    // Handle object-based schema (root is object)
    if (!schema?.properties) {
      return null;
    }

    const { properties } = schema;

    // First pass: collect i18n fields and other fields separately
    const i18nFields: Array<[string, any]> = [];
    const otherFields: Array<[string, any]> = [];

    Object.entries(properties).forEach(([key, property]: [string, any]) => {
      if (
        property.type === "object" &&
        property.properties &&
        isI18nField(property)
      ) {
        i18nFields.push([key, property]);
      } else {
        otherFields.push([key, property]);
      }
    });

    // Render i18n fields in a grid if there are multiple, or full width if single and has rich-text
    const i18nFieldsElements = i18nFields.map(([key, property]) => {
      const hasRichText = WEBSITE_LANGUAGES.some(
        (lang) => property.properties?.[lang.code]?.type === "rich-text",
      );
      const element = renderI18nField(key, property);

      // If it has rich-text, make it full width (col-span-2)
      if (hasRichText) {
        return (
          <div key={key} className="col-span-2">
            {element}
          </div>
        );
      }
      return element;
    });

    // Render other fields
    const otherFieldsElements = otherFields.map(
      ([key, property]: [string, any]) => {
        if (property.type === "array" && property.items) {
          return renderArrayField(key, property);
        } else if (property.type === "object" && property.properties) {
          // Handle nested objects (like bottomSection)
          return (
            <div key={key} className="space-y-4">
              <h3 className="text-lg font-semibold capitalize">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </h3>
              <div className="pl-4 border-l-2 border-gray-200 space-y-4">
                {renderObjectFields(property, key)}
              </div>
            </div>
          );
        } else if (property.type === "string") {
          return (
            <TextFormEle
              key={key}
              form={form as any}
              name={key}
              label={key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
              placeholder={`Enter ${key}`}
            />
          );
        } else if (
          ["number", "string"].includes(property.type) &&
          ["imageId", "galleryId"].includes(key)
        ) {
          return (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium">
                {key
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </label>
              <GalleryInput
                label=""
                value={(form as any).watch(key)}
                onChange={(item: IGalleryItem | IGalleryItem[] | null) => {
                  (form as any).setValue(key, (item as IGalleryItem)?.id || "");
                }}
                placeholder="Select an image from gallery"
              />
            </div>
          );
        } else if (property.type === "number") {
          return (
            <TextFormEle
              key={key}
              form={form as any}
              name={key}
              label={key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
              placeholder={`Enter ${key}`}
              type="number"
            />
          );
        }

        return null;
      },
    );

    // Combine all fields: i18n fields in a grid (if multiple) followed by other fields
    const allFields = [];

    if (i18nFieldsElements.length > 0) {
      if (i18nFieldsElements.length > 1) {
        // Multiple i18n fields: render in a 2-column grid
        allFields.push(
          <div key="i18n-grid" className="grid grid-cols-2 gap-6">
            {i18nFieldsElements}
          </div>,
        );
      } else {
        // Single i18n field: render full width
        allFields.push(...i18nFieldsElements);
      }
    }

    // Add other fields
    allFields.push(...otherFieldsElements);

    return allFields;
  };

  // Render array field with add/remove functionality
  const renderArrayField = (fieldName: string, property: any) => {
    const fieldArray = getFieldArray(fieldName);

    if (!fieldArray) {
      console.warn(`Field array not found for ${fieldName}`);
      return null;
    }

    const addItem = () => {
      const defaultItem = createDefaultItemFromSchema(property.items);
      fieldArray.append(defaultItem);
    };

    const removeItem = (index: number) => {
      fieldArray.remove(index);
    };

    return (
      <div key={fieldName} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize">
            {fieldName
              .replace(/([A-Z])/g, " $1")
              .replace(/^./, (str) => str.toUpperCase())}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {commonT("add_feature")}
          </Button>
        </div>

        <div className="space-y-4">
          {fieldArray.fields.map((field: FormField, index: number) => (
            <Card key={index} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    {commonT("feature_label", { index: index + 1 })}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {renderObjectFields(property.items, `${fieldName}.${index}`)}
              </CardContent>
            </Card>
          ))}
        </div>

        {fieldArray.fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {commonT("no_features")}
          </div>
        )}
      </div>
    );
  };

  // Render nested array fields
  const renderNestedArrayField = (
    fieldPath: string,
    property: any,
    fieldName: string,
  ) => {
    const fieldArray = getFieldArray(fieldPath);

    if (!fieldArray) {
      console.warn(`Field array not found for ${fieldPath}`);
      return null;
    }

    const addNestedItem = () => {
      const defaultItem = createDefaultItemFromSchema(property.items);
      fieldArray.append(defaultItem);
    };

    const removeNestedItem = (index: number) => {
      fieldArray.remove(index);
    };

    return (
      <div key={fieldPath} className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium capitalize">
            {fieldName.replace(/([A-Z])/g, " $1")}
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addNestedItem}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="w-3 h-3" />
            Add
          </Button>
        </div>

        <div className="space-y-2">
          {fieldArray.fields.map((field: FormField, index: number) => (
            <div
              key={index}
              className="flex items-start gap-2 p-3 border rounded-lg"
            >
              <div className="flex-1 space-y-2">
                {renderObjectFields(property.items, `${fieldPath}.${index}`)}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeNestedItem(index)}
                className="text-red-500 hover:text-red-700 mt-1"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render object fields recursively
  const renderObjectFields = (objectSchema: any, basePath: string) => {
    if (!objectSchema.properties) return null;

    return Object.entries(objectSchema.properties).map(
      ([key, property]: [string, any]) => {
        const fieldPath = `${basePath}.${key}`;

        if (property.type === "array" && property.items) {
          return renderNestedArrayField(fieldPath, property, key);
        } else if (property.type === "object" && property.properties) {
          // Check if it's an i18n field
          if (isI18nField(property)) {
            // Render i18n field with tabs
            return renderI18nField(
              fieldPath,
              property,
              key.replace(/([A-Z])/g, " $1"),
            );
          } else {
            return (
              <div key={key} className="space-y-2">
                <label className="text-sm font-medium capitalize">
                  {key.replace(/([A-Z])/g, " $1")}
                </label>
                <div className="pl-4 border-l-2 border-gray-200 space-y-2">
                  {renderObjectFields(property, fieldPath)}
                </div>
              </div>
            );
          }
        } else if (
          property.type === "string" ||
          property.type === null
          // property.type === ["string", "null"]
        ) {
          return (
            <TextFormEle
              key={key}
              form={form as any}
              name={fieldPath}
              label={key.replace(/([A-Z])/g, " $1")}
              placeholder={`${key.replace(/([A-Z])/g, " $1")}...`}
            />
          );
        } else if (
          property.type === "number" &&
          ["imageId", "galleryId"].includes(key)
        ) {
          return (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium capitalize">
                {key.replace(/([A-Z])/g, " $1")}
              </label>
              <GalleryInput
                label=""
                value={(form as any).watch(fieldPath)}
                onChange={(item: IGalleryItem | IGalleryItem[] | null) => {
                  (form as any).setValue(
                    fieldPath,
                    (item as IGalleryItem)?.id || "",
                  );
                }}
                placeholder="Select an image from gallery"
              />
            </div>
          );
        } else if (property.type === "number") {
          return (
            <TextFormEle
              key={key}
              form={form as any}
              name={fieldPath}
              label={key.replace(/([A-Z])/g, " $1")}
              placeholder={`Enter ${key}`}
              type="number"
            />
          );
        }

        return null;
      },
    );
  };

  // Create default item from schema
  const createDefaultItemFromSchema = (itemSchema: any): any => {
    if (!itemSchema.properties) return {};

    const defaultItem: any = {};

    Object.entries(itemSchema.properties).forEach(
      ([key, property]: [string, any]) => {
        if (property.type === "string") {
          defaultItem[key] = "";
        } else if (property.type === "number") {
          defaultItem[key] = 0;
        } else if (property.type === "array") {
          defaultItem[key] = [];
        } else if (property.type === "object" && property.properties) {
          // Check if it's an i18n field
          if (isI18nField(property)) {
            defaultItem[key] = WEBSITE_LANGUAGES.reduce(
              (acc, lang) => {
                acc[lang.code] = "";
                return acc;
              },
              {} as Record<string, string>,
            );
          } else {
            defaultItem[key] = createDefaultItemFromSchema(property);
          }
          // } else if (property.type === ["string", "null"]) {
        } else {
          defaultItem[key] = null;
        }
      },
    );

    return defaultItem;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!sectionContent?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">{t("title")} not found</p>
      </div>
    );
  }

  const sectionType = sectionContent.data.sectionType;

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-3xl font-bold tracking-tight"
        >
          {sectionType.displayName}
        </motion.h1>
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-muted-foreground"
        >
          {sectionType.description}
        </motion.p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onError)}
          className="bg-white p-6 rounded-lg border border-gray-200 space-y-8"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 gap-8"
          >
            {renderFormFields()}
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex justify-end"
          >
            <Button
              type="submit"
              disabled={isUpdateLoading}
              className="min-w-[120px]"
            >
              {isUpdateLoading ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                t("save_changes")
              )}
            </Button>
          </motion.div>
        </form>
      </Form>
    </div>
  );
}

export default ContentReusableForm;
