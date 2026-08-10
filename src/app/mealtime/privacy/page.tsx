import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/sections/Navbar';
import Footer from '@/sections/Footer';

export const metadata: Metadata = {
  title: 'MealTime Privacy Policy',
  description:
    'The privacy policy for MealTime, the voice meal planning app by Echo Chamber Media. What data the app uses, where it lives, and how to delete it.',
  alternates: { canonical: 'https://echochambermedia.com/mealtime/privacy' },
};

export default function MealTimePrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="bg-brand-black text-brand-off-white min-h-screen pt-32 pb-20 px-6">
        <article className="max-w-3xl mx-auto">
          <div className="mb-12">
            <h1 className="font-heading text-4xl lg:text-5xl uppercase tracking-editorial text-brand-off-white mb-6 leading-tight">
              MealTime Privacy Policy
            </h1>
            <div className="h-px w-16 bg-brand-gold mb-6" />
            <p className="font-body text-sm text-brand-gray">Effective date: August 10, 2026</p>
          </div>

          <div className="space-y-6">
            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What MealTime does
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              You speak dinner ideas, and the app builds a weekly dinner plan and a grocery list. That is the whole product, and this policy covers everything it touches.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Voice
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Your speech is turned into text by Apple&apos;s built-in speech recognition. That happens on your iPhone when your device supports it, and on Apple&apos;s servers when it does not. That choice is made by iOS, not by MealTime. Apple&apos;s handling of it is covered by Apple&apos;s own privacy policy. MealTime itself never records, saves, or transmits your audio, and Echo Chamber Media never receives it.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What leaves your phone
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The text transcript of what you said, plus your budget, taste notes, and saved meal history, is sent to Anthropic&apos;s Claude API to generate your plan. It passes through a relay we operate, which exists only so the API key stays off your phone. The relay forwards the request and the reply and keeps no copy of either. Anthropic processes the request to return the plan. You can read Anthropic&apos;s privacy policy at{' '}
              <a
                href="https://www.anthropic.com/legal/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-gold hover:underline"
              >
                anthropic.com/legal/privacy
              </a>
              .
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Where your data lives
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Meal plans, grocery lists, favorites, and ratings are stored in Apple iCloud (CloudKit), tied to your household code, and cached on your device. Echo Chamber Media runs no database of its own. The only thing we operate is the relay described above, which stores nothing, so your saved meal data is never held on our systems.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Your household code
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The household code works like a house key. Anyone who has your code can see and edit your household&apos;s meal data, so only share it with your household.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What we do not do
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              No ads, no trackers, no analytics, no selling of data, no accounts, and no collection of names or emails.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Deleting your data
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Delete recipes in the app from the Recipe Box, or delete the app and your device cache goes with it. Starting a new household in Settings disconnects your phone from the old shared data. To have the old household data removed from iCloud entirely, email us at sales@echochambermedia.com with your household code and we will delete it.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Contact
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Questions about this policy? Email{' '}
              <a href="mailto:sales@echochambermedia.com" className="text-brand-gold hover:underline">
                sales@echochambermedia.com
              </a>
              . For help using the app, see{' '}
              <Link href="/mealtime/support" className="text-brand-gold hover:underline">
                MealTime Support
              </Link>
              .
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Changes
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              We will update this page if the app&apos;s data handling changes.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}
