import "../global.css";
import "katex/dist/katex.css";
import { Footer } from "@/components/geistdocs/footer";
import { DocsLayout } from "@/components/geistdocs/docs-layout";
import { Navbar } from "@/components/geistdocs/navbar";
import { GeistdocsProvider } from "@/components/geistdocs/provider";
import { basePath } from "@/geistdocs";
import { mono, sans } from "@/lib/geistdocs/fonts";
import { i18n } from "@/lib/geistdocs/i18n";
import { source } from "@/lib/geistdocs/source";
import { cn } from "@/lib/utils";

const Layout = ({ children }: LayoutProps<"/docs">) => (
  <html
    className={cn(sans.variable, mono.variable, "scroll-smooth antialiased")}
    lang={i18n.defaultLanguage}
    suppressHydrationWarning
  >
    <body>
      <GeistdocsProvider basePath={basePath}>
        <Navbar />
        <DocsLayout tree={source.pageTree[i18n.defaultLanguage]}>
          {children}
        </DocsLayout>
        <Footer />
      </GeistdocsProvider>
    </body>
  </html>
);

export default Layout;
