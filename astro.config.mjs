import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Every canonical URL, sitemap entry, hreflang link and JSON-LD @id derives from
// this. Override with SITE_URL when the practice's own domain goes live.
const SITE_URL = process.env.SITE_URL ?? 'https://shengchangmd.bahtzang.com';

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
      filter: (page) => {
        const url = new URL(page);
        const pathname = url.pathname;

        for (const locale of LOCALE_KEYS) {
          if (locale === 'en') {
            if (pathname === '/' || pathname.startsWith('/404')) {
              return true;
            }
          } else {
            if (pathname.startsWith(`/${locale}/`)) {
              return true;
            }
          }
        }
        return false;
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
