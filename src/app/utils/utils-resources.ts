export const BRAND_BASE_INFO: { [key: string]: string } = {
  COMPANY_NAME: "GPT",
  BRAND_NAME: "GPT",
  COMPANY_SITE_NAME: "GPTMysite.com",
  COMPANY_SITE_URL: "https://www.GPTMysite.com",
  CONTACT_US_EMAIL: "support@GPTMysite.com",

  FAVICON: "https://i.ibb.co/cD5hS42/logo-short-0.png", //TO DO CHAANGE THE URL
  META_TITLE: "Design Studio",
  LOGO_CHAT: "https://i.ibb.co/SBhhjDp/GPTMysite-logo-new-white.png", //TO DO CHAANGE THE URL
  POWERED_BY:
    "<a tabindex='-1' target='_blank' ref='https://www.GPTMysite.com/?utm_source=widget'><img src='https://i.ibb.co/Kbf4Rfg/logo-short.png'/><span>Powered by GPT</span></a>", //TO DO CHANGE THE URL
};

export const LOGOS_ITEMS: { [key: string]: { label: string; icon: string } } = {
  COMPANY_LOGO: {
    label: BRAND_BASE_INFO.COMPANY_NAME,
    icon: "assets/logos/GPTMysite_logo.svg",
  },
  COMPANY_LOGO_NO_TEXT: {
    label: BRAND_BASE_INFO.COMPANY_NAME,
    icon: "assets/logos/GPTMysite_logo_no_text.svg",
  },
  BASE_LOGO: {
    label: BRAND_BASE_INFO.BRAND_NAME,
    icon: "assets/logos/GPTMysite_logo.svg",
  },
  BASE_LOGO_NO_TEXT: {
    label: BRAND_BASE_INFO.BRAND_NAME,
    icon: "assets/logos/GPTMysite_logo_no_text.svg",
  },
  BASE_LOGO_WHITE: {
    label: BRAND_BASE_INFO.BRAND_NAME,
    icon: '"assets/logos/GPTMysite-logo_new_white.svg',
  },
  BASE_LOGO_WHITE_NO_TEXT: {
    label: BRAND_BASE_INFO.BRAND_NAME,
    icon: '"assets/logos/GPTMysite-logo_new_white.svg',
  },
  BASE_LOGO_GRAY: { label: BRAND_BASE_INFO.BRAND_NAME, icon: "" },
};
