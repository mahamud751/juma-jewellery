import { Cursor } from "@/components/cursor";
import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import "./site.css";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="site">
      <div className="grain" aria-hidden="true" />
      <SiteHeader />
      <main className="site-main">{children}</main>
      <SiteFooter />
      <Cursor label="" />
    </div>
  );
}
