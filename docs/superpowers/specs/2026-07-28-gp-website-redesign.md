# GP Website Redesign: Modern, Multi-Language, Accessible

**Date:** 2026-07-28  
**Project:** Shengchangmd GP Practice Website  
**Scope:** Complete visual and UX redesign with multi-language support, modern navigation, and improved accessibility  
**Target Audience:** Patients seeking family medicine / internal medicine care (English and Mandarin speakers)

---

## Overview

A modern, mobile-first redesign of Dr. Sheng Chang's GP practice website. The site prioritizes **learning about services & qualifications** and **easy contact/location access** over appointment booking. Design is warm & approachable yet professional, with modern illustration-based aesthetic that works across cultures and languages.

### Key Requirements
- ✅ Mobile-optimized (touch-friendly, responsive)
- ✅ Multi-page architecture (not single-page)
- ✅ Multi-language support (English, Traditional Chinese, Simplified Chinese)
- ✅ Font size switcher (already built, integrated)
- ✅ Modern navigation suitable for GP practice target audience
- ✅ Persistent CTA ("Call Now") for mobile/contact
- ✅ Illustration-based hero visual
- ✅ Extract content from existing site; new visual approach

---

## Design System & Branding

**Existing Design Tokens (Tailwind):**
- **Primary Color:** Purple (`#5c4681` as base, with `50`–`900` scale)
- **Typography:** 
  - Headings: Georgia/Garamond serif
  - Body: system-ui sans-serif
  - Base font size: 1.125rem (18px) — already accessible
- **Spacing Scale:** Tailwind default (0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14, 16, 20, 24, 28, 32)
- **Colors:** Neutral grays, status colors (success, warning, error, info)

**Visual Approach:**
- Warm, neutral background (off-white/cream: `gray-50` or `gray-100`)
- Purple as accent for CTAs, section dividers, highlights
- Healthcare-themed illustrations (custom or curated)
- Generous whitespace, clean hierarchy
- No photos of doctor or clinical settings (illustrations only)

---

## Navigation Architecture

### Desktop Navigation
```
[Logo/Dr. Name]  Home | About | Services | Insurance | Hours & Location | Contact  [Font Size] [Language]  [Call Now →]
```

- **Horizontal layout**, sticky header
- Logo/practice name on left
- Main nav items centered or left-aligned
- Right side: Font size control icon, language switcher, "Call Now" CTA button (purple, prominent)
- Font size and language controls: small icons (text size `A+` / `A-`, globe icon)

### Mobile Navigation
- **Hamburger menu** (3-line icon, top-left or top-right)
- When opened: vertical nav menu with all links
- Font size switcher in menu or persistent top icon
- Language switcher in menu
- "Call Now" sticky button at top (always visible, `tel:` link for native dialer)
- Menu slides in from side (smooth transition)

### Header Behavior
- Sticky on scroll (remains visible)
- On desktop: full horizontal nav visible
- On mobile: hamburger icon + logo + call button visible; nav hidden until menu opened
- Call button on mobile: tappable target ≥48px (accessible sizing)

---

## Page Architecture & Content Structure

### 1. **Home** (`/index.astro`, `/zh-hans/index.astro`, `/zh-hant/index.astro`)

**Hero Section:**
- Illustration-based hero (healthcare/wellness theme, not clinical)
- Headline: "Meet Dr. Sheng Chang" or similar warm intro
- Subheading: Practice location, specialty, welcoming message
- CTA button: "Call Us" with phone number or "Contact Us"
- Height: ~300-400px (mobile-optimized)

**Trust Section:**
- Board certifications (cards or inline)
- Languages spoken
- Hospital affiliations
- Years of experience
- Accepting new patients status (prominent if yes)

**Services Overview:**
- 4 service cards (Family Medicine, Internal Medicine, Preventive Care, Chronic Disease Management)
- Each card: icon + title + 1-2 line description + link to full service page
- Cards in 2x2 grid (desktop), 1 column (mobile)

**Quick Info Section:**
- Hours (weekday/weekend)
- Address + link to map
- Phone + "Call Now" button
- "Insurance Accepted" quick reference

**CTA Section:**
- Large button: "Call Now" or "Contact Us"
- Secondary text: "New patients welcome" or similar

### 2. **About** (`/about.astro`)

**Dr. Sheng Chang's Bio:**
- Professional photo OR illustration (consider illustration for consistency)
- Full credentials: M.D., board certifications, licensing info
- Education: Medical degree, school, year
- Postgraduate training, residency details
- Practice philosophy / approach to medicine

**Board Certifications:**
- American Board of Family Medicine (Certified, current status)
- American Board of Pathology (Certified)
- Detailed table or cards with: board name, specialty, first certified, current status, maintenance status

**Hospital Affiliations:**
- San Gabriel Valley Medical Center
- College Hospital Costa Mesa
- Brief context for why this matters to patients

**Languages & Accessibility:**
- Languages: English, Mandarin
- Commitment to accessibility

### 3. **Services** (`/services.astro`)

**Service Breakdown:**

**Family Medicine**
- What it is, who it's for
- Common conditions treated
- Preventive & wellness focus
- CTA: "Call to schedule"

**Internal Medicine**
- Focus on adult health
- Complex medical management
- CTA: "Call to schedule"

**Preventive Care**
- Physical exams
- Health screenings
- Wellness visits
- CTA: "Call to schedule"

**Chronic Disease Management**
- Managing diabetes, hypertension, etc.
- Ongoing care coordination
- CTA: "Call to schedule"

Each service: heading, description, bullet points, optional illustration

### 4. **Insurance** (`/insurance.astro`)

- List of accepted insurance providers (if available; if not, note "Call to verify your plan")
- Information about payment, billing
- Out-of-pocket questions contact info
- Simple, scannable layout

### 5. **Hours & Location** (`/location.astro`)

**Hours:**
- Weekday: Monday–Friday 9:00 AM – 6:00 PM
- Weekend: Closed Saturday and Sunday
- Any holiday hours noted

**Address:**
- 330 W. Las Tunas Drive, Suite 3, San Gabriel, CA 91776
- Embedded map (Google Maps iframe)
- Parking info if relevant
- Nearby transit / landmarks

**Phone:**
- (626) 573-0055
- "Call Now" button (tel: link)

**Accessibility:**
- Any notes on wheelchair access, etc.

### 6. **Contact** (`/contact.astro`)

**Contact Form:**
- Name, email, phone, message
- Subject line (reason for contact)
- Submit button
- Success message on submit

**Contact Info Display:**
- Phone + "Call Now" button
- Address
- Hours
- Map

**Fallback:**
- If form fails, emphasize phone contact as primary method

---

## Multi-Language Implementation

**Supported Languages:**
- English (en)
- Traditional Chinese (zh-hant)
- Simplified Chinese (zh-hans)

**Routing:**
- English: `/`, `/about`, `/services`, etc.
- Traditional Chinese: `/zh-hant/`, `/zh-hant/about`, etc.
- Simplified Chinese: `/zh-hans/`, `/zh-hans/about`, etc.

**Language Switcher:**
- Header icon (globe or "EN | 繁 | 简")
- Clicking opens dropdown or links directly to same page in other language
- Session/storage persistence (remember user's language choice)

**Content Translation:**
- All UI text, navigation, buttons translated
- Medical information translated clearly (not clinical jargon, patient-friendly)
- Markdown or CMS system for managing translations (existing i18n structure supports this)

---

## Interactive Features

### Font Size Switcher
- Located in header (small icon: `A–` / `A+`)
- 3–5 size levels (default, +1, +2, -1, -2)
- Uses CSS `--font-size-scale` custom property or Tailwind modifier
- Persists in localStorage
- Accessible: keyboard navigation, ARIA labels

### Call-to-Action Button (Mobile)
- Uses `tel:` protocol: `<a href="tel:+16265730055">`
- On mobile: triggers native phone dialer
- On desktop: may open user's default phone/Skype app or show a tooltip
- Prominent button styling (purple background, white text, ≥48px height)
- Available in header (sticky) and throughout page content

### Language Switcher
- Dropdown or link-based toggle
- Shows current language, others as options
- Preserves language choice across sessions

---

## Technical Architecture

### File Structure
```
src/
├── components/
│   ├── Header.astro
│   ├── Navigation.astro
│   ├── MobileNav.astro
│   ├── CallButton.astro
│   ├── FontSizeControl.astro
│   ├── LanguageSwitcher.astro
│   ├── Footer.astro
│   ├── ServiceCard.astro
│   ├── CertificationCard.astro
│   └── HeroSection.astro
├── layouts/
│   └── BaseLayout.astro
├── pages/
│   ├── index.astro (EN home)
│   ├── about.astro
│   ├── services.astro
│   ├── insurance.astro
│   ├── location.astro
│   ├── contact.astro
│   ├── privacy.astro
│   ├── accessibility.astro
│   ├── zh-hans/
│   │   ├── index.astro
│   │   ├── about.astro
│   │   ├── services.astro
│   │   └── ... (other pages)
│   └── zh-hant/
│       ├── index.astro
│       ├── about.astro
│       ├── services.astro
│       └── ... (other pages)
├── data/
│   └── practice.ts (existing: practice info, certifications, etc.)
├── i18n/
│   └── locales.ts (existing: translations)
└── styles/
    └── global.css (global styles, CSS custom properties for font size scale)
```

### Key Components

**Header.astro**
- Sticky header container
- Logo/practice name
- Desktop nav (horizontal links)
- Font size and language controls (icons)
- Call button (CTA)

**Navigation.astro**
- Desktop: horizontal flex nav
- Links: Home, About, Services, Insurance, Hours & Location, Contact

**MobileNav.astro**
- Hamburger toggle state management
- Vertical menu on open
- Links to all pages
- Font size and language controls inline

**CallButton.astro**
- Reusable CTA button component
- Props: text, phone number, size (desktop/mobile)
- Outputs `<a href="tel:...">`
- Styling: purple background, accessible sizing

**FontSizeControl.astro**
- Icon buttons: `A–`, `A`, `A+` (or similar)
- Adjusts CSS custom property `--font-size-scale`
- Persists to localStorage
- Existing component (integrate/refactor as needed)

**LanguageSwitcher.astro**
- Dropdown or toggle showing current language
- Links to same page in other languages
- Existing component (ensure works across all pages)

**ServiceCard.astro**
- Reusable card for services
- Icon, title, description
- Responsive (2 cols desktop, 1 col mobile)

### Styling Approach
- Tailwind CSS (existing setup)
- CSS custom properties for dynamic sizing (`--font-size-scale`)
- Base font size: 1.125rem (18px) — scales with font size control
- Purple primary color for CTAs, accents
- Neutral backgrounds (grays 50–100)
- Clear hierarchy with serif headings, sans-serif body

### Font Size Scaling
```css
:root {
  --font-size-scale: 1; /* 1 = default, 0.9 = -10%, 1.1 = +10% */
}

body {
  font-size: calc(1.125rem * var(--font-size-scale));
  line-height: 1.6;
}

h1 { font-size: calc(2.25rem * var(--font-size-scale)); }
h2 { font-size: calc(1.875rem * var(--font-size-scale)); }
h3 { font-size: calc(1.5rem * var(--font-size-scale)); }
```

---

## Mobile & Responsive Breakpoints

- **Mobile-first approach:** base styles for mobile, media queries for tablet/desktop
- **Breakpoints (Tailwind defaults):** sm (640px), md (768px), lg (1024px), xl (1280px)
- **Touch targets:** min 48px × 48px for buttons/links
- **Safe area:** padding for viewport notches (if needed)
- **Images & illustrations:** responsive, max-width 100%, lazy-loaded

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance
- **Semantic HTML:** `<header>`, `<nav>`, `<main>`, `<footer>`, headings hierarchy
- **Color contrast:** 4.5:1 for normal text, 3:1 for large text
- **Keyboard navigation:** Tab order logical, all interactive elements keyboard-accessible
- **ARIA labels:** icons, buttons, form fields
- **Font size:** base 18px, scalable to 2x (font size control)
- **Focus indicators:** visible outline on keyboard navigation
- **Alt text:** illustrations, icons with descriptive alt or aria-label

### User Experience Accessibility
- **Clear language:** avoid medical jargon, plain English + clear Chinese translations
- **Whitespace:** generous spacing for readability
- **Hierarchy:** clear visual hierarchy (headings, colors, spacing)
- **Forms:** labels associated with inputs, error messages clear
- **Links:** link text descriptive (not "click here")

---

## Content Strategy

### Tone & Voice
- **Warm, professional, trustworthy**
- Patient-focused (speak to their needs, not clinical specs)
- Clear, jargon-free where possible
- Respectful of cultural contexts (appropriate for English and Chinese speakers)

### Information Architecture
1. **Homepage:** build trust quickly, show services, easy contact
2. **About:** credentials, experience, philosophy
3. **Services:** what we do, who it's for
4. **Practical info:** insurance, hours, location, contact

### Call-to-Action Strategy
- **Primary CTA:** "Call Now" — persistent, prominent
- **Secondary CTA:** "Contact Us" — for people who prefer email/form
- **CTAs per page:** at least one above the fold, one in footer

---

## Success Metrics

- ✅ Mobile usability: all pages fully responsive, touch-friendly
- ✅ Multi-language: all pages translate correctly, language switcher works
- ✅ Performance: load time <3s on 4G mobile
- ✅ Accessibility: WCAG 2.1 AA pass rate 100%
- ✅ Conversion:** clear calls-to-action, multiple contact methods visible
- ✅ Qualifications visible:** board certifications, education, affiliations easily found

---

## Notes

- **Existing Components:** FontSizeControl and LanguageSwitcher already built; refactor/integrate into new header
- **Illustrations:** sourced from stock (Unsplash, Pexels) or custom commissioned if budget allows; healthcare/wellness theme
- **No booking:** site is informational + contact; no appointment scheduling needed
- **Multi-language consistency:** all pages and functionality translated; test Chinese translations with native speaker if possible
- **Privacy & Accessibility pages:** already exist; update footer links to point to them

---

## Implementation Order

1. Build Header / Navigation (desktop & mobile)
2. Build HomePage (hero, services, trust section, CTAs)
3. Build About, Services, Insurance, Location, Contact pages
4. Multi-language integration (test all routes)
5. Font size scaling integration
6. Testing (mobile, accessibility, languages)
7. Deploy & iterate

