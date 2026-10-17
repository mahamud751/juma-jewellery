"use client";

import { useState, type FormEvent } from "react";
import { HOUSE } from "@/lib/catalog";

type Note = { name: string; phone: string; message: string };

export function ContactForm() {
  const [done, setDone] = useState<Note | null>(null);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setDone({
      name: String(data.get("name") ?? ""),
      phone: String(data.get("phone") ?? ""),
      message: String(data.get("message") ?? ""),
    });
  };

  if (done) {
    return (
      <div className="confirm">
        <p className="eyebrow">Note kept on this screen</p>
        <h2 className="confirm-title">Thank you, {done.name.split(" ")[0] || "guest"}.</h2>
        <p className="confirm-note">
          This message has not been sent. To reach {HOUSE.name}, visit the counter at {HOUSE.address} and ask for the piece you have in mind.
        </p>
        <button type="button" className="text-btn" onClick={() => setDone(null)}>
          Write another note
        </button>
      </div>
    );
  }

  return (
    <form className="appt" onSubmit={submit}>
      <fieldset>
        <legend>Write to the salon</legend>
        <div className="row">
          <label className="field">
            <span>Full name</span>
            <input name="name" autoComplete="name" required />
          </label>
          <label className="field">
            <span>Phone</span>
            <input name="phone" type="tel" autoComplete="tel" required />
          </label>
        </div>
        <label className="field">
          <span>Message</span>
          <textarea name="message" rows={5} required placeholder="A piece, a size, a time you hope to visit…" />
        </label>
      </fieldset>
      <button type="submit" className="solid-btn">
        Keep this note
      </button>
    </form>
  );
}
