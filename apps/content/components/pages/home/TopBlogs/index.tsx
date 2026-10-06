import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";

interface DataBlogsProps {
  id: number;
  title: string;
  views: number;
  img: string;
}

interface TopBlogsProps {
  topBlogs: {
    id: number;
    title: string;
    views: number;
    featureImage: {
      id: number;
      url: string;
      alt: string;
    };
  }[];
}

export default function TopBlogs({ topBlogs }: TopBlogsProps) {
  const t = useTranslations("HomePage");

  return (
    <Card className="h-full w-full border border-gray-200 bg-white rounded-xl shadow-sm p-4">
      <CardHeader className="pb-3 border-b border-gray-200">
        <CardTitle className="text-xl font-semibold">
          {t("top_blogs")}
        </CardTitle>
        <CardDescription className="text-secondary">
          {t("top_blog_views")}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2 space-y-4">
        {topBlogs.map((blog) => (
          <div
            key={blog.id}
            className="flex items-center gap-5 border border-gray-100 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <span className="text-[20px] font-medium  w-8 text-center">
              #{blog.id}
            </span>

            <div className="flex items-center gap-4">
              <div className="rounded-lg">
                <Image
                  src={blog?.featureImage.url}
                  alt={blog?.title}
                  width={200}
                  height={200}
                  className="rounded-lg"
                />
              </div>

              <div className="flex flex-col justify-center">
                <p className="text-sm md:text-[20px] font-medium  leading-snug">
                  {blog.title}
                </p>
                <span className="text-sm text-secondary mt-1">
                  {blog.views.toLocaleString()} {t("views")}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
