/** Yangiliklar manbalari — RSS orqali ochiq tarqatiladigan feed'lar. */
export const NEWS_SOURCES = [
  {
    name: "The Guardian",
    url: "https://www.theguardian.com/football/manchesterunited/rss",
  },
  {
    name: "Manchester Evening News",
    url: "https://www.manchestereveningnews.co.uk/all-about/manchester-united-fc/?service=rss",
  },
] as const;

/** Bitta manbadan nechta maqola olinadi */
export const PER_SOURCE_LIMIT = 8;
/** Bazada nechta import qilingan maqola saqlanadi */
export const KEEP_IMPORTED = 30;
