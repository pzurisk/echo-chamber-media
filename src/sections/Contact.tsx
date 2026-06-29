"use client";

import { useState } from "react";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";
import Button from "@/components/Button";

const projectTypes = [
  "Wedding (Video)",
  "Wedding (Photo)",
  "Wedding (Both)",
  "Corporate / Commercial",
  "Music Video",
  "Documentary",
  "Real Estate / Walk-through",
  "360° Walkthrough",
  "Other",
];

const budgetRanges = [
  "Under $2,500",
  "$2,500 – $5,000",
  "$5,000 – $10,000",
  "$10,000 – $25,000",
  "$25,000+",
  "Not sure yet",
];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    projectDate: "",
    projectType: "",
    budget: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("https://formsubmit.co/ajax/Echochambermediasales@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Name: form.name,
          Email: form.email,
          Phone: form.phone,
          "Project Date": form.projectDate,
          "Project Type": form.projectType,
          Budget: form.budget,
          Message: form.message,
          _subject: `New Inquiry from ${form.name}, ${form.projectType}`,
          _template: "table",
        }),
      });

      // Fire GA4 conversion event if gtag is loaded
      if (typeof window !== "undefined" && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "generate_lead", {
          event_category: "engagement",
          event_label: form.projectType,
          value: 1,
        });
      }

      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please call us at (989) 308-1633 or email Echochambermediasales@gmail.com");
    } finally {
      setSending(false);
    }
  }

  const inputBase =
    "w-full bg-brand-black border border-brand-charcoal px-4 py-3 text-brand-off-white font-body text-sm placeholder:text-brand-gray focus:outline-none focus:border-brand-gold transition-colors duration-300";

  const labelBase =
    "block text-[10px] uppercase tracking-[0.2em] text-brand-gold font-body font-semibold mb-2";

  if (submitted) {
    return (
      <SectionWrapper id="contact">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Heading as="h2" gold>Thank you.</Heading>
          <p className="mt-6 text-brand-off-white font-body text-lg">
            We received your inquiry and will be in touch within 24 hours.
          </p>
          <p className="mt-3 text-brand-gray font-body text-sm">
            Need to talk now? Call us at{" "}
            <a href="tel:+19893081633" className="text-brand-gold font-semibold">
              (989) 308-1633
            </a>{" "}, 24/7 booking line.
          </p>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="contact">
      <div className="text-center mb-12">
        <span className="font-body text-xs font-semibold tracking-[0.25em] uppercase text-brand-gold block mb-3">
          Get in Touch
        </span>
        <Heading as="h2">Tell Us About Your Project</Heading>
        <p className="mt-4 text-brand-gray font-body text-base max-w-xl mx-auto">
          Quotes are free. We reply within 24 hours, usually faster. Time-sensitive shoot? Mention it and we&apos;ll prioritize.
        </p>
        <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16 items-start">
        {/* ── Contact Info Column ── */}
        <div className="space-y-6">
          {/* Google Calendar appointment scheduling, primary booking CTA */}
          <div className="bg-brand-gold/5 border border-brand-gold/30 p-5">
            <p className={labelBase}>Book a Free Consultation</p>
            <p className="text-brand-off-white font-body text-sm mb-4">
              20-minute call to scope your project. Pick a time that works for you.
            </p>
            <a
              href="https://calendar.app.google/V6EFC7Cv3rJHxAdGA"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                if (typeof window !== "undefined" && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
                  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "book_consultation_click", {
                    event_category: "engagement",
                    event_label: "google_calendar",
                    value: 1,
                  });
                }
              }}
              className="inline-block w-full text-center bg-brand-gold text-brand-black font-body font-semibold text-sm uppercase tracking-[0.15em] px-6 py-3 hover:bg-brand-gold-hover transition-all duration-300"
            >
              Pick a Time →
            </a>
          </div>

          <div className="border-t border-brand-charcoal pt-5">
            <p className={labelBase}>Call or Text, 24/7 AI Booking Line</p>
            <a
              href="tel:+19893081633"
              onClick={() => {
                if (typeof window !== "undefined" && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
                  (window as unknown as { gtag: (...args: unknown[]) => void }).gtag("event", "phone_click", {
                    event_category: "engagement",
                    event_label: "contact_section",
                    value: 1,
                  });
                }
              }}
              className="font-heading text-2xl md:text-3xl text-brand-off-white hover:text-brand-gold transition-colors"
            >
              (989) 308-1633
            </a>
            <p className="mt-2 text-xs text-brand-gray font-body">
              Our AI assistant answers immediately, qualifies your project, and books your consult.
            </p>
          </div>

          <div className="border-t border-brand-charcoal pt-5">
            <p className={labelBase}>Email</p>
            <a
              href="mailto:Echochambermediasales@gmail.com"
              className="text-brand-off-white hover:text-brand-gold transition-colors font-body text-sm break-all"
            >
              Echochambermediasales@gmail.com
            </a>
          </div>

          <div className="border-t border-brand-charcoal pt-5">
            <p className={labelBase}>Based In</p>
            <p className="text-brand-off-white font-body text-sm">Las Vegas, NV</p>
            <p className="text-brand-gray font-body text-xs mt-1">Available worldwide</p>
          </div>

          <div className="border-t border-brand-charcoal pt-5">
            <p className={labelBase}>Response Time</p>
            <p className="text-brand-off-white font-body text-sm">Within 24 hours, Mon–Fri</p>
          </div>

          <div className="flex gap-5 pt-2">
            <a
              href="https://instagram.com/chunkdude"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gray hover:text-brand-gold transition-colors duration-300 font-body text-xs uppercase tracking-editorial"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@billyzurisk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gray hover:text-brand-gold transition-colors duration-300 font-body text-xs uppercase tracking-editorial"
            >
              TikTok
            </a>
          </div>
        </div>

        {/* ── Form Column ── */}
        <form
          onSubmit={handleSubmit}
          className="bg-brand-charcoal/40 border border-brand-charcoal p-6 md:p-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className={labelBase} htmlFor="name">Your Name</label>
              <input id="name" type="text" name="name" required value={form.name} onChange={handleChange} className={inputBase} />
            </div>
            <div>
              <label className={labelBase} htmlFor="email">Email</label>
              <input id="email" type="email" name="email" required value={form.email} onChange={handleChange} className={inputBase} />
            </div>
            <div>
              <label className={labelBase} htmlFor="phone">Phone</label>
              <input id="phone" type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputBase} />
            </div>
            <div>
              <label className={labelBase} htmlFor="projectDate">Project Date (if known)</label>
              <input id="projectDate" type="date" name="projectDate" value={form.projectDate} onChange={handleChange} className={inputBase} />
            </div>
          </div>

          <div className="mt-5">
            <label className={labelBase} htmlFor="projectType">Project Type</label>
            <select
              id="projectType"
              name="projectType"
              required
              value={form.projectType}
              onChange={handleChange}
              className={`${inputBase} ${!form.projectType ? "text-brand-gray" : ""} appearance-none`}
            >
              <option value="" disabled>Select one…</option>
              {projectTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className={labelBase} htmlFor="budget">Approximate Budget</label>
            <select
              id="budget"
              name="budget"
              value={form.budget}
              onChange={handleChange}
              className={`${inputBase} ${!form.budget ? "text-brand-gray" : ""} appearance-none`}
            >
              <option value="">Skip if unsure</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className={labelBase} htmlFor="message">Tell Us About the Project</label>
            <textarea
              id="message"
              name="message"
              rows={5}
              required
              value={form.message}
              onChange={handleChange}
              placeholder="A few sentences is plenty. Date, location, what you're hoping for."
              className={`${inputBase} resize-none`}
            />
          </div>

          <Button type="submit" variant="dark" className="w-full mt-6">
            {sending ? "Sending..." : "Send Inquiry"}
          </Button>
          <p className="text-[11px] text-brand-gray font-body text-center mt-4">
            No spam. We use your info to respond to your inquiry only.
          </p>
        </form>
      </div>
    </SectionWrapper>
  );
}
