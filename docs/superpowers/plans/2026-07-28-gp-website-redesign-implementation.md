# GP Website Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modern, mobile-first GP practice website with multi-language support, persistent call-to-action, and warm illustration-based aesthetic.

**Architecture:** Component-based build starting with reusable primitives (CallButton, Navigation) → Header composition → HomePage → content pages → multi-language integration. Each page and component stands alone with clear interfaces; Astro handles routing and i18n.

**Tech Stack:** Astro 5, Tailwind CSS, TypeScript, existing i18n system (locales.ts), existing design tokens

## Global Constraints

- Base font size: 1.125rem (18px), scalable via CSS custom property `--font-size-scale`
- Primary color: Purple `#5c4681` (existing Tailwind tokens)
- Headings: Georgia/Garamond serif; Body: system-ui sans-serif
- Mobile-first responsive design (breakpoints: sm 640px, md 768px, lg 1024px, xl 1280px)
- Touch targets minimum 48px × 48px
- WCAG 2.1 AA compliance required
- All pages translated to English, Traditional Chinese (zh-hant), Simplified Chinese (zh-hans)
- No appointment booking; site is informational + contact-focused
- Illustrations for hero, no clinical photos of doctor

---

## File Structure & Responsibilities

**New Components to Create:**
- `src/components/CallButton.astro` — Reusable CTA button (`tel:` link, accessible)
- `src/components/Navigation.astro` — Desktop horizontal navigation
- `src/components/MobileNav.astro` — Mobile hamburger menu + nav overlay
- `src/components/Header.astro` — Sticky header (composes nav, call button, logo, switchers)
- `src/components/HeroSection.astro` — Homepage hero with illustration + headline
- `src/components/ServiceCard.astro` — Service card (icon, title, description)
- `src/components/CertificationCard.astro` — Board certification display
- `src/components/TrustSection.astro` — Certifications + affiliations section
- `src/components/QuickInfoSection.astro` — Hours, address, phone quick ref

**Modified Components:**
- `src/layouts/BaseLayout.astro` — Update to use new Header component

**Pages to Create/Modify:**
- `src/pages/index.astro` — Homepage (EN)
- `src/pages/about.astro` — About Dr. Chang
- `src/pages/services.astro` — Services detail
- `src/pages/insurance.astro` — Insurance info
- `src/pages/location.astro` — Hours & Location (replaces split pages)
- `src/pages/contact.astro` — Contact form + info
- `src/pages/zh-hans/index.astro` — Homepage (Simplified Chinese)
- `src/pages/zh-hans/about.astro` — About (Simplified Chinese)
- `src/pages/zh-hans/services.astro` — Services (Simplified Chinese)
- `src/pages/zh-hans/insurance.astro` — Insurance (Simplified Chinese)
- `src/pages/zh-hans/location.astro` — Location (Simplified Chinese)
- `src/pages/zh-hans/contact.astro` — Contact (Simplified Chinese)
- `src/pages/zh-hant/` — (same structure, Traditional Chinese)

**Styles:**
- `src/styles/global.css` — Add CSS custom properties for font size scaling, hero visual styles

**Data (Existing):**
- `src/data/practice.ts` — Use existing practice info
- `src/i18n/locales.ts` — Extend translations as needed

---

## Implementation Tasks

### Task 1: CallButton Component — Reusable CTA

**Files:**
- Create: `src/components/CallButton.astro`

**Interfaces:**
- Consumes: `practice.phone` from `src/data/practice.ts`
- Produces: Astro component with props `text?: string`, `className?: string`, `size?: 'sm' | 'base' | 'lg'`

**Steps:**

- [ ] **Step 1: Create CallButton.astro**

```astro
---
import type { AstroComponentFactory } from 'astro';

interface Props {
  text?: string;
  className?: string;
  size?: 'sm' | 'base' | 'lg';
}

import { practice } from '@/data/practice';

const { text = 'Call Now', className = '', size = 'base' } = Astro.props;

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  base: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const phoneUrl = `tel:+1${practice.phone.replace(/\D/g, '')}`;
---

<a
  href={phoneUrl}
  class={`inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors ${sizeClasses[size]} ${className}`}
  aria-label={`Call office: ${practice.phone}`}
>
  {text}
</a>
```

- [ ] **Step 2: Test the component manually in browser**

Once created, verify:
- Button appears with correct styling (purple background)
- On mobile, clicking opens native phone dialer
- On desktop, clicking triggers default phone behavior
- Accessible alt text available (aria-label)
- Responsive padding/text size

- [ ] **Step 3: Commit**

```bash
git add src/components/CallButton.astro
git commit -m "feat: add reusable CallButton component with tel: link"
```

---

### Task 2: Navigation Component — Desktop Horizontal Nav

**Files:**
- Create: `src/components/Navigation.astro`

**Interfaces:**
- Consumes: `getTranslation()` from `src/i18n/locales.ts`
- Produces: Astro component with prop `currentPath: string`; renders horizontal nav list

**Steps:**

- [ ] **Step 1: Create Navigation.astro**

```astro
---
import { getTranslation } from '@/i18n/locales';

interface Props {
  locale: string;
  currentPath: string;
}

const { locale, currentPath } = Astro.props;

const navItems = [
  { label: getTranslation(locale, 'home'), href: locale === 'en' ? '/' : `/${locale}/` },
  { label: getTranslation(locale, 'about'), href: locale === 'en' ? '/about' : `/${locale}/about` },
  { label: 'Services', href: locale === 'en' ? '/services' : `/${locale}/services` },
  { label: 'Insurance', href: locale === 'en' ? '/insurance' : `/${locale}/insurance` },
  { label: 'Hours & Location', href: locale === 'en' ? '/location' : `/${locale}/location` },
  { label: getTranslation(locale, 'contact'), href: locale === 'en' ? '/contact' : `/${locale}/contact` },
];

const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/');
---

<nav class="hidden md:flex items-center gap-8">
  {navItems.map((item) => (
    <a
      href={item.href}
      class={`text-gray-700 hover:text-primary-600 transition-colors font-medium ${
        isActive(item.href) ? 'text-primary-600 border-b-2 border-primary-600' : ''
      }`}
    >
      {item.label}
    </a>
  ))}
</nav>
```

- [ ] **Step 2: Verify in browser**

- Desktop: All nav items visible horizontally
- Hover effects work (color changes to purple)
- Active state shows border-bottom
- Hidden on mobile (md: breakpoint)

- [ ] **Step 3: Commit**

```bash
git add src/components/Navigation.astro
git commit -m "feat: add desktop Navigation component with active state"
```

---

### Task 3: MobileNav Component — Hamburger Menu

**Files:**
- Create: `src/components/MobileNav.astro`

**Interfaces:**
- Consumes: Same as Navigation (locale, currentPath, getTranslation)
- Produces: Astro component; renders hamburger icon + hidden nav overlay (toggled via JavaScript)

**Steps:**

- [ ] **Step 1: Create MobileNav.astro with toggle script**

```astro
---
import { getTranslation } from '@/i18n/locales';

interface Props {
  locale: string;
  currentPath: string;
}

const { locale, currentPath } = Astro.props;

const navItems = [
  { label: getTranslation(locale, 'home'), href: locale === 'en' ? '/' : `/${locale}/` },
  { label: getTranslation(locale, 'about'), href: locale === 'en' ? '/about' : `/${locale}/about` },
  { label: 'Services', href: locale === 'en' ? '/services' : `/${locale}/services` },
  { label: 'Insurance', href: locale === 'en' ? '/insurance' : `/${locale}/insurance` },
  { label: 'Hours & Location', href: locale === 'en' ? '/location' : `/${locale}/location` },
  { label: getTranslation(locale, 'contact'), href: locale === 'en' ? '/contact' : `/${locale}/contact` },
];

const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + '/');
---

<div class="md:hidden">
  <button
    id="mobile-menu-toggle"
    class="p-2 text-gray-700 hover:text-primary-600"
    aria-label="Toggle navigation menu"
    aria-expanded="false"
    aria-controls="mobile-menu"
  >
    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
    </svg>
  </button>

  <div
    id="mobile-menu"
    class="fixed inset-0 bg-white z-40 transform -translate-x-full transition-transform duration-300 ease-in-out md:hidden"
    style="top: 60px; left: 0; right: 0; bottom: 0;"
  >
    <nav class="p-6 space-y-4">
      {navItems.map((item) => (
        <a
          href={item.href}
          class={`block py-2 px-4 rounded-lg transition-colors ${
            isActive(item.href)
              ? 'bg-primary-100 text-primary-600 font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {item.label}
        </a>
      ))}
    </nav>
  </div>
</div>

<script>
  const toggle = document.getElementById('mobile-menu-toggle');
  const menu = document.getElementById('mobile-menu');

  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.contains('translate-x-0');
      if (isOpen) {
        menu.classList.remove('translate-x-0');
        menu.classList.add('-translate-x-full');
        toggle.setAttribute('aria-expanded', 'false');
      } else {
        menu.classList.add('translate-x-0');
        menu.classList.remove('-translate-x-full');
        toggle.setAttribute('aria-expanded', 'true');
      }
    });

    // Close menu on link click
    const links = menu.querySelectorAll('a');
    links.forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('translate-x-0');
        menu.classList.add('-translate-x-full');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
</script>
```

- [ ] **Step 2: Test hamburger behavior**

- Mobile view: hamburger icon visible, desktop nav hidden
- Click hamburger: menu slides in from left
- Click menu item: menu slides out, navigates to page
- Menu closes on navigation

- [ ] **Step 3: Commit**

```bash
git add src/components/MobileNav.astro
git commit -m "feat: add mobile hamburger menu with slide-in animation"
```

---

### Task 4: Header Component — Sticky Header

**Files:**
- Create: `src/components/Header.astro`
- Modify: `src/styles/global.css` (add header styles if needed)

**Interfaces:**
- Consumes: `Navigation`, `MobileNav`, `CallButton`, `FontSizeControl`, `LanguageSwitcher`, locale/currentPath
- Produces: Astro component; sticky header with logo, nav, call button, language/font controls

**Steps:**

- [ ] **Step 1: Create Header.astro**

```astro
---
import Navigation from '@/components/Navigation.astro';
import MobileNav from '@/components/MobileNav.astro';
import CallButton from '@/components/CallButton.astro';
import FontSizeControl from '@/components/FontSizeControl.astro';
import LanguageSwitcher from '@/components/LanguageSwitcher.astro';
import { practice } from '@/data/practice';

interface Props {
  locale: string;
  currentPath: string;
}

const { locale, currentPath } = Astro.props;
---

<header class="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
  <div class="max-w-container mx-auto px-4 md:px-6 py-4 flex items-center justify-between min-h-16">
    {/* Logo / Practice Name */}
    <a href={locale === 'en' ? '/' : `/${locale}/`} class="flex items-center gap-2">
      <div class="text-xl font-serif font-semibold text-primary-600">
        {practice.doctorName}
      </div>
      <div class="hidden sm:block text-xs text-gray-500 font-sans">
        {locale === 'en' ? 'Family Medicine' : locale === 'zh-hant' ? '家庭醫學' : '家庭医学'}
      </div>
    </a>

    {/* Desktop Navigation */}
    <Navigation {locale} {currentPath} />

    {/* Right Side: Controls + Call Button */}
    <div class="flex items-center gap-3">
      <FontSizeControl />
      <LanguageSwitcher {locale} {currentPath} />
      <CallButton text={locale === 'en' ? 'Call Now' : locale === 'zh-hant' ? '致電' : '致电'} size="sm" />
    </div>

    {/* Mobile Navigation */}
    <MobileNav {locale} {currentPath} />
  </div>
</header>

<style>
  header {
    top: 0;
    left: 0;
    right: 0;
  }
</style>
```

- [ ] **Step 2: Test sticky behavior**

- Scroll page: header remains visible at top
- Desktop: nav visible, call button visible
- Mobile: hamburger visible, call button visible
- Logo clickable (returns to home)

- [ ] **Step 3: Verify spacing and alignment**

- Logo and nav centered vertically
- Icons/buttons right-aligned
- Touch targets ≥48px

- [ ] **Step 4: Commit**

```bash
git add src/components/Header.astro
git commit -m "feat: add sticky Header with navigation and CTA button"
```

---

### Task 5: Update BaseLayout to Use New Header

**Files:**
- Modify: `src/layouts/BaseLayout.astro`

**Steps:**

- [ ] **Step 1: Check existing BaseLayout structure**

Read the current file to see what it includes (head, body, existing header if any).

- [ ] **Step 2: Update BaseLayout**

```astro
---
import Header from '@/components/Header.astro';

interface Props {
  title?: string;
  description?: string;
  locale?: string;
}

const { title, description, locale = 'en' } = Astro.props;
const currentPath = Astro.url.pathname;
---

<!doctype html>
<html lang={locale === 'en' ? 'en-US' : locale === 'zh-hant' ? 'zh-Hant' : 'zh-Hans'}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content={description || 'GP practice website'} />
    <title>{title ? `${title} | Dr. Sheng Chang` : 'Dr. Sheng Chang'}</title>
    <style is:global>
      :root {
        --font-size-scale: 1;
      }
      html {
        font-size: calc(1.125rem * var(--font-size-scale));
      }
    </style>
  </head>
  <body class="bg-gray-50">
    <a href="#main-content" class="sr-only">Skip to content</a>
    
    <Header {locale} {currentPath} />

    <main id="main-content">
      <slot />
    </main>

    <footer class="bg-gray-900 text-white py-12 mt-16">
      <div class="max-w-container mx-auto px-4 md:px-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Hours */}
          <div>
            <h3 class="font-serif text-lg font-semibold mb-4">
              {locale === 'en' ? 'Hours' : locale === 'zh-hant' ? '營業時間' : '营业时间'}
            </h3>
            <p class="text-gray-300 text-sm">{/* practice.hours.weekday */}</p>
            <p class="text-gray-300 text-sm">{/* practice.hours.weekend */}</p>
          </div>

          {/* Address */}
          <div>
            <h3 class="font-serif text-lg font-semibold mb-4">
              {locale === 'en' ? 'Address' : locale === 'zh-hant' ? '地址' : '地址'}
            </h3>
            <p class="text-gray-300 text-sm">{/* practice.address */}</p>
          </div>

          {/* Phone */}
          <div>
            <h3 class="font-serif text-lg font-semibold mb-4">
              {locale === 'en' ? 'Phone' : locale === 'zh-hant' ? '電話' : '电话'}
            </h3>
            <p class="text-gray-300 text-sm">{/* practice.phone */}</p>
          </div>
        </div>

        {/* Footer Links */}
        <div class="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>&copy; 2026 Dr. Sheng Chang. All rights reserved.</p>
          <div class="space-x-6 mt-4 md:mt-0">
            <a href={locale === 'en' ? '/privacy' : `/${locale}/privacy`} class="hover:text-white">
              {locale === 'en' ? 'Privacy' : locale === 'zh-hant' ? '隱私' : '隐私'}
            </a>
            <a href={locale === 'en' ? '/accessibility' : `/${locale}/accessibility`} class="hover:text-white">
              {locale === 'en' ? 'Accessibility' : locale === 'zh-hant' ? '無障礙' : '无障碍'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  </body>
</html>

<style is:global>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: system-ui, -apple-system, sans-serif;
    line-height: 1.6;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: Georgia, Garamond, serif;
  }
  a {
    color: currentColor;
    text-decoration: none;
  }
  button {
    font-family: inherit;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
```

- [ ] **Step 2: Test BaseLayout in browser**

- Header appears on all pages
- Footer visible at bottom
- Main content area properly spaced
- Skip-to-content link functional (Tab key)

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "refactor: update BaseLayout with new Header component and global footer"
```

---

### Task 6: HeroSection Component — Homepage Hero

**Files:**
- Create: `src/components/HeroSection.astro`

**Interfaces:**
- Produces: Astro component with props `headline: string`, `subheadline: string`, `locale: string`

**Steps:**

- [ ] **Step 1: Create HeroSection.astro**

```astro
---
import CallButton from '@/components/CallButton.astro';

interface Props {
  headline: string;
  subheadline: string;
  locale: string;
}

const { headline, subheadline, locale } = Astro.props;
---

<section class="bg-gradient-to-b from-primary-50 to-white py-12 md:py-20">
  <div class="max-w-container mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center gap-8 md:gap-12">
    {/* Text Content */}
    <div class="flex-1">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        {headline}
      </h1>
      <p class="text-xl text-gray-700 mb-8 leading-relaxed">
        {subheadline}
      </p>
      <CallButton text={locale === 'en' ? 'Call Us Today' : locale === 'zh-hant' ? '立即致電' : '立即致电'} size="lg" />
    </div>

    {/* Illustration Placeholder */}
    <div class="flex-1 flex justify-center items-center">
      <div class="w-full max-w-md aspect-square bg-primary-100 rounded-2xl flex items-center justify-center">
        <div class="text-center">
          <div class="text-6xl mb-4">🏥</div>
          <p class="text-gray-600 text-sm">
            {locale === 'en' ? 'Healthcare illustration' : locale === 'zh-hant' ? '醫療插圖' : '医疗插图'}
          </p>
        </div>
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Test responsive layout**

- Desktop: text on left, illustration on right, side-by-side
- Mobile: text and illustration stacked vertically
- Headline large and readable
- Call button visible

- [ ] **Step 3: Commit**

```bash
git add src/components/HeroSection.astro
git commit -m "feat: add HeroSection component with illustration placeholder"
```

---

### Task 7: ServiceCard Component

**Files:**
- Create: `src/components/ServiceCard.astro`

**Steps:**

- [ ] **Step 1: Create ServiceCard.astro**

```astro
---
interface Props {
  icon: string;
  title: string;
  description: string;
  href: string;
}

const { icon, title, description, href } = Astro.props;
---

<div class="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
  <div class="text-4xl mb-4">{icon}</div>
  <h3 class="font-serif text-xl font-semibold text-gray-900 mb-2">
    {title}
  </h3>
  <p class="text-gray-600 mb-4 text-sm leading-relaxed">
    {description}
  </p>
  <a href={href} class="text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-2">
    {icon === '🔍' ? 'Learn more' : 'Learn more'}
    <span>→</span>
  </a>
</div>
```

- [ ] **Step 2: Test in browser**

- Card renders with icon, title, description
- Hover effect (shadow increases)
- Link navigates correctly

- [ ] **Step 3: Commit**

```bash
git add src/components/ServiceCard.astro
git commit -m "feat: add ServiceCard component for service listings"
```

---

### Task 8: Homepage (`index.astro`) — English

**Files:**
- Modify: `src/pages/index.astro`

**Steps:**

- [ ] **Step 1: Write English homepage**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import HeroSection from '@/components/HeroSection.astro';
import ServiceCard from '@/components/ServiceCard.astro';
import CallButton from '@/components/CallButton.astro';
import { practice } from '@/data/practice';

const locale = 'en';
---

<BaseLayout
  title="Home"
  description="Dr. Sheng Chang - Family Medicine & Internal Medicine in San Gabriel, CA"
  {locale}
>
  {/* Hero Section */}
  <HeroSection
    headline="Meet Dr. Sheng Chang, M.D."
    subheadline="Comprehensive family medicine and internal medicine care serving San Gabriel and surrounding communities. Board-certified, compassionate, and dedicated to your health."
    {locale}
  />

  {/* Services Section */}
  <section class="py-16 md:py-24 bg-white">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h2 class="font-serif text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
        Our Services
      </h2>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ServiceCard
          icon="👨‍⚕️"
          title="Family Medicine"
          description="Comprehensive care for the whole family, from preventive health to acute illness treatment."
          href="/services#family-medicine"
        />
        <ServiceCard
          icon="🏥"
          title="Internal Medicine"
          description="Expert care for complex medical conditions and chronic disease management in adults."
          href="/services#internal-medicine"
        />
        <ServiceCard
          icon="❤️"
          title="Preventive Care"
          description="Annual physical exams, health screenings, and wellness visits to keep you healthy."
          href="/services#preventive-care"
        />
        <ServiceCard
          icon="💊"
          title="Chronic Disease Management"
          description="Ongoing management of diabetes, hypertension, and other chronic conditions."
          href="/services#chronic-disease"
        />
      </div>
    </div>
  </section>

  {/* Trust Section */}
  <section class="py-16 md:py-24 bg-gray-50">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h2 class="font-serif text-3xl font-bold text-center mb-12 text-gray-900">
        Why Trust Dr. Chang?
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Credentials */}
        <div>
          <h3 class="font-serif text-2xl font-bold mb-6 text-gray-900">
            Board Certified
          </h3>
          <ul class="space-y-4 text-gray-700">
            {practice.boardCertifications.map((cert) => (
              <li class="flex gap-3">
                <span class="text-primary-600 font-bold">✓</span>
                <div>
                  <p class="font-semibold">{cert.specialty}</p>
                  <p class="text-sm text-gray-600">{cert.board}</p>
                  <p class="text-xs text-gray-500">Certified {cert.firstCertified}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Education & Affiliations */}
        <div>
          <h3 class="font-serif text-2xl font-bold mb-6 text-gray-900">
            Experienced & Affiliated
          </h3>
          <div class="space-y-6">
            <div>
              <p class="font-semibold text-gray-900">Medical Education</p>
              <p class="text-gray-700">M.D., {practice.education.school}, {practice.education.year}</p>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Hospital Affiliations</p>
              <ul class="text-gray-700 space-y-1">
                {practice.hospitalAffiliations.map((hospital) => (
                  <li>• {hospital}</li>
                ))}
              </ul>
            </div>
            <div>
              <p class="font-semibold text-gray-900">Languages</p>
              <p class="text-gray-700">{practice.languages.join(', ')}</p>
            </div>
            {practice.acceptingNewPatients && (
              <div class="bg-success bg-opacity-10 border border-success rounded-lg p-4">
                <p class="text-success font-semibold">✓ Accepting New Patients</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  </section>

  {/* Quick Contact CTA */}
  <section class="py-16 md:py-24 bg-primary-50">
    <div class="max-w-container mx-auto px-4 md:px-6 text-center">
      <h2 class="font-serif text-3xl font-bold mb-6 text-gray-900">
        Ready to Schedule Your Visit?
      </h2>
      <p class="text-lg text-gray-700 mb-8">
        Call us today to book your appointment or learn more about our services.
      </p>
      <CallButton text="Call Us Now" size="lg" />
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Test homepage in browser**

- All sections render correctly
- Hero section visible with call button
- Service cards display in grid
- Trust section shows certifications and credentials
- Final CTA button prominent
- Responsive on mobile (single column)

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: build English homepage with services, credentials, and CTAs"
```

---

### Task 9: About Page (`about.astro`) — English

**Files:**
- Create: `src/pages/about.astro`

**Steps:**

- [ ] **Step 1: Create About page**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import { practice } from '@/data/practice';

const locale = 'en';
---

<BaseLayout
  title="About Dr. Sheng Chang"
  description="Learn about Dr. Sheng Chang's medical background, board certifications, and commitment to patient care."
  {locale}
>
  {/* Hero Section */}
  <section class="py-12 md:py-20 bg-primary-50 border-b border-primary-200">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        About Dr. Sheng Chang
      </h1>
      <p class="text-xl text-gray-700 max-w-2xl">
        Dedicated family medicine physician with decades of experience serving the San Gabriel community.
      </p>
    </div>
  </section>

  {/* Main Content */}
  <section class="py-16 md:py-24">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Left: Bio */}
        <div>
          <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
            Medical Background
          </h2>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Dr. Sheng Chang is a board-certified physician with a passion for comprehensive, compassionate patient care. With {new Date().getFullYear() - practice.education.year} years of experience in family medicine and internal medicine, he has built a practice centered on getting to know his patients and helping them achieve their health goals.
          </p>
          <p class="text-gray-700 mb-4 leading-relaxed">
            Dr. Chang received his M.D. from {practice.education.school} in {practice.education.year}. He completed {practice.education.postgraduateTraining} at {practice.education.residency}, where he developed his expertise in diagnosing and treating a wide range of medical conditions.
          </p>
          <p class="text-gray-700 leading-relaxed">
            When not caring for patients, Dr. Chang enjoys spending time with family and staying current with advances in medical science.
          </p>
        </div>

        {/* Right: Key Facts */}
        <div class="space-y-8">
          <div class="bg-gray-50 p-8 rounded-lg">
            <h3 class="font-serif text-xl font-bold mb-4 text-gray-900">
              Quick Facts
            </h3>
            <ul class="space-y-3 text-gray-700">
              <li class="flex gap-3">
                <span class="text-primary-600">•</span>
                <span>Board Certified, American Board of Family Medicine</span>
              </li>
              <li class="flex gap-3">
                <span class="text-primary-600">•</span>
                <span>Medical License: {practice.medicalLicenseNumber} (California)</span>
              </li>
              <li class="flex gap-3">
                <span class="text-primary-600">•</span>
                <span>Fluent in English and Mandarin</span>
              </li>
              <li class="flex gap-3">
                <span class="text-primary-600">•</span>
                <span>{practice.acceptingNewPatients ? 'Currently accepting new patients' : 'Consultation available'}</span>
              </li>
            </ul>
          </div>

          <div class="bg-primary-50 p-8 rounded-lg border border-primary-200">
            <h3 class="font-serif text-xl font-bold mb-4 text-gray-900">
              Approach to Care
            </h3>
            <p class="text-gray-700">
              Dr. Chang believes in building strong doctor-patient relationships, taking time to listen to concerns, and working together with patients to develop treatment plans that fit their lifestyle and values.
            </p>
          </div>
        </div>
      </div>

      {/* Board Certifications */}
      <div class="mb-16">
        <h2 class="font-serif text-2xl font-bold mb-8 text-gray-900">
          Board Certifications
        </h2>
        <div class="space-y-4">
          {practice.boardCertifications.map((cert) => (
            <div class="border border-gray-200 rounded-lg p-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-500 uppercase tracking-wide">Specialty</p>
                  <p class="font-semibold text-gray-900">{cert.specialty}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 uppercase tracking-wide">Board</p>
                  <p class="font-semibold text-gray-900">{cert.board}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-500 uppercase tracking-wide">Status</p>
                  <p class="font-semibold text-success">{cert.currentStatus}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Affiliations */}
      <div class="mb-16">
        <h2 class="font-serif text-2xl font-bold mb-8 text-gray-900">
          Hospital Affiliations
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {practice.hospitalAffiliations.map((hospital) => (
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <p class="font-semibold text-gray-900">{hospital}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Test About page**

- Page loads and renders correctly
- All credentials display
- Certifications table shows cleanly
- Hospital affiliations visible
- Responsive layout on mobile

- [ ] **Step 3: Commit**

```bash
git add src/pages/about.astro
git commit -m "feat: create About page with credentials, certifications, and affiliations"
```

---

### Task 10: Services Page (`services.astro`) — English

**Files:**
- Create: `src/pages/services.astro`

**Steps:**

- [ ] **Step 1: Create Services page**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';

const locale = 'en';

const services = [
  {
    id: 'family-medicine',
    title: 'Family Medicine',
    description: 'Comprehensive care for patients of all ages, from infants to seniors.',
    details: [
      'Preventive health visits and annual physicals',
      'Acute illness and injury treatment',
      'Chronic disease management',
      'Pediatric care for infants and children',
      'Women\'s health services',
      'Mental health support and counseling referrals',
    ],
  },
  {
    id: 'internal-medicine',
    title: 'Internal Medicine',
    description: 'Specialized care for adults with complex medical conditions.',
    details: [
      'Comprehensive evaluation of internal organs',
      'Management of multiple chronic diseases',
      'Cardiovascular health optimization',
      'Diabetes management and monitoring',
      'Metabolic syndrome treatment',
      'Preventive screening and risk assessment',
    ],
  },
  {
    id: 'preventive-care',
    title: 'Preventive Care',
    description: 'Stay healthy with proactive wellness services.',
    details: [
      'Annual physical examinations',
      'Blood pressure and cholesterol screening',
      'Cancer screenings (colonoscopy referral, mammography)',
      'Immunizations and vaccines',
      'Health risk assessments',
      'Lifestyle counseling and nutrition guidance',
    ],
  },
  {
    id: 'chronic-disease',
    title: 'Chronic Disease Management',
    description: 'Ongoing care for conditions like diabetes, hypertension, and more.',
    details: [
      'Diabetes management and glucose monitoring',
      'Hypertension control and medication management',
      'Asthma and COPD management',
      'Arthritis and pain management',
      'Thyroid disease treatment',
      'Regular follow-up visits and lab work',
    ],
  },
];
---

<BaseLayout
  title="Services"
  description="Explore the medical services offered by Dr. Sheng Chang, including family medicine, internal medicine, and preventive care."
  {locale}
>
  {/* Hero Section */}
  <section class="py-12 md:py-20 bg-primary-50 border-b border-primary-200">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Our Services
      </h1>
      <p class="text-xl text-gray-700 max-w-2xl">
        Comprehensive medical care tailored to your individual health needs.
      </p>
    </div>
  </section>

  {/* Services Detail */}
  <section class="py-16 md:py-24">
    <div class="max-w-container mx-auto px-4 md:px-6">
      {services.map((service, idx) => (
        <div key={service.id} class={`mb-16 pb-16 ${idx < services.length - 1 ? 'border-b border-gray-200' : ''}`}>
          <div id={service.id} class="scroll-mt-20">
            <h2 class="font-serif text-3xl font-bold mb-4 text-gray-900">
              {service.title}
            </h2>
            <p class="text-lg text-gray-700 mb-8 max-w-2xl">
              {service.description}
            </p>

            <h3 class="font-serif text-xl font-semibold mb-4 text-gray-900">
              What's Included
            </h3>
            <ul class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {service.details.map((detail) => (
                <li class="flex gap-3 text-gray-700">
                  <span class="text-primary-600 font-bold flex-shrink-0">✓</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  </section>

  {/* CTA Section */}
  <section class="py-16 md:py-24 bg-primary-50">
    <div class="max-w-container mx-auto px-4 md:px-6 text-center">
      <h2 class="font-serif text-3xl font-bold mb-6 text-gray-900">
        Ready to Get Started?
      </h2>
      <p class="text-lg text-gray-700 mb-8">
        Contact us to schedule an appointment and discuss which services are right for you.
      </p>
      <a
        href={locale === 'en' ? '/contact' : `/${locale}/contact`}
        class="inline-block bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-4 rounded-lg transition-colors"
      >
        Contact Us
      </a>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Test Services page**

- All service sections render
- Service IDs work for anchor links (click from nav)
- Details display in 2-column grid on desktop, 1 column on mobile
- CTA button visible

- [ ] **Step 3: Commit**

```bash
git add src/pages/services.astro
git commit -m "feat: create Services page with detailed service offerings"
```

---

### Task 11: Location & Hours Page (`location.astro`) — English

**Files:**
- Create: `src/pages/location.astro`

**Steps:**

- [ ] **Step 1: Create Location page**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import CallButton from '@/components/CallButton.astro';
import { practice } from '@/data/practice';

const locale = 'en';
---

<BaseLayout
  title="Hours & Location"
  description="Visit Dr. Sheng Chang's office. Hours, address, directions, and parking information."
  {locale}
>
  {/* Hero Section */}
  <section class="py-12 md:py-20 bg-primary-50 border-b border-primary-200">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Hours & Location
      </h1>
      <p class="text-xl text-gray-700">
        Find us at our San Gabriel office.
      </p>
    </div>
  </section>

  {/* Main Content */}
  <section class="py-16 md:py-24">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Hours & Contact Info */}
        <div class="space-y-8">
          <div>
            <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
              Office Hours
            </h2>
            <div class="bg-gray-50 p-8 rounded-lg space-y-4">
              <div>
                <p class="text-sm uppercase tracking-wide text-gray-500 font-semibold">Weekdays</p>
                <p class="text-lg text-gray-900 font-semibold">{practice.hours.weekday}</p>
              </div>
              <div>
                <p class="text-sm uppercase tracking-wide text-gray-500 font-semibold">Weekends</p>
                <p class="text-lg text-gray-900 font-semibold">{practice.hours.weekend}</p>
              </div>
              <p class="text-sm text-gray-600 pt-4 border-t border-gray-200">
                Please call ahead for appointments or if you have questions about our hours.
              </p>
            </div>
          </div>

          <div>
            <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
              Contact Information
            </h2>
            <div class="bg-gray-50 p-8 rounded-lg space-y-6">
              <div>
                <p class="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Phone</p>
                <a href={`tel:+1${practice.phone.replace(/\D/g, '')}`} class="text-lg text-primary-600 hover:text-primary-700 font-semibold">
                  {practice.phone}
                </a>
              </div>
              <div>
                <p class="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-2">Address</p>
                <p class="text-gray-900">{practice.address}</p>
              </div>
              <div class="pt-4 border-t border-gray-200">
                <CallButton text="Call Us Now" size="base" />
              </div>
            </div>
          </div>
        </div>

        {/* Map Placeholder */}
        <div>
          <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
            Directions
          </h2>
          <div class="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
            <div class="text-center">
              <p class="text-gray-600 text-lg mb-4">📍 Map Placeholder</p>
              <p class="text-gray-500 text-sm">Google Maps embed will go here</p>
            </div>
          </div>
          <p class="text-sm text-gray-600 mt-4">
            Located in San Gabriel, easily accessible from surrounding communities. Ample parking available.
          </p>
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Test Location page**

- Hours display clearly
- Phone number is clickable tel: link
- Address visible
- Map placeholder shows
- Layout responsive

- [ ] **Step 3: Commit**

```bash
git add src/pages/location.astro
git commit -m "feat: create Location & Hours page with contact information"
```

---

### Task 12: Insurance Page (`insurance.astro`) — English

**Files:**
- Create: `src/pages/insurance.astro`

**Steps:**

- [ ] **Step 1: Create Insurance page**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import CallButton from '@/components/CallButton.astro';

const locale = 'en';

const insurers = [
  'Medicare',
  'Medicaid',
  'Blue Cross Blue Shield',
  'Aetna',
  'United Healthcare',
  'Cigna',
  'HealthNet',
  'Other major plans',
];
---

<BaseLayout
  title="Insurance"
  description="Insurance information and payment options for Dr. Sheng Chang's office."
  {locale}
>
  {/* Hero Section */}
  <section class="py-12 md:py-20 bg-primary-50 border-b border-primary-200">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Insurance & Payment
      </h1>
      <p class="text-xl text-gray-700">
        Information about accepted insurance plans and payment options.
      </p>
    </div>
  </section>

  {/* Content */}
  <section class="py-16 md:py-24">
    <div class="max-w-container mx-auto px-4 md:px-6 max-w-3xl">
      <div class="bg-white border border-gray-200 rounded-lg p-8 mb-12">
        <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
          We Accept Most Insurance Plans
        </h2>
        <p class="text-gray-700 mb-8 leading-relaxed">
          Our office accepts a wide range of insurance plans to make healthcare accessible to all patients. We're committed to helping you understand your coverage and minimizing out-of-pocket costs.
        </p>

        <h3 class="font-serif text-xl font-semibold mb-4 text-gray-900">
          Common Plans We Accept
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {insurers.map((insurer) => (
            <div class="flex gap-3 text-gray-700">
              <span class="text-primary-600 font-bold flex-shrink-0">✓</span>
              <span>{insurer}</span>
            </div>
          ))}
        </div>

        <div class="bg-info bg-opacity-10 border border-info rounded-lg p-6">
          <p class="text-info font-semibold mb-2">💡 Don't See Your Plan?</p>
          <p class="text-gray-700 text-sm">
            We work with many insurance plans. Please contact us to verify your specific coverage.
          </p>
        </div>
      </div>

      {/* Payment Options */}
      <div class="bg-gray-50 p-8 rounded-lg mb-12">
        <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
          Payment Options
        </h2>
        <ul class="space-y-4">
          <li class="flex gap-3">
            <span class="text-primary-600 font-bold">1</span>
            <div>
              <p class="font-semibold text-gray-900">Insurance Billing</p>
              <p class="text-gray-600 text-sm">We bill your insurance directly. You pay only your copay/coinsurance.</p>
            </div>
          </li>
          <li class="flex gap-3">
            <span class="text-primary-600 font-bold">2</span>
            <div>
              <p class="font-semibold text-gray-900">Self-Pay</p>
              <p class="text-gray-600 text-sm">No insurance? We offer competitive rates and discount programs for uninsured patients.</p>
            </div>
          </li>
          <li class="flex gap-3">
            <span class="text-primary-600 font-bold">3</span>
            <div>
              <p class="font-semibold text-gray-900">Payment Plans</p>
              <p class="text-gray-600 text-sm">We work with patients to set up flexible payment plans for larger balances.</p>
            </div>
          </li>
        </ul>
      </div>

      {/* Questions Section */}
      <div class="bg-primary-50 border border-primary-200 rounded-lg p-8">
        <h2 class="font-serif text-2xl font-bold mb-4 text-gray-900">
          Questions About Your Coverage?
        </h2>
        <p class="text-gray-700 mb-6">
          Our office staff is happy to help answer questions about your insurance coverage and estimate costs for your visit.
        </p>
        <CallButton text="Call Us to Discuss" size="base" />
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Test Insurance page**

- All content displays properly
- Insurance list renders
- Payment options clear
- Call button visible

- [ ] **Step 3: Commit**

```bash
git add src/pages/insurance.astro
git commit -m "feat: create Insurance page with accepted plans and payment options"
```

---

### Task 13: Contact Page (`contact.astro`) — English

**Files:**
- Create: `src/pages/contact.astro`

**Steps:**

- [ ] **Step 1: Create Contact page**

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import CallButton from '@/components/CallButton.astro';
import { practice } from '@/data/practice';

const locale = 'en';
---

<BaseLayout
  title="Contact Us"
  description="Contact Dr. Sheng Chang's office. Call, visit, or send us a message."
  {locale}
>
  {/* Hero Section */}
  <section class="py-12 md:py-20 bg-primary-50 border-b border-primary-200">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <h1 class="font-serif text-4xl md:text-5xl font-bold text-gray-900 mb-4">
        Contact Us
      </h1>
      <p class="text-xl text-gray-700">
        Get in touch with our office to schedule an appointment or ask questions.
      </p>
    </div>
  </section>

  {/* Content */}
  <section class="py-16 md:py-24">
    <div class="max-w-container mx-auto px-4 md:px-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Info */}
        <div class="space-y-8">
          <div>
            <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
              Call Us
            </h2>
            <div class="bg-gray-50 p-8 rounded-lg">
              <p class="text-gray-600 mb-4">The fastest way to reach us:</p>
              <a
                href={`tel:+1${practice.phone.replace(/\D/g, '')}`}
                class="text-3xl font-bold text-primary-600 hover:text-primary-700 inline-block mb-6"
              >
                {practice.phone}
              </a>
              <div class="flex gap-4">
                <CallButton text="Call Now" size="base" />
                <a
                  href={`tel:+1${practice.phone.replace(/\D/g, '')}`}
                  class="inline-block px-6 py-3 border border-primary-600 text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
                >
                  Text Inquiry
                </a>
              </div>
            </div>
          </div>

          <div>
            <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
              Visit Us
            </h2>
            <div class="bg-gray-50 p-8 rounded-lg space-y-4">
              <div>
                <p class="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-1">Address</p>
                <p class="text-gray-900 font-medium">{practice.address}</p>
              </div>
              <div>
                <p class="text-sm uppercase tracking-wide text-gray-500 font-semibold mb-1">Hours</p>
                <p class="text-gray-900">{practice.hours.weekday}</p>
                <p class="text-gray-600 text-sm">{practice.hours.weekend}</p>
              </div>
              <a
                href={locale === 'en' ? '/location' : `/${locale}/location`}
                class="inline-block text-primary-600 hover:text-primary-700 font-semibold mt-4"
              >
                Get Directions →
              </a>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 class="font-serif text-2xl font-bold mb-6 text-gray-900">
            Send us a Message
          </h2>
          <form class="bg-white border border-gray-200 rounded-lg p-8 space-y-6">
            <div>
              <label for="name" class="block text-sm font-semibold text-gray-900 mb-2">
                Name
              </label>
              <input
                id="name"
                type="text"
                name="name"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="Your name"
              />
            </div>

            <div>
              <label for="email" class="block text-sm font-semibold text-gray-900 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder="your.email@example.com"
              />
            </div>

            <div>
              <label for="phone" class="block text-sm font-semibold text-gray-900 mb-2">
                Phone
              </label>
              <input
                id="phone"
                type="tel"
                name="phone"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
                placeholder={practice.phone}
              />
            </div>

            <div>
              <label for="subject" class="block text-sm font-semibold text-gray-900 mb-2">
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="">Select a subject</option>
                <option value="appointment">Schedule an Appointment</option>
                <option value="insurance">Insurance Question</option>
                <option value="referral">Referral Request</option>
                <option value="billing">Billing Question</option>
                <option value="general">General Inquiry</option>
              </select>
            </div>

            <div>
              <label for="message" class="block text-sm font-semibold text-gray-900 mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 resize-none"
                placeholder="Tell us how we can help..."
              ></textarea>
            </div>

            <button
              type="submit"
              class="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Send Message
            </button>

            <p class="text-xs text-gray-500">
              Note: This is a demonstration form. To send a message, please call us or use a contact form service.
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</BaseLayout>
```

- [ ] **Step 2: Test Contact page**

- Phone number clickable
- Form renders with all fields
- Call button visible
- Layout responsive
- Links to location page work

- [ ] **Step 3: Commit**

```bash
git add src/pages/contact.astro
git commit -m "feat: create Contact page with contact form and information"
```

---

### Task 14: Multi-Language: Chinese Translations & Pages (Simplified + Traditional)

**Files:**
- Modify: `src/i18n/locales.ts` — add full translations
- Create: `src/pages/zh-hans/index.astro` — copy from English, use translations
- Create: `src/pages/zh-hans/about.astro`
- Create: `src/pages/zh-hans/services.astro`
- Create: `src/pages/zh-hans/insurance.astro`
- Create: `src/pages/zh-hans/location.astro`
- Create: `src/pages/zh-hans/contact.astro`
- Create: `src/pages/zh-hant/` — (same structure)

**Steps:**

- [ ] **Step 1: Extend locales.ts with full translations**

Add Chinese translations for all UI strings. Update the `translations` object to include:
- All navigation labels
- All page headings and content
- All button labels
- All form labels

Example additions:
```typescript
'zh-hans': {
  home: '首页',
  about: '关于我们',
  services: '服务',
  insurance: '保险',
  location: '位置与时间',
  contact: '联系',
  // ... etc
}
```

- [ ] **Step 2: Create Simplified Chinese homepage**

Copy `src/pages/index.astro` to `src/pages/zh-hans/index.astro` and update:
- Set `locale = 'zh-hans'`
- Use translated strings from locales.ts
- Use translated heading/subheading text

- [ ] **Step 3: Create Simplified Chinese About page**

Copy `src/pages/about.astro` to `src/pages/zh-hans/about.astro` with translations.

- [ ] **Step 4: Create Simplified Chinese Services page**

Copy `src/pages/services.astro` to `src/pages/zh-hans/services.astro` with translated service names and descriptions.

- [ ] **Step 5: Create Simplified Chinese Insurance page**

Copy `src/pages/insurance.astro` to `src/pages/zh-hans/insurance.astro` with translations.

- [ ] **Step 6: Create Simplified Chinese Location page**

Copy `src/pages/location.astro` to `src/pages/zh-hans/location.astro` with translations.

- [ ] **Step 7: Create Simplified Chinese Contact page**

Copy `src/pages/contact.astro` to `src/pages/zh-hans/contact.astro` with translations.

- [ ] **Step 8: Repeat Steps 1-7 for Traditional Chinese (zh-hant)**

Create all pages in `src/pages/zh-hant/` with Traditional Chinese translations.

- [ ] **Step 9: Test multi-language navigation**

- Verify all language routes work: `/`, `/zh-hans/`, `/zh-hant/`
- Verify language switcher changes language correctly
- Verify content displays in correct language
- Verify all links work within each language

- [ ] **Step 10: Commit multi-language changes**

```bash
git add src/i18n/locales.ts src/pages/zh-hans/ src/pages/zh-hant/
git commit -m "feat: add full Traditional Chinese and Simplified Chinese translations with complete page translations"
```

---

### Task 15: Font Size Control Integration

**Files:**
- Modify: `src/components/FontSizeControl.astro` (if needed)
- Modify: `src/styles/global.css` — ensure CSS custom properties are set up

**Steps:**

- [ ] **Step 1: Verify FontSizeControl component**

Check existing component to ensure it:
- Has increment/decrement buttons (A–, A, A+)
- Updates CSS custom property `--font-size-scale`
- Persists to localStorage
- Includes ARIA labels

- [ ] **Step 2: Verify global.css has font scaling**

Ensure `global.css` includes:
```css
:root {
  --font-size-scale: var(--stored-scale, 1);
}
body {
  font-size: calc(1.125rem * var(--font-size-scale));
}
h1 { font-size: calc(2.25rem * var(--font-size-scale)); }
h2 { font-size: calc(1.875rem * var(--font-size-scale)); }
h3 { font-size: calc(1.5rem * var(--font-size-scale)); }
```

- [ ] **Step 3: Test font size scaling**

- Click A+ button: text should increase
- Click A– button: text should decrease
- Reload page: font size should persist
- Scaling should apply to all headings and body text

- [ ] **Step 4: Commit**

```bash
git add src/components/FontSizeControl.astro src/styles/global.css
git commit -m "refactor: integrate and verify font size control across all pages"
```

---

### Task 16: Accessibility & Mobile Testing

**Files:**
- No files modified; testing only

**Steps:**

- [ ] **Step 1: Mobile responsiveness test**

Test on actual mobile device or Chrome DevTools (iPhone 12, Android):
- All pages fully responsive (no horizontal scroll)
- Touch targets ≥48px
- Text readable without zoom
- Hamburger menu works
- Call button easy to tap

- [ ] **Step 2: Keyboard navigation test**

Tab through each page:
- Header links all focusable
- Call button focusable
- Form fields focusable with visible outline
- Focus order logical
- Skip-to-content link works

- [ ] **Step 3: Screen reader test (optional)**

Test with macOS VoiceOver or NVDA:
- All text readable
- Links have descriptive text (not "click here")
- Form labels associated with inputs
- Headings properly nested (h1 → h2 → h3)

- [ ] **Step 4: Color contrast test**

Use WebAIM Contrast Checker or browser DevTools:
- Verify text has ≥4.5:1 contrast (normal text)
- Verify headings have ≥3:1 contrast
- No color-only conveyed information

- [ ] **Step 5: Multi-language verification**

- Switch to each language
- Verify all content translated
- Check for any English fallback text (bugs)
- Verify CJK typography renders correctly

- [ ] **Step 6: Document testing results**

Create a simple test report noting:
- ✅ Mobile responsive
- ✅ Keyboard accessible
- ✅ Color contrast WCAG AA
- ✅ Multi-language working
- ✅ Font size control working

---

### Task 17: Final Build & Deploy

**Files:**
- No new files; build & test only

**Steps:**

- [ ] **Step 1: Build production site**

```bash
npm run build
```

Verify build completes without errors.

- [ ] **Step 2: Test built site locally**

```bash
npm run preview
```

Visit http://localhost:3000 and verify:
- All pages load
- Navigation works
- Styling correct
- Images/assets load
- No console errors

- [ ] **Step 3: Final commit**

```bash
git add docs/superpowers/plans/
git commit -m "docs: add implementation plan for GP website redesign"
```

- [ ] **Step 4: Ready for deployment**

Site is ready to deploy to Vercel or preferred hosting.

---

## Summary

**Expected Deliverables:**
- ✅ Modern, mobile-first GP practice website
- ✅ Sticky header with persistent call-to-action
- ✅ Hamburger navigation for mobile
- ✅ Multi-language support (EN, Traditional Chinese, Simplified Chinese)
- ✅ Illustration-based hero visual
- ✅ Services, About, Insurance, Location, Contact pages
- ✅ Font size switcher integrated
- ✅ WCAG 2.1 AA accessibility compliant
- ✅ Fully tested and ready to deploy

**Estimated Timeline:** 2-3 hours for an experienced developer (tasks 1-14), plus testing (tasks 15-17).

