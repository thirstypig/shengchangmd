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
    language: 'Language',
    changeLanguage: 'Change language',
    contactUs: 'Contact us',
    callOffice: 'Call office',
    serviceCards: {
      familyMedicine: 'Family Medicine',
      chronicDiseaseManagement: 'Chronic Disease Management',
      preventiveCare: 'Preventive Care',
      internalMedicine: 'Internal Medicine',
    },
    footer: {
      hours: 'Hours',
      address: 'Address',
      phone: 'Phone',
      license: 'California Medical License',
      officeInformation: 'Office Information',
      professional: 'Professional',
      legal: 'Legal',
      rightsReserved: 'All rights reserved.',
      privacy: 'Privacy Policy',
      accessibility: 'Accessibility Statement',
    },
    notFound: 'Page not found',
    hoursWeekday: 'Monday–Friday 9:00 AM – 12:00 PM',
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
    language: '語言',
    contactUs: '聯絡我們',
    callOffice: '致電診所',
    serviceCards: {
      familyMedicine: '家庭醫學',
      chronicDiseaseManagement: '慢性病管理',
      preventiveCare: '預防保健',
      internalMedicine: '內科醫學',
    },
    footer: {
      hours: '門診時間',
      address: '地址',
      phone: '電話',
      license: '加州醫療執照',
      officeInformation: '診所資訊',
      professional: '專業資格',
      legal: '法律',
      rightsReserved: '版權所有。',
      privacy: '隱私政策',
      accessibility: '無障礙說明',
    },
    notFound: '頁面未找到',
    hoursWeekday: '週一至週五 上午9:00 – 中午12:00',
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
    language: '语言',
    contactUs: '联络我们',
    callOffice: '致电诊所',
    serviceCards: {
      familyMedicine: '家庭医学',
      chronicDiseaseManagement: '慢性病管理',
      preventiveCare: '预防保健',
      internalMedicine: '内科医学',
    },
    footer: {
      hours: '门诊时间',
      address: '地址',
      phone: '电话',
      license: '加州医疗执照',
      officeInformation: '诊所信息',
      professional: '专业资格',
      legal: '法律',
      rightsReserved: '版权所有。',
      privacy: '隐私政策',
      accessibility: '无障碍说明',
    },
    notFound: '页面未找到',
    hoursWeekday: '周一至周五 上午9:00 – 中午12:00',
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

  return value || key;
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

  - `practice.education.residency` ("University of Alabama Hospital") and
    `practice.hospitalAffiliations` (San Gabriel Valley Medical Center, College
    Hospital Costa Mesa) are US institutions with no established Chinese name.
    Patients and USCIS paperwork cite them in English. Translating them would
    invent a name nobody uses.
  - `practice.doctorName` ("Sheng Chang, M.D.") stays English in the portrait
    caption beneath the Chinese headline 張勝雄 醫師 — showing both is the point.
  - `education.school` IS localised, because 國立臺灣大學醫學院 is the
    institution's own name, not a translation of the English one.

  The test is not "is it a proper noun" but "does this entity have a real name in
  the target language that readers would expect".
*/
export const practiceLocalized = {
  en: {
    licenseStatus: 'License Renewed & Current',
    licenseExpires: 'July 31, 2028',
    languages: ['English', 'Mandarin'],
    postgraduateTraining: 'Three years of postgraduate training',
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
  },
  'zh-hant': {
    licenseStatus: '執照已更新，現行有效',
    licenseExpires: '2028年7月31日',
    languages: ['英語', '國語'],
    postgraduateTraining: '三年畢業後醫學訓練',
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
  },
  'zh-hans': {
    licenseStatus: '执照已续期，现行有效',
    licenseExpires: '2028年7月31日',
    languages: ['英语', '普通话'],
    postgraduateTraining: '三年毕业后医学培训',
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
  },
};

export function getPracticeLocalized(locale: string) {
  return (
    practiceLocalized[locale as keyof typeof practiceLocalized] ?? practiceLocalized.en
  );
}
