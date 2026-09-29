import type { Metadata } from "next";
import { Suspense } from "react";
import { AppointmentForm } from "@/components/site/appointment-form";
import { Reveal } from "@/components/site/reveal";
import { HOUSE, getPiece } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Book a visit",
  description: `Ask to see a piece at ${HOUSE.name}, ${HOUSE.address}.`,
};

export default function AppointmentPage() {
  const front = getPiece("night-frontage")!;
  return (
    <section className="appt-page">
      <div className="appt-intro">
        <Reveal as="p" className="eyebrow">
          A visit
        </Reveal>
        <Reveal as="h1" className="page-title" delay={0.1}>
          Come to
          <br />
          the counter.
        </Reveal>
        <Reveal as="p" className="page-lede" delay={0.2}>
          Tell us which piece you want brought out, and a time that suits you. The salon is {HOUSE.address}.
        </Reveal>
        <img className="appt-photo" src={front.card} alt={front.alt} />
      </div>
      <Suspense>
        <AppointmentForm />
      </Suspense>
    </section>
  );
}
