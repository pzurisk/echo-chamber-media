"use client";

import { useState } from "react";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";
import Button from "@/components/Button";

const projectTypes = ["Wedding", "Corporate", "Walk-through", "Documentary", "Other"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", projectType: "", message: "" });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    try {
      await fetch("https://formsubmit.co/ajax/5050divevideo@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          "Project Type": form.projectType,
          message: form.message,
          _subject: `New Inquiry from ${form.name} — ${form.projectType}`,
          _template: "table",
        }),
      });
      setSubmitted(true);
    } catch {
      alert("Something went wrong. Please email us directly at 5050divevideo@gmail.com");
    } finally {
      setSending(false);
    }
  }

  const inputBase =
    "w-full bg-brand-black border border-brand-charcoal px-4 py-3 text-brand-off-white font-body text-sm placeholder:text-brand-gray focus:outline-none focus:border-brand-gold transition-colors duration-300";

  if (submitted) {
    return (
      <SectionWrapper id="contact">
        <div className="max-w-2xl mx-auto text-center py-16">
          <Heading as="h2" gold>Thank you.</Heading>
          <p className="mt-6 text-brand-gray font-body text-lg">
            We received your inquiry and will be in touch soon.
          </p>
        </div>
      </SectionWrapper>
    );
  }

  return (
    <SectionWrapper id="contact">
      <div className="max-w-2xl mx-auto text-center">
        <Heading as="h2">Let&apos;s make something unforgettable.</Heading>
        <p className="mt-4 text-brand-gray font-body text-lg">Based in Las Vegas. Available worldwide.</p>
        <div className="mt-4 h-px w-16 bg-brand-gold mx-auto" />
      </div>

      <form onSubmit={handleSubmit} className="mt-14 max-w-xl mx-auto flex flex-col gap-5">
        <input type="text" name="name" placeholder="Name" required value={form.name} onChange={handleChange} className={inputBase} />
        <input type="email" name="email" placeholder="Email" required value={form.email} onChange={handleChange} className={inputBase} />
        <select name="projectType" required value={form.projectType} onChange={handleChange} className={`${inputBase} ${!form.projectType ? "text-brand-gray" : ""} appearance-none`}>
          <option value="" disabled>Project Type</option>
          {projectTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
        </select>
        <textarea name="message" placeholder="Tell us about your project..." rows={5} required value={form.message} onChange={handleChange} className={`${inputBase} resize-none`} />
        <Button type="submit" variant="dark" className="w-full mt-2">
          {sending ? "Sending..." : "Send Inquiry"}
        </Button>
      </form>

      <div className="mt-12 flex items-center justify-center gap-8">
        <a href="https://instagram.com/echochambermedia" target="_blank" rel="noopener noreferrer" className="text-brand-gray hover:text-brand-gold transition-colors duration-300 font-body text-sm uppercase tracking-editorial">Instagram</a>
        <span className="text-brand-charcoal">|</span>
        <a href="mailto:5050divevideo@gmail.com" className="text-brand-gray hover:text-brand-gold transition-colors duration-300 font-body text-sm uppercase tracking-editorial">Email</a>
      </div>
    </SectionWrapper>
  );
}
