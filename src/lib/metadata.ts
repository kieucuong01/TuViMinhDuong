import type { Metadata } from "next";
import { APP_NAME, APP_URL } from "@/lib/env";

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
  const url = `${APP_URL}${path === "/" ? "" : path}`;
  const image = `/api/og?title=${encodeURIComponent(imageTitle)}&subtitle=${encodeURIComponent(imageSubtitle)}`;

  return {
    title,
    description,
    alternates: { canonical: path },
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
