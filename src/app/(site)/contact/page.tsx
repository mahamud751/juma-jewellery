import type { Metadata } from "next";
import { ContactForm } from "@/components/site/contact-form";
import { Reveal } from "@/components/site/reveal";
import { HOUSE, getPiece } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Contact",
  description: `Visit ${HOUSE.name} at ${HOUSE.address}.`,
};

export default function ContactPage() {
  const front = getPiece("night-frontage")!;

  return (
    <section className="appt-page">
      <div className="appt-intro">
        <Reveal as="p" className="eyebrow">
          Contact
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          The counter
          <br />
          is open.
        </Reveal>
        <Reveal as="p" className="page-lede" delay={0.2}>
          {HOUSE.name}, {HOUSE.address}. Come upstairs, or leave a note here and bring it with you.
        </Reveal>
        <dl className="specs contact-facts">
          <div>
            <dt>Address</dt>
            <dd>{HOUSE.address}</dd>
          </div>
          <div>
            <dt>How to find it</dt>
            <dd>Sylhet Plaza, fourth floor, at the end of the jewellers&apos; corridor.</dd>
          </div>
          <div>
            <dt>A visit</dt>
            <dd>Ask at the counter. A piece is brought out, and the gold is quoted there.</dd>
          </div>
        </dl>
        <img className="appt-photo" src={front.card} alt={front.alt} />
      </div>
      <ContactForm />
    </section>
  );
}
