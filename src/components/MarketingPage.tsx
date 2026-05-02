import { ReactNode } from "react";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";
import SEO from "./SEO";

type Props = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro?: string;
  children: ReactNode;
};

const MarketingPage = ({ title, metaTitle, metaDescription, intro, children }: Props) => (
  <div className="min-h-screen bg-background">
    <SEO title={metaTitle} description={metaDescription} />
    <AppHeader />
    <main className="container max-w-3xl py-12 md:py-16">
      <h1 className="font-display text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
      {intro && <p className="mt-4 text-lg text-muted-foreground">{intro}</p>}
      <article className="prose prose-slate mt-8 max-w-none [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mt-6 [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_p]:leading-relaxed [&_p]:text-muted-foreground [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-muted-foreground [&_li]:mt-1 [&_a]:text-primary [&_a]:underline">
        {children}
      </article>
    </main>
    <AppFooter />
  </div>
);

export default MarketingPage;