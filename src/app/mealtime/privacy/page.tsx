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
            <p className="font-body text-sm text-brand-gray">Effective date: July 23, 2026</p>
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
              Your speech is transcribed on your device by Apple&apos;s speech recognition. MealTime does not record or store audio.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              What leaves your phone
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              The text transcript of what you said, plus your budget, taste notes, and saved meal history, is sent to Anthropic&apos;s Claude API to generate your plan. Anthropic processes it to return the plan. You can read Anthropic&apos;s privacy policy at{' '}
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
              Meal plans, grocery lists, favorites, and ratings are stored in Apple iCloud (CloudKit), tied to your household code, and cached on your device. We (Echo Chamber Media) do not run our own servers and cannot see your data.
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
              Delete recipes in the app from the Recipe Box, or delete the app and your device cache goes with it. Starting a new household in Settings disconnects your phone from the old shared data. To have the old household data removed from iCloud entirely, email us at Echochambermediasales@gmail.com with your household code and we will delete it.
            </p>

            <h2 className="font-heading text-2xl uppercase tracking-editorial text-brand-gold mt-12 mb-4">
              Contact
            </h2>
            <p className="font-body text-brand-off-white leading-relaxed">
              Questions about this policy? Email{' '}
              <a href="mailto:Echochambermediasales@gmail.com" className="text-brand-gold hover:underline">
                Echochambermediasales@gmail.com
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
