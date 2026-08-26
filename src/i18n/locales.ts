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
    primaryNavigation: 'Main navigation',
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
        'We do not see patients under 18. Please ask us and we will point you to a pediatric practice.',
      noObGyn: 'We do not provide gynecology or obstetric care.',
      referrals:
        'We refer to specialists where it is indicated. Some referrals need prior authorization from your plan, and we will tell you if yours does.',
      stemCellAppointment: 'Stem cell therapy is by appointment only.',
      // Compact form for the homepage, where it qualifies the "Accepting New
      // Patients" badge. The badge is an invitation, and the invitation is the
      // exact place the limit has to appear: a parent reading "family medicine"
      // and "accepting new patients" has already decided to call. The full list
      // stays on /services/#who-we-see, linked.
      summary:
        'We see adults 18 and over. We do not see patients under 18, and we do not provide gynecology or obstetric care.',
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
    communityPhotos: {
      photo1:
        'Congressional Proclamation of Excellence, Achievement and Commitment presented to Dr. Sheng H. Chang, November 4, 1988',
      photo2:
        'County of Los Angeles Commendation to Dr. Sheng H. Chang as founding president of the Arcadia Chinese Association, 1988',
      photo3: 'Certificate of Commendation presented to Dr. Sheng H. Chang, 1988',
      photo4:
        'Certificate of Appreciation from the Alumni Association of Tainan First High School of Southern California, 2005',
      photo5: 'Dr. Chang speaking at a Chinese community banquet, 1987',
      photo6: 'Dr. Chang at a welcome reception for overseas Chinese community leaders',
      photo7: 'Dr. Chang presenting a plaque at a community event, 1989',
      photo8: 'Dr. Chang speaking at a Chinese culture and education symposium',
      photo9:
        'Dr. Chang at the groundbreaking for the Arcadia Police Department, with the City of Arcadia City Council',
      photo10:
        'Groundbreaking for the Arcadia Public Library renovation and addition, with Dr. Chang listed as a City Council member',
      photo11: 'Dr. Chang in the Arcadia City Council chambers',
      photo12: 'Dr. Chang at a City Council meeting table in the Arcadia City Council chambers',
      photo13:
        'Newspaper clipping of Dr. Chang receiving a plaque as director of the Southern California Chinese Culture Promotion Center',
      photo14:
        'Dr. Chang speaking at an Arcadia Chinese Association and Chinese School Lunar New Year celebration',
      photo15:
        'Dr. Chang speaking at a Southern California National Taiwan University Medical Alumni Association Lunar New Year celebration',
      photo16:
        'Newspaper clipping, "Doctor helps immigrants adjust," on Dr. Chang\'s influence in Arcadia\'s Asian community',
      photo17:
        'Newspaper clipping, "AAUW features noted Chinese leader," featuring Mrs. Mey Chang as a speaker on Chinese culture',
      heading: 'Certificates & Recognition',
      intro:
        "A selection of certificates and photographs from Dr. Chang's community involvement.",
    },
    footer: {
      hours: 'Hours',
      address: 'Address',
      phone: 'Phone',
      officeInformation: 'Office Information',
      legal: 'Legal',
      connect: 'Connect',
      wechatQr: 'WeChat QR code',
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
    /*
      Moved out of the shared components 2026-08-10. HeroSection.astro,
      StickyCallBar.astro and Header.astro each kept their own locale map here,
      a second translation system beside this one — and it had already drifted:
      HeroSection said 医生 while every page said 醫師/医师, and it survived a
      sweep of the pages because the sweep read the pages and this file.

      Neither i18n guard could see them. locale-coverage reads `translations`,
      so a key that never reached this file was outside it; shared-component-
      labels matches literal aria-label/title/alt/data-label attributes, and
      those were object properties. Header used ternaries rather than an object,
      so it was missed twice more.

      Living here, they are covered by every existing guard for free — including
      taiwan-register's cross-locale parity, which reads this file.

      `stickyCall.aria` carries a {phone} placeholder rather than the number
      itself. source-integrity fails the build if the office phone appears
      anywhere outside practice.ts, and it is right to.
    */
    hero: {
      cta: 'Call Us Today',
      placeholder: 'Photograph placeholder',
      boardCertified: 'Board-Certified Family Physician',
      acceptingPatients: 'Accepting new patients',
    },
    stickyCall: {
      label: 'Call for an appointment',
      aria: 'Call {phone} for an appointment',
    },
    header: {
      tagline: 'Family Medicine',
      callLabel: 'Call Now',
    },
    notFound: 'Page not found',
    hoursWeekday: practice.hours.weekday,
    hoursWeekend: 'Closed Saturday and Sunday',
    logoAlt: 'Sheng Chang, M.D., Ph.D. — home',
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
    primaryNavigation: '主要導覽',
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
    communityPhotos: {
      photo1: '美國國會眾議院於1988年11月4日頒發張勝雄醫師傑出成就與貢獻褒揚狀',
      photo2:
        '洛杉磯郡政府於1988年頒發張勝雄醫師褒揚狀，表彰其擔任 Arcadia Chinese Association 創會會長之貢獻',
      photo3: '1988年頒發張勝雄醫師之褒揚狀',
      photo4: '2005年南加州台南一中校友會頒發張勝雄醫師感謝狀',
      photo5: '張醫師於1987年在僑界宴會上致詞',
      photo6: '張醫師出席歡迎僑團首長回國致敬活動',
      photo7: '張醫師於1989年在社區活動中頒發獎牌',
      photo8: '張醫師於中華文化推廣中心文教育研討會上致詞',
      photo9: '張醫師與 Arcadia 市議會出席 Arcadia 警察總部動土典禮',
      photo10: 'Arcadia 公共圖書館擴建動土典禮看板，看板上列出張醫師為市議員之一',
      photo11: '張醫師於 Arcadia 市議會會議室',
      photo12: '張醫師於 Arcadia 市議會會議桌前',
      photo13: '報紙剪報：張醫師以南加州中華文化推廣中心主任身分獲頒獎牌',
      photo14: '張醫師於 Arcadia 華人聯誼會暨中文學校慶祝新春聯歡晚會上致詞',
      photo15: '張醫師於南加州台大醫學院校友會慶祝新春聯歡晚會上致詞',
      photo16: '報紙剪報〈Doctor helps immigrants adjust〉，報導張醫師對 Arcadia 亞裔社區的影響',
      photo17: '報紙剪報〈AAUW features noted Chinese leader〉，報導張夫人 Mey Chang 主講中華文化講座',
      heading: '獎狀與表彰',
      intro: '精選張醫師參與社區服務期間所獲頒的獎狀，以及活動照片。',
    },
    footer: {
      hours: '門診時間',
      address: '地址',
      phone: '電話',
      officeInformation: '診所資訊',
      legal: '法律',
      connect: '聯絡',
      wechatQr: 'WeChat QR 碼',
      rightsReserved: '版權所有。',
      privacy: '隱私政策',
      accessibility: '無障礙說明',
      englishOnly: '（英文）',
    },
    hero: {
      cta: '立即致電',
      placeholder: '照片預留位置',
      boardCertified: '家庭醫學專科醫師',
      acceptingPatients: '現正接受新患者',
    },
    stickyCall: {
      label: '電話預約',
      aria: '致電 {phone} 預約看診',
    },
    header: {
      tagline: '家庭醫學',
      callLabel: '致電',
    },
    notFound: '頁面未找到',
    hoursWeekday: '週一至週五 上午9:00 – 下午1:00',
    hoursWeekend: '週六、週日休診',
    logoAlt: '張勝雄醫師 — 首頁',
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
    primaryNavigation: '主要导览',
    toggleNavigation: '开启或关闭导览选单',
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
    communityPhotos: {
      photo1: '美国国会众议院于1988年11月4日颁发张胜雄医师杰出成就与贡献褒扬状',
      photo2:
        '洛杉矶郡政府于1988年颁发张胜雄医师褒扬状，表彰其担任 Arcadia Chinese Association 创会会长之贡献',
      photo3: '1988年颁发张胜雄医师之褒扬状',
      photo4: '2005年南加州台南一中校友会颁发张胜雄医师感谢状',
      photo5: '张医师于1987年在侨界宴会上致词',
      photo6: '张医师出席欢迎侨团首长回国致敬活动',
      photo7: '张医师于1989年在社区活动中颁发奖牌',
      photo8: '张医师于中华文化推广中心文教育研讨会上致词',
      photo9: '张医师与 Arcadia 市议会出席 Arcadia 警察总部动土典礼',
      photo10: 'Arcadia 公共图书馆扩建动土典礼看板，看板上列出张医师为市议员之一',
      photo11: '张医师于 Arcadia 市议会会议室',
      photo12: '张医师于 Arcadia 市议会会议桌前',
      photo13: '报纸剪报：张医师以南加州中华文化推广中心主任身分获颁奖牌',
      photo14: '张医师于 Arcadia 华人联谊会暨中文学校庆祝新春联欢晚会上致词',
      photo15: '张医师于南加州台大医学院校友会庆祝新春联欢晚会上致词',
      photo16: '报纸剪报〈Doctor helps immigrants adjust〉，报导张医师对 Arcadia 亚裔社区的影响',
      photo17: '报纸剪报〈AAUW features noted Chinese leader〉，报导张夫人 Mey Chang 主讲中华文化讲座',
      heading: '奖状与表彰',
      intro: '精选张医师参与社区服务期间所获颁的奖状，以及活动照片。',
    },
    footer: {
      hours: '门诊时间',
      address: '地址',
      phone: '电话',
      officeInformation: '诊所资讯',
      legal: '法律',
      connect: '联络',
      wechatQr: 'WeChat QR 码',
      rightsReserved: '版权所有。',
      privacy: '隐私政策',
      accessibility: '无障碍说明',
      englishOnly: '（英文）',
    },
    hero: {
      cta: '立即致电',
      placeholder: '照片预留位置',
      boardCertified: '家庭医学专科医师',
      acceptingPatients: '现正接受新患者',
    },
    stickyCall: {
      label: '电话预约',
      aria: '致电 {phone} 预约看诊',
    },
    header: {
      tagline: '家庭医学',
      callLabel: '致电',
    },
    notFound: '页面未找到',
    hoursWeekday: '周一至周五 上午9:00 – 下午1:00',
    hoursWeekend: '周六、周日休诊',
    logoAlt: '张胜雄医师 — 首页',
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
 * Localized counterparts for the English-only values in `src/data/practice.ts`.
 *
 * practice.ts is the single source of truth for the facts, but its strings are
 * English. Rendering them directly on a Chinese page produced sentences that
 * code-switched mid-clause — "License Renewed & Current" under a Chinese
 * heading, "English"/"Mandarin" in the languages list, "Certified" as a status.
 * Look values up here instead, keyed on the English value so the two cannot
 * drift apart silently.
 */
/*
  Deliberately NOT localized, and why — recorded so these stop reading as
  oversights the next time someone audits for English on Chinese pages:

  - `practice.doctorName` ("Sheng Chang, M.D., Ph.D.") stays English in the portrait
    caption beneath the Chinese headline 張勝雄醫師 — showing both is the point.
  - `education.school` IS localized, because 國立臺灣大學醫學院 is the
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
    languages: ['英语', '国语', '粤语', '西班牙语', '越南语'],
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
