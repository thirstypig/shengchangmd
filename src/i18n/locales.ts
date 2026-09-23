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
  /**
   * Open Graph locale. A different format from `code` on purpose: og:locale
   * takes language_TERRITORY (en_US), not a BCP 47 tag. This used to emit
   * `code` directly, so the Chinese pages declared og:locale="zh-Hant", which
   * no Open Graph consumer recognizes.
   *
   * zh-hans maps to zh_CN because Open Graph has no simplified-script value
   * without a territory. That describes the script, not the reader — the
   * copy is still Taiwan wording, per the trilingual-content skill.
   */
  ogLocale: string;
  reviewed: boolean;
}

export const locales: Record<string, LocaleMetadata> = {
  en: {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    shortName: 'EN',
    ogLocale: 'en_US',
    reviewed: true,
  },
  'zh-hant': {
    code: 'zh-Hant',
    name: '繁體中文',
    nativeName: '繁體中文',
    shortName: '繁體',
    ogLocale: 'zh_TW',
    // Indexing turned ON 2026-09-22 at the owner's instruction ("just publish
    // Chinese and English now"), ahead of Dr. Chang's read. This reverses the
    // 2026-09-14 decision to wait for him. The Chinese copy is machine-assisted
    // Taiwan Mandarin, reviewed only by the guards in this repo; his
    // corrections will land on live, indexed pages.
    reviewed: true,
  },
  'zh-hans': {
    code: 'zh-Hans',
    name: '簡體中文',
    nativeName: '簡體中文',
    shortName: '简体',
    ogLocale: 'zh_CN',
    // Indexing turned ON 2026-09-22; see the note on zh-hant above.
    reviewed: true,
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
    immigrationExam: {
      factsHeading: 'At a glance',
      faqHeading: 'Frequently asked questions',
      physicianLabel: 'Physician',
      designationLabel: 'Designation',
      designationValue: 'USCIS-designated civil surgeon',
      addressLabel: 'Address',
      hoursLabel: 'Hours',
      appointmentsLabel: 'Appointments',
      appointmentOnly: 'By appointment only',
      feeLabel: 'Fee',
      feeUnknown: 'One flat fee. Call for the current price.',
      feeKnown: 'One flat fee of {amount}',
      languagesLabel: 'Languages',
      languagesValue: 'Dr. Chang explains results in English or Mandarin. Our office speaks {languages}.',
      whoLabel: 'Who we see',
      vaccinesLabel: 'Vaccines',
      vaccinesYes: 'Given in the office',
      vaccinesNo: 'Not given in the office',
      visitsLabel: 'Visits',
      visitsValue: 'Usually {n} visits',
      faqAppointmentQ: 'Do I need an appointment?',
      faqAppointmentA: 'Yes. Immigration medical exams are by appointment only. Please call the office to book.',
      faqLanguagesQ: 'Which languages can I use?',
      faqLanguagesA: 'Dr. Chang explains your results in English or Mandarin. Our office speaks {languages}.',
      faqCostQ: 'How much does the exam cost?',
      faqCostA: 'The exam is one flat fee. Please call the office for the current price.',
      faqChildrenQ: 'Do you examine children?',
      faqChildrenA:
        'No. We see adults 18 and over. For a child, use the USCIS Find a Civil Surgeon tool to find a civil surgeon who sees children.',
    },
    whatToBring: {
      photoId: "A valid government-issued photo ID, such as your unexpired passport or driver's license",
      vaccinationRecords: 'Your vaccination records',
      otherRecords: 'Any other medical records you have',
      formBeforeLink:
        'Form I-693 with Part 1 filled in. Do not sign it yet: you must sign it in front of Dr. Chang. Download the current edition from ',
      formAfterLink: '; USCIS accepts only the edition in use when the doctor signs.',
    },
    articles: {
      whatToBringTitle: 'What to bring to your I-693 exam',
      whatToBringSummary:
        'The documents to bring to your immigration medical exam, and how to prepare Form I-693 before you arrive.',
      reviewedLine:
        'Drafted with AI assistance from the official sources listed above. Medically reviewed by {doctor}, on {date}.',
      draftLine: 'Drafted with AI assistance from the official sources listed above.',
      howWeWriteLink: 'How we write these articles',
      sourcesHeading: 'Sources',
      sourcesChecked: 'Sources checked {date}.',
      indexTitle: 'Articles',
      indexIntro:
        'Plain-language guides to immigration medical exams and the paperwork around them, written from official sources. Each article states whether Dr. Chang has reviewed it.',
      reviewedOn: 'Reviewed {date}',
      notYetReviewed: 'Awaiting review',
      methodTitle: 'How we write these articles',
      methodSources:
        'Every article explains a process (an exam, a form, a kind of coverage) using official sources only: U.S. Citizenship and Immigration Services (USCIS), the Centers for Disease Control and Prevention (CDC), the Centers for Medicare & Medicaid Services (CMS), and the California Department of Health Care Services (DHCS). Each article lists its sources and the date we last checked them.',
      methodAi: 'Drafts are written with the help of AI, working from those sources.',
      methodReview:
        "When an article has been reviewed, that review happens in two steps: the practice checks that it matches how our office works, and Dr. Chang checks it for medical and regulatory accuracy. The review date on an article is the date of his review. An article with no \"Medically reviewed by\" line has not yet been reviewed by a physician.",
      methodNotPublished:
        'We do not publish prices or office scheduling details here. Please call the office at {phone} and we will answer directly.',
      methodNotAdvice: 'These articles are general information, not medical advice for your situation.',
      methodErrors: 'If you find an error, please call {phone} or email {email}.',
      fullGuideLink: 'Full guide: what to bring to your I-693 exam',
      validityTitle: 'How long your I-693 is good for, and when to file it',
      validitySummary:
        'What USCIS says about how long Form I-693 stays valid, why the form instructions still say two years, and when to file the form with your Form I-485.',
      validityLink: 'Also read: how long your I-693 is good for, and when to file it',
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
      photo18:
        'Dr. Chang speaking at a banquet welcoming a visiting Inner Mongolia government forestry delegation, January 1998',
      photo19:
        "Arcadia Chamber of Commerce plaque recognizing Dr. Chang's first term on the Arcadia City Council, 1994-1998",
      photo20:
        "Arcadia Chamber of Commerce plaque recognizing Dr. Chang's service as Mayor during Arcadia's Centennial Year, 2003",
      photo21:
        "Arcadia Chamber of Commerce plaque recognizing Dr. Chang's second term on the Arcadia City Council, 2000-2004",
      photo22:
        "Gavel plaque presented to Dr. Chang in recognition of his service as Mayor of Arcadia, April-July 2003",
      heading: 'Certificates & Recognition',
      intro:
        "A selection of certificates and photographs from Dr. Chang's community involvement.",
    },
    gallery: {
      close: 'Close',
      previous: 'Previous photo',
      next: 'Next photo',
      viewer: 'Photo viewer',
    },
    footer: {
      hours: 'Hours',
      address: 'Address',
      phone: 'Phone',
      officeInformation: 'Office Information',
      legal: 'Legal',
      connect: 'Connect',
      wechatQr: 'WeChat QR code',
      // The visible caption under the footer QR code. It was a literal in
      // WeChatQR.astro and rendered in English on all sixteen Chinese pages;
      // shared-component-labels only inspects attributes, not text nodes.
      wechatScan: 'Scan to chat on WeChat',
      rightsReserved: 'All rights reserved.',
      privacy: 'Privacy Policy',
      accessibility: 'Accessibility Statement',
      site: 'Site',
      articles: 'Articles',
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
      // Second line of the home page <h1>, under the name. The owner asked on
      // 2026-08-19 for the headline to read "Sheng Chang, M.D.", and it still
      // does; this adds what the practice is and where, which the <h1> — the
      // strongest on-page signal a search engine reads — did not say at all.
      tagline: 'Board-Certified Family Physician in San Gabriel, CA',
    },
    seo: {
      // og:site_name, and the name a Chinese page's share card shows. Chinese
      // pages previously announced themselves in English here.
      siteName: practice.doctorName,
    },
    stickyCall: {
      label: 'Call for an appointment',
      aria: 'Call {phone} for an appointment',
    },
    header: {
      // The name in the header wordmark. English keeps the short form the
      // owner asked for on 2026-08-19; on 2026-09-14 the owner chose the
      // Chinese name for the Chinese pages, which had shown this in English.
      wordmark: practice.doctorNameShort,
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
    newPatients: 'New Patients',
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
        '保險名稱並非全部——您的保險方案是否與本診所簽約，取決於該方案的特約醫師名單。就診前請攜保險卡來電，我們會為您確認並說明費用。',
      medicare: 'Medicare（紅白藍卡）',
      mediCal: 'Medi-Cal（白卡）',
      hmo: 'HMO 保險',
      ppo: 'PPO 保險',
      privateInsurance: '私人保險',
      cash: '現金自費',
    },
    immigrationExam: {
      factsHeading: '重點資訊',
      faqHeading: '常見問題',
      physicianLabel: '醫師',
      designationLabel: '資格',
      designationValue: '美國移民局指定體檢醫師（civil surgeon）',
      addressLabel: '地址',
      hoursLabel: '門診時間',
      appointmentsLabel: '預約',
      appointmentOnly: '採預約制',
      feeLabel: '費用',
      feeUnknown: '單一固定費用，目前價格請來電洽詢。',
      feeKnown: '單一固定費用 {amount}',
      languagesLabel: '語言',
      languagesValue: '張醫師以英語或國語為您說明結果。診所可使用的語言：{languages}。',
      whoLabel: '看診對象',
      vaccinesLabel: '疫苗',
      vaccinesYes: '診所可施打',
      vaccinesNo: '診所不提供施打',
      visitsLabel: '看診次數',
      visitsValue: '通常需看診 {n} 次',
      faqAppointmentQ: '需要預約嗎？',
      faqAppointmentA: '需要。移民體檢採預約制，請來電預約。',
      faqLanguagesQ: '可以使用哪些語言？',
      faqLanguagesA: '張醫師以英語或國語為您說明結果。診所可使用的語言：{languages}。',
      faqCostQ: '體檢費用是多少？',
      faqCostA: '移民體檢採單一固定費用，目前價格請來電洽詢。',
      faqChildrenQ: '可以為孩童做體檢嗎？',
      faqChildrenA:
        '很抱歉，本診所只看 18 歲以上成人。孩童的移民體檢，請使用美國移民局的 Find a Civil Surgeon 工具，尋找有看孩童的體檢醫師。',
    },
    whatToBring: {
      photoId: '政府核發、附照片的有效身分證件，例如未過期的護照或駕照',
      vaccinationRecords: '您的疫苗接種紀錄',
      otherRecords: '您手邊的其他病歷',
      formBeforeLink:
        '已填好第 1 部分（Part 1）的 Form I-693。請先不要簽名：您必須在張醫師面前簽名。請從 ',
      formAfterLink: ' 下載最新版本；美國移民局只接受醫師簽名時現行的版本。',
    },
    articles: {
      whatToBringTitle: 'I-693 移民體檢應攜帶的資料',
      whatToBringSummary: '移民體檢當天應攜帶的文件，以及到診前如何準備 Form I-693。',
      reviewedLine: '本文由 AI 協助、依據上列官方資料撰寫，並經{doctor}於 {date} 醫學審閱。',
      draftLine: '本文由 AI 協助、依據上列官方資料撰寫。',
      howWeWriteLink: '我們如何撰寫這些文章',
      sourcesHeading: '資料來源',
      sourcesChecked: '資料查核日期：{date}。',
      indexTitle: '文章專區',
      indexIntro: '以淺顯文字說明移民體檢與相關文件，依據官方資料撰寫。每篇文章都會註明是否已經張醫師審閱。',
      reviewedOn: '審閱日期：{date}',
      notYetReviewed: '尚待審閱',
      methodTitle: '我們如何撰寫這些文章',
      methodSources:
        '每篇文章都只依據官方資料說明一項流程（例如一項體檢、一份表格或一種保險）：美國公民及移民服務局（USCIS）、美國疾病管制與預防中心（CDC）、美國聯邦醫療保險與醫療補助服務中心（CMS），以及加州醫療服務部（DHCS）。每篇文章都列出資料來源，以及我們最近一次查核的日期。',
      methodAi: '文章初稿由 AI 協助、依據上述資料撰寫。',
      methodReview:
        '文章一旦經過審閱，審閱分為兩步驟：診所確認內容符合本診所的實際作業，張醫師則審閱醫學與法規上的正確性。文章上的審閱日期，即為張醫師審閱的日期。文章若沒有標示「經張醫師審閱」，即表示尚未經醫師審閱。',
      methodNotPublished: '費用與門診排程等資訊不在此公布。請來電 {phone}，我們會直接為您說明。',
      methodNotAdvice: '這些文章為一般資訊，並非針對您個人情況的醫療建議。',
      methodErrors: '如發現錯誤，請來電 {phone} 或寄電子郵件至 {email}。',
      fullGuideLink: '完整說明：I-693 移民體檢應攜帶的資料',
      validityTitle: 'I-693 的有效期限，以及何時送件',
      validitySummary:
        '美國移民局對 Form I-693 有效期限的規定、為何填表說明仍寫著兩年，以及何時要與 Form I-485 一併送件。',
      validityLink: '延伸閱讀：I-693 的有效期限，以及何時送件',
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
      photo18: '張醫師於1998年1月出席歡迎內蒙古自治區政府林業考察團訪美的宴會並致詞',
      photo19: 'Arcadia 商會頒發獎牌，表彰張醫師首任 Arcadia 市議員任期（1994年至1998年）',
      photo20: 'Arcadia 商會頒發獎牌，表彰張醫師於 Arcadia 建市百週年（2003年）擔任市長之貢獻',
      photo21: 'Arcadia 商會頒發獎牌，表彰張醫師第二任 Arcadia 市議員任期（2000年至2004年）',
      photo22: 'Arcadia 市議會頒發議事槌獎牌予張醫師，表彰其於2003年4月至7月擔任市長之貢獻',
      heading: '獎狀與表彰',
      intro: '精選張醫師參與社區服務期間所獲頒的獎狀，以及活動照片。',
    },
    gallery: {
      close: '關閉',
      previous: '上一張',
      next: '下一張',
      viewer: '照片檢視器',
    },
    footer: {
      hours: '門診時間',
      address: '地址',
      phone: '電話',
      officeInformation: '診所資訊',
      legal: '法律',
      connect: '聯絡',
      wechatQr: 'WeChat QR 碼',
      wechatScan: '掃描 QR 碼，以 WeChat 聯絡我們',
      rightsReserved: '版權所有。',
      privacy: '隱私政策',
      accessibility: '無障礙說明',
      englishOnly: '（英文）',
      site: '網站導覽',
      articles: '文章專區',
    },
    hero: {
      cta: '立即致電',
      placeholder: '照片預留位置',
      boardCertified: '家庭醫學專科醫師',
      acceptingPatients: '現正接受新患者',
      tagline: '加州聖蓋博　家庭醫學專科醫師',
    },
    seo: {
      siteName: '張勝雄醫師',
    },
    stickyCall: {
      label: '電話預約',
      aria: '致電 {phone} 預約看診',
    },
    header: {
      wordmark: '張勝雄醫師',
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
    newPatients: '新患者須知',
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
        '保险名称并非全部——您的保险方案是否与本诊所签约，取决于该方案的特约医师名单。就诊前请携保险卡来电，我们会为您确认并说明费用。',
      medicare: 'Medicare（红白蓝卡）',
      mediCal: 'Medi-Cal（白卡）',
      hmo: 'HMO 保险',
      ppo: 'PPO 保险',
      privateInsurance: '私人保险',
      cash: '现金自费',
    },
    immigrationExam: {
      factsHeading: '重点资讯',
      faqHeading: '常见问题',
      physicianLabel: '医师',
      designationLabel: '资格',
      designationValue: '美国移民局指定体检医师（civil surgeon）',
      addressLabel: '地址',
      hoursLabel: '门诊时间',
      appointmentsLabel: '预约',
      appointmentOnly: '采预约制',
      feeLabel: '费用',
      feeUnknown: '单一固定费用，目前价格请来电洽询。',
      feeKnown: '单一固定费用 {amount}',
      languagesLabel: '语言',
      languagesValue: '张医师以英语或国语为您说明结果。诊所可使用的语言：{languages}。',
      whoLabel: '看诊对象',
      vaccinesLabel: '疫苗',
      vaccinesYes: '诊所可施打',
      vaccinesNo: '诊所不提供施打',
      visitsLabel: '看诊次数',
      visitsValue: '通常需看诊 {n} 次',
      faqAppointmentQ: '需要预约吗？',
      faqAppointmentA: '需要。移民体检采预约制，请来电预约。',
      faqLanguagesQ: '可以使用哪些语言？',
      faqLanguagesA: '张医师以英语或国语为您说明结果。诊所可使用的语言：{languages}。',
      faqCostQ: '体检费用是多少？',
      faqCostA: '移民体检采单一固定费用，目前价格请来电洽询。',
      faqChildrenQ: '可以为孩童做体检吗？',
      faqChildrenA:
        '很抱歉，本诊所只看 18 岁以上成人。孩童的移民体检，请使用美国移民局的 Find a Civil Surgeon 工具，寻找有看孩童的体检医师。',
    },
    whatToBring: {
      photoId: '政府核发、附照片的有效身分证件，例如未过期的护照或驾照',
      vaccinationRecords: '您的疫苗接种纪录',
      otherRecords: '您手边的其他病历',
      formBeforeLink:
        '已填好第 1 部分（Part 1）的 Form I-693。请先不要签名：您必须在张医师面前签名。请从 ',
      formAfterLink: ' 下载最新版本；美国移民局只接受医师签名时现行的版本。',
    },
    articles: {
      whatToBringTitle: 'I-693 移民体检应携带的资料',
      whatToBringSummary: '移民体检当天应携带的文件，以及到诊前如何准备 Form I-693。',
      reviewedLine: '本文由 AI 协助、依据上列官方资料撰写，并经{doctor}于 {date} 医学审阅。',
      draftLine: '本文由 AI 协助、依据上列官方资料撰写。',
      howWeWriteLink: '我们如何撰写这些文章',
      sourcesHeading: '资料来源',
      sourcesChecked: '资料查核日期：{date}。',
      indexTitle: '文章专区',
      indexIntro: '以浅显文字说明移民体检与相关文件，依据官方资料撰写。每篇文章都会注明是否已经张医师审阅。',
      reviewedOn: '审阅日期：{date}',
      notYetReviewed: '尚待审阅',
      methodTitle: '我们如何撰写这些文章',
      methodSources:
        '每篇文章都只依据官方资料说明一项流程（例如一项体检、一份表格或一种保险）：美国公民及移民服务局（USCIS）、美国疾病管制与预防中心（CDC）、美国联邦医疗保险与医疗补助服务中心（CMS），以及加州医疗服务部（DHCS）。每篇文章都列出资料来源，以及我们最近一次查核的日期。',
      methodAi: '文章初稿由 AI 协助、依据上述资料撰写。',
      methodReview:
        '文章一旦经过审阅，审阅分为两步骤：诊所确认内容符合本诊所的实际作业，张医师则审阅医学与法规上的正确性。文章上的审阅日期，即为张医师审阅的日期。文章若没有标示「经张医师审阅」，即表示尚未经医师审阅。',
      methodNotPublished: '费用与门诊排程等资讯不在此公布。请来电 {phone}，我们会直接为您说明。',
      methodNotAdvice: '这些文章为一般资讯，并非针对您个人情况的医疗建议。',
      methodErrors: '如发现错误，请来电 {phone} 或寄电子邮件至 {email}。',
      fullGuideLink: '完整说明：I-693 移民体检应携带的资料',
      validityTitle: 'I-693 的有效期限，以及何时送件',
      validitySummary:
        '美国移民局对 Form I-693 有效期限的规定、为何填表说明仍写着两年，以及何时要与 Form I-485 一并送件。',
      validityLink: '延伸阅读：I-693 的有效期限，以及何时送件',
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
      photo18: '张医师于1998年1月出席欢迎内蒙古自治区政府林业考察团访美的宴会并致词',
      photo19: 'Arcadia 商会颁发奖牌，表彰张医师首任 Arcadia 市议员任期（1994年至1998年）',
      photo20: 'Arcadia 商会颁发奖牌，表彰张医师于 Arcadia 建市百周年（2003年）担任市长之贡献',
      photo21: 'Arcadia 商会颁发奖牌，表彰张医师第二任 Arcadia 市议员任期（2000年至2004年）',
      photo22: 'Arcadia 市议会颁发议事槌奖牌予张医师，表彰其于2003年4月至7月担任市长之贡献',
      heading: '奖状与表彰',
      intro: '精选张医师参与社区服务期间所获颁的奖状，以及活动照片。',
    },
    gallery: {
      close: '关闭',
      previous: '上一张',
      next: '下一张',
      viewer: '照片检视器',
    },
    footer: {
      hours: '门诊时间',
      address: '地址',
      phone: '电话',
      officeInformation: '诊所资讯',
      legal: '法律',
      connect: '联络',
      wechatQr: 'WeChat QR 码',
      wechatScan: '扫描 QR 码，以 WeChat 联络我们',
      rightsReserved: '版权所有。',
      privacy: '隐私政策',
      accessibility: '无障碍说明',
      englishOnly: '（英文）',
      site: '网站导览',
      articles: '文章专区',
    },
    hero: {
      cta: '立即致电',
      placeholder: '照片预留位置',
      boardCertified: '家庭医学专科医师',
      acceptingPatients: '现正接受新患者',
      tagline: '加州圣盖博　家庭医学专科医师',
    },
    seo: {
      siteName: '张胜雄医师',
    },
    stickyCall: {
      label: '电话预约',
      aria: '致电 {phone} 预约看诊',
    },
    header: {
      wordmark: '张胜雄医师',
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
    newPatients: '新患者须知',
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
