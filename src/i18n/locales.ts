export interface LocaleMetadata {
  code: string;
  name: string;
  nativeName: string;
  reviewed: boolean;
}

export const locales: Record<string, LocaleMetadata> = {
  en: {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    reviewed: true,
  },
  'zh-hant': {
    code: 'zh-Hant',
    name: '繁體中文',
    nativeName: '繁體中文',
    reviewed: false,
  },
  'zh-hans': {
    code: 'zh-Hans',
    name: '簡體中文',
    nativeName: '簡體中文',
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
      privacy: 'Privacy Policy',
      accessibility: 'Accessibility Statement',
    },
    notFound: 'Page not found',
    home: 'Home',
    about: 'About',
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
    contactUs: '聯絡我們',
    callOffice: '致電診所',
    serviceCards: {
      familyMedicine: '家庭醫學',
      chronicDiseaseManagement: '慢性病管理',
      preventiveCare: '預防保健',
      internalMedicine: '內科醫學',
    },
    footer: {
      hours: '營業時間',
      address: '地址',
      phone: '電話',
      license: '加州醫療執照',
      privacy: '隱私政策',
      accessibility: '無障礙說明',
    },
    notFound: '頁面未找到',
    home: '首頁',
    about: '關於我們',
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
    contactUs: '联络我们',
    callOffice: '致电诊所',
    serviceCards: {
      familyMedicine: '家庭医学',
      chronicDiseaseManagement: '慢性病管理',
      preventiveCare: '预防保健',
      internalMedicine: '内科医学',
    },
    footer: {
      hours: '营业时间',
      address: '地址',
      phone: '电话',
      license: '加州医疗执照',
      privacy: '隐私政策',
      accessibility: '无障碍说明',
    },
    notFound: '页面未找到',
    home: '首页',
    about: '关于我们',
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
