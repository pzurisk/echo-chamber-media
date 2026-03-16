"use client";

import { useState } from "react";
import SectionWrapper from "@/components/SectionWrapper";
import Heading from "@/components/Heading";
import Button from "@/components/Button";

const projectTypes = ["Wedding", "Corporate", "Walk-through", "Documentary", "Other"];

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", projectType: "", message: "" });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Form submitted:", form);
  }

  const inputBase =
    "w-full bg-brand-black border border-brand-charcoal px-4 py-3 text-brand-off-white font-body text-sm placeholder:text-brand-gray focus:outline-none focus:border-brand-gold transition-colors duration-300";

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
        <Button type="submit" variant="dark" className="w-full mt-2">Send Inquiry</Button>
      </form>

      <div className="mt-12 flex items-center justify-center gap-8">
        <a href="https://instagram.com/echochambermedia" target="_blank" rel="noopener noreferrer" className="text-brand-gray hover:text-brand-gold transition-colors duration-300 font-body text-sm uppercase tracking-editorial">Instagram</a>
        <span className="text-brand-charcoal">|</span>
        <a href="mailto:hello@echochambermedia.com" className="text-brand-gray hover:text-brand-gold transition-colors duration-300 font-body text-sm uppercase tracking-editorial">Email</a>
      </div>
    </SectionWrapper>
  );
}
