"use client";

import { useState } from "react";
import { PACKAGES } from "@/lib/packages";
import { SITE } from "@/lib/site";

// One inquiry form for both pages. "elopement" is the light bridal style, "music" is the After dark style.
// Posts to FormSubmit, which must be activated once for SITE.email before mail is delivered.
type Kind = "elopement" | "music";

const COPY = {
  elopement: {
    id: "date",
    script: "Let's make your film",
    heading: "Tell us your date.",
    sub: "Free 20 minute call. We reply within 24 hours, usually faster.",
    nameLabel: "Your names",
    namePlaceholder: "Luciano & Muriel",
    dateLabel: "Wedding date (if you have one)",
    messagePlaceholder: "A few sentences is plenty. Where you're thinking, how many people, anything you want us to know.",
    button: "Check my date",
    subject: "New elopement inquiry",
  },
  music: {
    id: "contact",
    script: "Start your project",
    heading: "Tell us about the song.",
    sub: "Send a link and a few lines. We reply within 24 hours, usually faster.",
    nameLabel: "Artist or band name",
    namePlaceholder: "Your name",
    dateLabel: "Target release date (if you have one)",
    messagePlaceholder: "A few sentences is plenty. The vibe, the song, any locations or ideas you already have.",
    button: "Send it over",
    subject: "New music video inquiry",
  },
} as const;

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

function track(event: string, label: string) {
  if (typeof window === "undefined") return;
  const g = (window as GtagWindow).gtag;
  if (g) g("event", event, { event_category: "engagement", event_label: label, value: 1 });
}

export default function Contact({ kind }: { kind: Kind }) {
  const c = COPY[kind];
  const dark = kind === "music";
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
    package: "Not sure yet",
    songLink: "",
    message: "",
    honey: "",
  });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  function onChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.honey) return; // bots fill the hidden field
    setStatus("sending");
    try {
      const res = await fetch(`https://formsubmit.co/ajax/${SITE.email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Name: form.name,
          Email: form.email,
          Phone: form.phone,
          ...(kind === "elopement"
            ? { "Wedding Date": form.date, Package: form.package }
            : { "Release Date": form.date, "Song Link": form.songLink }),
          Message: form.message,
          _subject: `${c.subject} from ${form.name}`,
          _template: "table",
        }),
      });
      if (!res.ok) throw new Error("bad response");
      track("generate_lead", kind);
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  // If FormSubmit is down, this lets the visitor send the same details from their own email app.
  const mailLines: string[] = [`Name: ${form.name}`, `Email: ${form.email}`];
  if (form.phone) mailLines.push(`Phone: ${form.phone}`);
  if (form.date) mailLines.push(`${kind === "elopement" ? "Wedding date" : "Release date"}: ${form.date}`);
  if (kind === "elopement") mailLines.push(`Package: ${form.package}`);
  else if (form.songLink) mailLines.push(`Song: ${form.songLink}`);
  mailLines.push("", form.message);
  const mailBody = mailLines.join("\n");
  const mailHref = `mailto:${SITE.email}?subject=${encodeURIComponent(`${c.subject} from ${form.name}`)}&body=${encodeURIComponent(mailBody)}`;

  const text = dark ? "text-night-text" : "text-ink";
  const muted = dark ? "text-night-muted" : "text-muted";
  const accent = dark ? "text-night-gold" : "text-gilt";
  const field = dark
    ? "border-night-gold/30 bg-night text-night-text placeholder:text-night-muted/60 focus:border-night-gold"
    : "border-gilt/30 bg-white text-ink placeholder:text-muted/60 focus:border-gilt";
  const input = `h-12 w-full rounded-lg border px-4 font-sans text-base outline-none transition-colors ${field}`;
  const label = `mb-2 block font-sans text-[11px] font-semibold uppercase tracking-[0.2em] ${accent}`;
  const submit = dark
    ? "bg-night-gold text-night hover:bg-[#F0C25C]"
    : "bg-ink text-ivory hover:bg-gilt-hover";

  return (
    <section
      id={c.id}
      className={`scroll-mt-24 px-4 py-16 md:px-16 md:py-[112px] ${dark ? "bg-[#1A140E]" : "bg-champagne"}`}
    >
      <div className="mx-auto max-w-[1312px]">
        <div className="mb-10 flex flex-col items-center gap-3 text-center md:mb-14">
          <span className={`${dark ? "font-script-dark" : "font-script"} text-[44px] leading-[1.1] md:text-[56px] ${accent}`}>
            {c.script}
          </span>
          <h2 className={`font-display text-5xl font-normal leading-none tracking-[-0.01em] md:text-[72px] ${text}`}>
            {c.heading}
          </h2>
          <p className={`max-w-[560px] font-sans text-[17px] leading-[1.6] md:text-lg ${muted}`}>{c.sub}</p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.5fr] lg:gap-16">
          <div className="flex flex-col gap-7">
            <div>
              <p className={label}>Call or text</p>
              <a
                href={SITE.phoneTel}
                onClick={() => track("phone_click", `${kind}_contact`)}
                className={`font-display text-[34px] leading-none transition-colors md:text-[44px] ${text} ${dark ? "hover:text-night-gold" : "hover:text-gilt"}`}
              >
                {SITE.phoneDisplay}
              </a>
              <p className={`mt-2 font-sans text-sm ${muted}`}>Texts get the fastest reply.</p>
            </div>
            <div>
              <p className={label}>Email</p>
              <a href={`mailto:${SITE.email}`} className={`break-all font-sans text-base ${text} hover:underline`}>
                {SITE.email}
              </a>
            </div>
            <div>
              <p className={label}>Prefer to talk it through?</p>
              <a
                href={SITE.booking}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("book_consultation_click", "google_calendar")}
                className={`font-sans text-base font-semibold ${accent} underline-offset-4 hover:underline`}
              >
                Book a free 20 minute call →
              </a>
              <p className={`mt-1 font-sans text-sm ${muted}`}>Mon to Fri, 10 AM to 6 PM Pacific.</p>
            </div>
            <div>
              <p className={label}>Based in</p>
              <p className={`font-sans text-base ${text}`}>Las Vegas, NV</p>
            </div>
          </div>

          {status === "sent" ? (
            <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border p-10 text-center ${dark ? "border-night-gold/30" : "border-gilt/30 bg-white"}`} role="status">
              <h3 className={`font-display text-4xl ${text}`}>Thank you.</h3>
              <p className={`font-sans text-lg ${muted}`}>
                We got your note and will be in touch within 24 hours.
              </p>
              <p className={`font-sans text-sm ${muted}`}>
                Need to talk now? Call or text{" "}
                <a href={SITE.phoneTel} className={`font-semibold ${accent}`}>{SITE.phoneDisplay}</a>.
              </p>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className={`rounded-xl border p-6 md:p-10 ${dark ? "border-night-gold/30" : "border-gilt/30 bg-white"}`}
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={label} htmlFor={`${kind}-name`}>{c.nameLabel}</label>
                  <input id={`${kind}-name`} name="name" type="text" required autoComplete="name" value={form.name} onChange={onChange} placeholder={c.namePlaceholder} className={input} />
                </div>
                <div>
                  <label className={label} htmlFor={`${kind}-email`}>Email</label>
                  <input id={`${kind}-email`} name="email" type="email" required autoComplete="email" value={form.email} onChange={onChange} className={input} />
                </div>
                <div>
                  <label className={label} htmlFor={`${kind}-phone`}>Phone (optional)</label>
                  <input id={`${kind}-phone`} name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={onChange} className={input} />
                </div>
                <div>
                  <label className={label} htmlFor={`${kind}-date`}>{c.dateLabel}</label>
                  <input id={`${kind}-date`} name="date" type="date" value={form.date} onChange={onChange} className={`${input} ${dark ? "[color-scheme:dark]" : ""}`} />
                </div>
              </div>

              {kind === "elopement" ? (
                <div className="mt-5">
                  <label className={label} htmlFor="elopement-package">Package</label>
                  <select id="elopement-package" name="package" value={form.package} onChange={onChange} className={input}>
                    <option>Not sure yet</option>
                    {PACKAGES.map((p) => (
                      <option key={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="mt-5">
                  <label className={label} htmlFor="music-song">Link to the song (optional)</label>
                  <input id="music-song" name="songLink" type="url" inputMode="url" value={form.songLink} onChange={onChange} placeholder="Spotify, SoundCloud, YouTube" className={input} />
                </div>
              )}

              <div className="mt-5">
                <label className={label} htmlFor={`${kind}-message`}>Message</label>
                <textarea id={`${kind}-message`} name="message" rows={5} required value={form.message} onChange={onChange} placeholder={c.messagePlaceholder} className={`${input} h-auto resize-none py-3`} />
              </div>

              {/* Honeypot, hidden from people */}
              <input type="text" name="honey" value={form.honey} onChange={onChange} tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 opacity-0" />

              <button
                type="submit"
                disabled={status === "sending"}
                className={`mt-6 inline-flex h-14 w-full items-center justify-center rounded-full font-sans text-base font-semibold transition-colors disabled:opacity-60 ${submit}`}
              >
                {status === "sending" ? "Sending..." : c.button}
              </button>
              {status === "error" && (
                <div className="mt-4 flex flex-col items-center gap-2 text-center font-sans text-sm" role="alert">
                  <p className="text-red-600">Sorry, that didn&apos;t go through.</p>
                  <a href={mailHref} className={`font-semibold underline underline-offset-4 ${accent}`}>
                    Send it from your email app instead
                  </a>
                  <p className={muted}>
                    Or call or text <a href={SITE.phoneTel} className={`font-semibold ${accent}`}>{SITE.phoneDisplay}</a>.
                  </p>
                </div>
              )}
              <p className={`mt-4 text-center font-sans text-xs ${muted}`}>
                No spam. We use your info to answer your inquiry only.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
