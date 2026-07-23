import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'MealTime Support',
  description:
    'Support for MealTime, the voice meal planning app by Echo Chamber Media. How to get help, plus fixes for the mic button, list sharing, and missing recipes.',
  alternates: { canonical: 'https://echochambermedia.com/mealtime/support' },
};

const faqs = [
  {
    q: 'The mic button does nothing',
    a: 'Open Settings on your iPhone, scroll to MealTime, and allow both Microphone and Speech Recognition. The app needs both to hear you.',
  },
  {
    q: "My partner's phone does not see my list",
    a: 'Both phones must be signed into iCloud, and both need the same household code. You can find your code in Settings inside the app.',
  },
  {
    q: 'A recipe disappeared',
    a: 'It did not. Every generated recipe is saved in the Recipe Box on the Week tab.',
  },
];

export default function MealTimeSupportPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white min-h-screen pt-32 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              MealTime Support
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-lg text-brand-gray leading-relaxed">
              MealTime is a small app by Echo Chamber Media for planning a week of dinners by voice and sharing one grocery list.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              How to get help
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Email{' '}
              <a href="mailto:sales@echochambermedia.com" className="text-brand-gold hover:underline">
                sales@echochambermedia.com
              </a>
              . Include what you tapped and what happened. We usually reply within a business day.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Common questions
            </h2>
            <div className="space-y-6">
              {faqs.map((f) => (
                <div key={f.q}>
                  <h3 className="font-heading text-lg uppercase tracking-editorial text-brand-off-white mb-2">
                    {f.q}
                  </h3>
                  <p className="font-body text-brand-gray leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>

            <p className="font-body text-brand-gray leading-relaxed mt-12">
              Looking for how we handle your data? Read the{' '}
              <Link href="/mealtime/privacy" className="text-brand-gold hover:underline">
                MealTime Privacy Policy
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
