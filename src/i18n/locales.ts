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
    // Patient scope and accepted coverage, both supplied in writing by the
    // practice owner on 2026-08-06.
    //
    // `confirmNote` is load-bearing and must render with the coverage list, not
    // below the fold. "HMO" and "PPO" name plan STRUCTURES, not networks, so an
    // unqualified list would mislead a patient whose HMO has no contract here -
    // the same harm as the fabricated eight-carrier list removed on 2026-08-05.
    // Carrier names, carrier logos and "most major plans" phrasing stay banned.
    patientScope: {
      heading: 'Who we see',
      adults: 'Adults aged 18 and over',
      seniors: 'Seniors aged 65 and over',
      noMinors:
        'We do not see patients under 18. Please ask us and we will point you to a paediatric practice.',
      noObGyn: 'We do not provide gynaecology or obstetric care.',
      referrals:
        'We refer to specialists where it is indicated. Some referrals need prior authorisation from your plan, and we will tell you if yours does.',
      stemCellAppointment: 'Stem cell therapy is by appointment only.',
      // Compact form for the homepage, where it qualifies the "Accepting New
      // Patients" badge. The badge is an invitation, and the invitation is the
      // exact place the limit has to appear: a parent reading "family medicine"
      // and "accepting new patients" has already decided to call. The full list
      // stays on /services/#who-we-see, linked.
      summary:
        'We see adults 18 and over. We do not see patients under 18, and we do not provide gynaecology or obstetric care.',
      linkLabel: 'Who we see',
    },
    coverage: {
      heading: 'Coverage we work with',
      confirmNote:
        'Plan names are not the whole picture — whether your particular plan is contracted with this office depends on the network. Call before your visit with your card to hand and we will confirm it and tell you what you will pay.',
      medicare: 'Medicare (the red, white and blue card)',
      mediCal: 'Medi-Cal (the white card)',
      hmo: 'HMO plans',
      ppo: 'PPO plans',
      privateInsurance: 'Private insurance',
      cash: 'Cash and self-pay',
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
    patientScope: {
      heading: '看診對象',
      adults: '18 歲以上成人',
      seniors: '65 歲以上長者',
      noMinors: '本診所不看 18 歲以下患者。歡迎來電，我們可為您介紹兒科診所。',
      noObGyn: '本診所不提供婦科及產科服務。',
      referrals:
        '如有需要，我們會轉介專科醫師。部分轉介需保險公司事先核准，屆時我們會告知您。',
      stemCellAppointment: '幹細胞治療採預約制。',
      summary:
        '本診所看診對象為 18 歲以上成人，不看 18 歲以下患者，亦不提供婦科及產科服務。',
      linkLabel: '看診對象說明',
    },
    coverage: {
      heading: '合作的保險與付款方式',
      confirmNote:
        '保險名稱並非全部——您的保險方案是否與本診所簽約，取決於網路內容。就診前請攜保險卡來電，我們會為您確認並說明費用。',
      medicare: 'Medicare（紅白藍卡）',
      mediCal: 'Medi-Cal（白卡）',
      hmo: 'HMO 保險',
      ppo: 'PPO 保險',
      privateInsurance: '私人保險',
      cash: '現金自費',
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
    patientScope: {
      heading: '看诊对象',
      adults: '18 岁以上成人',
      seniors: '65 岁以上长者',
      noMinors: '本诊所不看 18 岁以下患者。欢迎来电，我们可为您介绍儿科诊所。',
      noObGyn: '本诊所不提供妇科及产科服务。',
      referrals:
        '如有需要，我们会转介专科医师。部分转介需保险公司事先核准，届时我们会告知您。',
      stemCellAppointment: '干细胞治疗采预约制。',
      summary:
        '本诊所看诊对象为 18 岁以上成人，不看 18 岁以下患者，亦不提供妇科及产科服务。',
      linkLabel: '看诊对象说明',
    },
    coverage: {
      heading: '合作的保险与付款方式',
      confirmNote:
        '保险名称并非全部——您的保险方案是否与本诊所签约，取决于网路内容。就诊前请携保险卡来电，我们会为您确认并说明费用。',
      medicare: 'Medicare（红白蓝卡）',
      mediCal: 'Medi-Cal（白卡）',
      hmo: 'HMO 保险',
      ppo: 'PPO 保险',
      privateInsurance: '私人保险',
      cash: '现金自费',
    },
    footer: {
      hours: '门诊时间',
      address: '地址',
      phone: '电话',
      officeInformation: '诊所资讯',
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
    caption beneath the Chinese headline 張勝雄醫師 — showing both is the point.
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
