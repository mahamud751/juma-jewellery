"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { COLLECTIONS, HOUSE, getPiece, piecesIn } from "@/lib/catalog";

const SALONS = [
  { id: "sylhet", name: "The salon", note: "Sylhet Plaza, 4th floor" },
  { id: "video", name: "By video", note: "A private viewing from home" },
];

const TIMES = ["11:00", "13:00", "15:00", "17:00", "19:00"];

type Request = { salon: string; date: string; time: string; piece: string; name: string };

export function AppointmentForm() {
  const params = useSearchParams();
  const preset = getPiece(params.get("piece") ?? "")?.slug ?? "";
  const [salon, setSalon] = useState("sylhet");
  const [time, setTime] = useState(TIMES[1]);
  const [done, setDone] = useState<Request | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setDone({
      salon: SALONS.find((s) => s.id === salon)?.name ?? salon,
      date: String(data.get("date") ?? ""),
      time,
      piece: getPiece(String(data.get("piece") ?? ""))?.name ?? "No particular piece",
      name: String(data.get("name") ?? ""),
    });
  };

  if (done) {
    return (
      <div className="confirm">
        <p className="eyebrow">Request prepared</p>
        <h2 className="confirm-title">Thank you, {done.name.split(" ")[0] || "guest"}.</h2>
        <dl className="specs">
          <div>
            <dt>Salon</dt>
            <dd>{done.salon}</dd>
          </div>
          <div>
            <dt>When</dt>
            <dd>
              {done.date} · {done.time}
            </dd>
          </div>
          <div>
            <dt>Piece</dt>
            <dd>{done.piece}</dd>
          </div>
        </dl>
        <p className="confirm-note">
          This request stays on your screen. It has not been sent. To hold a time, visit {HOUSE.name} at {HOUSE.address}, or
          show this note at the counter.
        </p>
        <div className="confirm-actions">
          <button type="button" className="text-btn" onClick={() => setDone(null)}>
            Edit request
          </button>
          <Link href="/jewellery" className="text-btn">
            Continue browsing
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form className="appt" onSubmit={submit}>
      <fieldset>
        <legend>01 — Choose a salon</legend>
        <div className="salons">
          {SALONS.map((s) => (
            <label key={s.id} className={`salon ${salon === s.id ? "is-active" : ""}`}>
              <input type="radio" name="salon" value={s.id} checked={salon === s.id} onChange={() => setSalon(s.id)} />
              <span className="salon-name">{s.name}</span>
              <span className="salon-note">{s.note}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>02 — Choose a time</legend>
        <div className="row">
          <label className="field">
            <span>Date</span>
            <input type="date" name="date" required />
          </label>
          <div className="field">
            <span>Time</span>
            <div className="times">
              {TIMES.map((t) => (
                <button key={t} type="button" className={time === t ? "is-active" : ""} aria-pressed={time === t} onClick={() => setTime(t)}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
        <label className="field">
          <span>Piece of interest</span>
          <select name="piece" defaultValue={preset}>
            <option value="">No particular piece</option>
            {COLLECTIONS.map((c) => (
              <optgroup key={c.slug} label={c.name}>
                {piecesIn(c.slug).map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>03 — Your details</legend>
        <div className="row">
          <label className="field">
            <span>Full name</span>
            <input name="name" autoComplete="name" required />
          </label>
          <label className="field">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" required />
          </label>
        </div>
        <label className="field">
          <span>Anything we should prepare</span>
          <textarea name="note" rows={3} placeholder="Ring size, an occasion, a stone you have in mind…" />
        </label>
      </fieldset>

      <button type="submit" className="solid-btn">
        Request appointment
      </button>
    </form>
  );
}
