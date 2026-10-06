import type React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageView } from "../image-view";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    image: {
      setImage: (options: {
        src: string;
        alt?: string;
        title?: string;
        width?: string | number;
        height?: string | number;
        align?: "left" | "center" | "right";
      }) => ReturnType;
      updateImage: (options: {
        src?: string;
        alt?: string;
        title?: string;
        width?: string | number;
        height?: string | number;
        align?: "left" | "center" | "right";
      }) => ReturnType;
    };
  }
}

export const CustomImage = Node.create({
  name: "image",

  addOptions() {
    return {
      inline: false,
      allowBase64: false,
      HTMLAttributes: {},
    };
  },

  inline() {
    return this.options.inline;
  },

  group: "block",

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
      },
      alt: {
        default: null,
        parseHTML: (element) => element.getAttribute("alt"),
      },
      title: {
        default: null,
        parseHTML: (element) => element.getAttribute("title"),
      },
      width: {
        default: null,
        parseHTML: (element) =>
          element.style.width || element.getAttribute("width"),
        renderHTML: (attributes) => {
          if (attributes.width) {
            return { width: attributes.width };
          }
          return {};
        },
      },
      height: {
        default: null,
        parseHTML: (element) =>
          element.style.height || element.getAttribute("height"),
        renderHTML: (attributes) => {
          if (attributes.height) {
            return { height: attributes.height };
          }
          return {};
        },
      },
      align: {
        default: "left", // Default alignment
        parseHTML: (element) => element.getAttribute("data-align") || "left",
        renderHTML: (attributes) => {
          if (attributes.align) {
            return { "data-align": attributes.align };
          }
          return {};
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "img[src]",
        getAttrs: (element) => {
          if (typeof element === "string") return {};
          const src = element.getAttribute("src");
          const alt = element.getAttribute("alt");
          const title = element.getAttribute("title");
          const width = element.style.width || element.getAttribute("width");
          const height = element.style.height || element.getAttribute("height");
          const align = element.getAttribute("data-align");
          return { src, alt, title, width, height, align };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const { align, ...rest } = HTMLAttributes;
    const style: React.CSSProperties = {};
    if (rest.width) style.width = rest.width;
    if (rest.height) style.height = rest.height;

    return [
      "img",
      mergeAttributes(this.options.HTMLAttributes, rest, {
        style: Object.keys(style).length > 0 ? style : undefined,
        "data-align": align,
      }),
    ];
  },

  addCommands() {
    return {
      setImage:
        (options) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
      updateImage:
        (options) =>
        ({ commands }) => {
          return commands.updateAttributes(this.name, options);
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageView as any);
  },
});
