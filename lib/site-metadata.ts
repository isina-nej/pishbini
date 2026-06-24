import type { Metadata } from "next";
import { getAppUrl } from "@/lib/utils";

export const SITE_NAME = "پیش‌بینی پیشرو سرمایه";
export const SITE_TITLE = "پیش‌بینی جام جهانی | پیشرو سرمایه";
export const SITE_DESCRIPTION =
  "در کمپین پیش‌بینی جام جهانی پیشرو سرمایه شرکت کن؛ بازی‌ها را پیش‌بینی کن، امتیاز جمع کن و در جدول برندگان بدرخش.";

export const OG_IMAGE_PATH = "/og/og-image.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export function getMetadataBase(): URL {
  return new URL(getAppUrl());
}

export function getOgImageUrl(): string {
  return new URL(OG_IMAGE_PATH, getMetadataBase()).toString();
}

type PageMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
};

export function createPageMetadata(input: PageMetadataInput = {}): Metadata {
  const title = input.title ?? SITE_TITLE;
  const description = input.description ?? SITE_DESCRIPTION;
  const canonicalPath = input.path ?? "/";
  const url = new URL(canonicalPath, getMetadataBase()).toString();
  const imageUrl = getOgImageUrl();

  return {
    title,
    description,
    metadataBase: getMetadataBase(),
    alternates: {
      canonical: canonicalPath,
    },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "fa_IR",
      url,
      siteName: SITE_NAME,
      title,
      description,
      images: [
        {
          url: imageUrl,
          secureUrl: imageUrl,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: title,
          type: "image/png",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export const rootMetadata: Metadata = {
  ...createPageMetadata(),
  applicationName: "پیش‌بینی پیشرو",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "پیش‌بینی",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};
