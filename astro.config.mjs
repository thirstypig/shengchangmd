import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { locales } from './src/i18n/locales';

// Every canonical URL, sitemap entry, hreflang link and JSON-LD @id derives from
// this. The default moved to the apex on 2026-08-05 with the domain migration;
// it previously named shengchangmd.bahtzang.com, which now 404s, so any build
// without SITE_URL set was stamping a dead host onto every canonical URL.
const SITE_URL = process.env.SITE_URL ?? 'https://shengchangmd.com';

const LOCALES = {
  en: 'en-US',
  'zh-hant': 'zh-Hant',
  'zh-hans': 'zh-Hans',
};

const LOCALE_KEYS = Object.keys(LOCALES);

export default defineConfig({
  output: 'static',
  site: SITE_URL,
  server: {
    port: 3120,
  },
  vite: {
    plugins: [tailwindcss()],
  },
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: 'en',
        locales: LOCALES,
      },
      /*
        This filter was inverted. The `en` branch returned true only for `/`
        and `/404`, so every English subpage — about, services, location,
        insurance, contact, hours, new-patients — fell through to `return
        false` and was left out of the sitemap entirely. Meanwhile every
        zh-hant and zh-hans page was included, despite all of them rendering
        `noindex` because their locale is unreviewed. The sitemap was therefore
        advertising exactly the pages that must not be indexed and hiding the
        ones that should be.

        Listing a noindex URL in a sitemap is not harmless: it asks a crawler to
        fetch a page and then tells it not to index it, which Search Console
        reports back as an error against the property.

        `reviewed` is read from src/i18n/locales.ts rather than restated here,
        so flipping a locale to reviewed puts it in the sitemap automatically
        and the two cannot drift.
      */
      filter: (page) => {
        const pathname = new URL(page).pathname;

        if (pathname.startsWith('/404')) return false;
        if (pathname.startsWith('/family-photos-2026')) return false;

        const segment = pathname.split('/')[1];
        const locale = LOCALE_KEYS.includes(segment) ? segment : 'en';

        return locales[locale]?.reviewed === true;
      },
    }),
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-hant', 'zh-hans'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
});
