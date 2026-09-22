import { getTranslation } from '@/i18n/locales';

export interface NavItem {
  label: string;
  href: string;
}

const localePath = (locale: string, path: string) => (locale === 'en' ? path : `/${locale}${path}`);

// The top nav: home, about, services, hours & location, contact only.
// Insurance moved to the footer's Site column on 2026-09-22 per owner
// instruction — "Top nav is only home, about, services, hours & location and
// contact. The bottom footer will have everything on the top nav and more."
export function primaryNav(locale: string): NavItem[] {
  return [
    { label: getTranslation(locale, 'home'), href: locale === 'en' ? '/' : `/${locale}/` },
    { label: getTranslation(locale, 'about'), href: localePath(locale, '/about') },
    { label: getTranslation(locale, 'services'), href: localePath(locale, '/services') },
    { label: getTranslation(locale, 'hoursLocation'), href: localePath(locale, '/location') },
    { label: getTranslation(locale, 'contact'), href: localePath(locale, '/contact') },
  ];
}

// The footer's "Site" column: everything in the top nav, plus Insurance, New
// Patients and Articles.
export function footerNav(locale: string): NavItem[] {
  return [
    { label: getTranslation(locale, 'home'), href: locale === 'en' ? '/' : `/${locale}/` },
    { label: getTranslation(locale, 'about'), href: localePath(locale, '/about') },
    { label: getTranslation(locale, 'services'), href: localePath(locale, '/services') },
    { label: getTranslation(locale, 'insurance'), href: localePath(locale, '/insurance') },
    { label: getTranslation(locale, 'newPatients'), href: localePath(locale, '/new-patients') },
    { label: getTranslation(locale, 'hoursLocation'), href: localePath(locale, '/location') },
    { label: getTranslation(locale, 'contact'), href: localePath(locale, '/contact') },
    { label: getTranslation(locale, 'footer.articles'), href: localePath(locale, '/articles/') },
  ];
}
