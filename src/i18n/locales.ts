// Relative, NOT the @data alias. astro.config.mjs imports this module while
// loading its own config, before Vite registers path aliases, so an aliased
// import here fails the build with "Unable to load your Astro config" — while
// tsc and vitest both still pass, because they resolve aliases from tsconfig.
import { practice } from '../data/practice';

export interface LocaleMetadata {
  code: string;
  name: string;
  nativeName: string;
  /** Compact label for the header switcher, where horizontal space is tight. */
  shortName: string;
  reviewed: boolean;
}

export const locales: Record<string, LocaleMetadata> = {
  en: {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    shortName: 'EN',
    reviewed: true,
  },
  'zh-hant': {
    code: 'zh-Hant',
    name: '繁體中文',
    nativeName: '繁體中文',
    shortName: '繁體',
    reviewed: false,
  },
  'zh-hans': {
    code: 'zh-Hans',
    name: '簡體中文',
    nativeName: '簡體中文',
    shortName: '简体',
    reviewed: false,
  },
};

export const translations = {
  en: {
    skipToContent: 'Skip to content',
    decreaseTextSize: 'Decrease text size',
    resetTextSize: 'Reset text size',
    increaseTextSize: 'Increase text size',
    textSize: 'Text size',
    toggleTheme: 'Switch between light and dark theme',
    toggleNavigation: 'Toggle navigation menu',
    language: 'Language',
    changeLanguage: 'Change language',
    contactUs: 'Contact us',
    callOffice: 'Call office',
    serviceCards: {
      familyMedicine: 'Family Medicine',
      immigrationExams: 'Immigration Medical Services',
      citizenshipWaiver: 'Citizenship Exam Waiver Medical Evaluation Report',
      medicalLegal: 'Medical-Legal Reports',
      stemCell: 'Stem Cell Therapy',
    },
    footer: {
      hours: 'Hours',
      address: 'Address',
      phone: 'Phone',
      officeInformation: 'Office Information',
      legal: 'Legal',
      rightsReserved: 'All rights reserved.',
      privacy: 'Privacy Policy',
      accessibility: 'Accessibility Statement',
      // Non-empty on purpose, even though English readers never see it:
      // getTranslation() does `value || key`, so an empty string here is
      // falsy and falls through to returning the literal key
      // "footer.englishOnly" — confirmed by building and grepping dist/,
      // which rendered that literal text on every English page. BaseLayout
      // guards this key behind `locale !== 'en'` instead, so this value is
      // never actually rendered; it exists only so the key isn't empty.
      englishOnly: '(English)',
    },
    notFound: 'Page not found',
    hoursWeekday: practice.hours.weekday,
    hoursWeekend: 'Closed Saturday and Sunday',
    home: 'Home',
    about: 'About',
    services: 'Services',
    insurance: 'Insurance',
    hoursLocation: 'Hours & Location',
    contact: 'Contact',
    privacy: 'Privacy Policy',
    accessibility: 'Accessibility Statement',
  },
  'zh-hant': {
    skipToContent: '跳到主要內容',
    decreaseTextSize: '減小文字大小',
    resetTextSize: '重設文字大小',
    increaseTextSize: '增加文字大小',
    textSize: '文字大小',
    changeLanguage: '更改語言',
    toggleTheme: '切換淺色或深色主題',
    toggleNavigation: '開啟或關閉導覽選單',
    language: '語言',
    contactUs: '聯絡我們',
    callOffice: '致電診所',
    serviceCards: {
      familyMedicine: '家庭醫學',
      immigrationExams: '移民醫療服務',
      citizenshipWaiver: '公民入籍考試豁免醫療評估報告',
      medicalLegal: '醫療法律報告',
      stemCell: '幹細胞治療',
    },
    footer: {
      hours: '門診時間',
      address: '地址',
      phone: '電話',
      officeInformation: '診所資訊',
      legal: '法律',
      rightsReserved: '版權所有。',
      privacy: '隱私政策',
      accessibility: '無障礙說明',
      englishOnly: '（英文）',
    },
    notFound: '頁面未找到',
    hoursWeekday: '週一至週五 上午9:00 – 下午1:00',
    hoursWeekend: '週六、週日休診',
    home: '首頁',
    about: '關於我們',
    services: '服務',
    insurance: '保險',
    hoursLocation: '門診時間與位置',
    contact: '聯絡',
    privacy: '隱私政策',
    accessibility: '無障礙說明',
  },
  'zh-hans': {
    skipToContent: '跳到主要内容',
    decreaseTextSize: '减小文字大小',
    resetTextSize: '重设文字大小',
    increaseTextSize: '增加文字大小',
    textSize: '文字大小',
    changeLanguage: '更改语言',
    toggleTheme: '切换浅色或深色主题',
    toggleNavigation: '打开或关闭导航菜单',
    language: '语言',
    contactUs: '联络我们',
    callOffice: '致电诊所',
    serviceCards: {
      familyMedicine: '家庭医学',
      immigrationExams: '移民医疗服务',
      citizenshipWaiver: '公民入籍考试豁免医疗评估报告',
      medicalLegal: '医疗法律报告',
      stemCell: '干细胞治疗',
    },
    footer: {
      hours: '门诊时间',
      address: '地址',
      phone: '电话',
      officeInformation: '诊所信息',
      legal: '法律',
      rightsReserved: '版权所有。',
      privacy: '隐私政策',
      accessibility: '无障碍说明',
      englishOnly: '（英文）',
    },
    notFound: '页面未找到',
    hoursWeekday: '周一至周五 上午9:00 – 下午1:00',
    hoursWeekend: '周六、周日休诊',
    home: '首页',
    about: '关于我们',
    services: '服务',
    insurance: '保险',
    hoursLocation: '门诊时间与位置',
    contact: '联络',
    privacy: '隐私政策',
    accessibility: '无障碍说明',
  },
};

export function getTranslation(locale: string, key: string): string {
  const lang = locale as keyof typeof translations;
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  // `??`, not `||`. An empty string is a legitimate translated value — a marker
  // that should be blank in one locale and present in others — and `||` treats
  // it as absent, returning the key. That shipped: a footer key with an empty
  // `en` value rendered the literal text "footer.englishOnly" on every English
  // page while npm test stayed green. `?.[k]` only ever yields undefined for a
  // missing key, never '', so `??` still falls back correctly for real misses.
  return value ?? key;
}

/**
 * Localised counterparts for the English-only values in `src/data/practice.ts`.
 *
 * practice.ts is the single source of truth for the facts, but its strings are
 * English. Rendering them directly on a Chinese page produced sentences that
 * code-switched mid-clause — "License Renewed & Current" under a Chinese
 * heading, "English"/"Mandarin" in the languages list, "Certified" as a status.
 * Look values up here instead, keyed on the English value so the two cannot
 * drift apart silently.
 */
/*
  Deliberately NOT localised, and why — recorded so these stop reading as
  oversights the next time someone audits for English on Chinese pages:

  - `practice.doctorName` ("Sheng Chang, M.D., Ph.D.") stays English in the portrait
    caption beneath the Chinese headline 張勝雄 醫師 — showing both is the point.
  - `education.school` IS localised, because 國立臺灣大學醫學院 is the
    institution's own name, not a translation of the English one.
  - Form numbers (I-693, N-648) stay as-is in every locale. They are USCIS
    identifiers, not words; a patient has to write the same string on the form.

  The test is not "is it a proper noun" but "does this entity have a real name in
  the target language that readers would expect".

  `licenseStatus` was restored 2026-08-06 alongside the source field in
  practice.ts. `licenseExpires` stays removed. `postgraduateTraining` is
  rendered in English on the Chinese pages for now — institution names
  ("University of Alabama Medical Center") have no established Chinese form
  here, and inventing one would be worse than leaving it. Revisit with a
  fluent reader.
*/
export const practiceLocalized = {
  en: {
    languages: ['English', 'Mandarin', 'Cantonese', 'Spanish', 'Vietnamese'],
    school: 'National Taiwan University College of Medicine',
    specialties: {
      'Family Medicine': 'Family Medicine',
      'Anatomic Pathology & Clinical Pathology': 'Anatomic Pathology & Clinical Pathology',
    } as Record<string, string>,
    boards: {
      'American Board of Family Medicine': 'American Board of Family Medicine',
      'American Board of Pathology': 'American Board of Pathology',
    } as Record<string, string>,
    certStatus: { Certified: 'Certified' } as Record<string, string>,
    licenseStatus: { Active: 'Active' } as Record<string, string>,
  },
  'zh-hant': {
    languages: ['英語', '國語', '粵語', '西班牙語', '越南語'],
    // A Taiwanese institution with an established Chinese name — should never
    // appear transliterated or in English on a Chinese page.
    school: '國立臺灣大學醫學院',
    specialties: {
      'Family Medicine': '家庭醫學',
      'Anatomic Pathology & Clinical Pathology': '解剖病理學與臨床病理學',
    } as Record<string, string>,
    boards: {
      'American Board of Family Medicine': '美國家庭醫學專科委員會',
      'American Board of Pathology': '美國病理學專科委員會',
    } as Record<string, string>,
    certStatus: { Certified: '認證有效' } as Record<string, string>,
    licenseStatus: { Active: '有效' } as Record<string, string>,
  },
  'zh-hans': {
    languages: ['英语', '普通话', '粤语', '西班牙语', '越南语'],
    school: '国立台湾大学医学院',
    specialties: {
      'Family Medicine': '家庭医学',
      'Anatomic Pathology & Clinical Pathology': '解剖病理学与临床病理学',
    } as Record<string, string>,
    boards: {
      'American Board of Family Medicine': '美国家庭医学专科委员会',
      'American Board of Pathology': '美国病理学专科委员会',
    } as Record<string, string>,
    certStatus: { Certified: '认证有效' } as Record<string, string>,
    licenseStatus: { Active: '有效' } as Record<string, string>,
  },
};

export function getPracticeLocalized(locale: string) {
  return (
    practiceLocalized[locale as keyof typeof practiceLocalized] ?? practiceLocalized.en
  );
}
