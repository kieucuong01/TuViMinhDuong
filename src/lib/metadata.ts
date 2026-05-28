import type { Metadata } from "next";
import { APP_NAME } from "@/lib/env";
import { absoluteUrl } from "@/lib/seo";

type RouteMetadataInput = {
  title: string;
  description: string;
  path: `/${string}`;
  imageTitle?: string;
  imageSubtitle?: string;
  robots?: Metadata["robots"];
};

export function routeMetadata({
  title,
  description,
  path,
  imageTitle = title,
  imageSubtitle = description,
  robots,
}: RouteMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const image = `/api/og?title=${encodeURIComponent(imageTitle)}&subtitle=${encodeURIComponent(imageSubtitle)}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    robots,
    openGraph: {
      title,
      description,
      url,
      siteName: APP_NAME,
      images: [image],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}
