import {
  DocsBody as FumadocsDocsBody,
  DocsDescription as FumadocsDocsDescription,
  DocsPage as FumadocsDocsPage,
  DocsTitle as FumadocsDocsTitle,
} from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { i18n } from "@/lib/geistdocs/i18n";
import { getPageImage, source } from "@/lib/geistdocs/source";

type PageProps = ComponentProps<typeof FumadocsDocsPage>;

export const DocsPage = ({ ...props }: PageProps) => (
  <FumadocsDocsPage {...props} />
);

export const DocsTitle = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsTitle>) => (
  <FumadocsDocsTitle
    className={cn("mb-4 text-4xl tracking-tight", className)}
    {...props}
  />
);

export const DocsDescription = (
  props: ComponentProps<typeof FumadocsDocsDescription>
) => <FumadocsDocsDescription {...props} />;

export const DocsBody = ({
  className,
  ...props
}: ComponentProps<typeof FumadocsDocsBody>) => (
  <FumadocsDocsBody className={cn("mx-auto w-full", className)} {...props} />
);

export const generateStaticPageParams = () =>
  source
    .generateParams("slug", "lang")
    .filter(({ lang }) => lang === i18n.defaultLanguage)
    .map(({ slug }) => ({ slug }));

export const generatePageMetadata = (slug: string[] = []): Metadata => {
  const page = source.getPage(slug, i18n.defaultLanguage);

  if (!page) {
    notFound();
  }

  return {
    title: page.data.title,
    description: page.data.description,
    openGraph: {
      images: getPageImage(page).url,
    },
  };
};
