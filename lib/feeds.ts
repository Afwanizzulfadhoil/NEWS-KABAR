export type FeedConfig = {
  id: string;
  title: string;
  category: 'Berita' | 'Anime';
  url: string;
  color?: string; // Optional brand color
};

export const FEEDS: FeedConfig[] = [
  { id: 'antara', title: 'Antara News', category: 'Berita', url: 'https://www.antaranews.com/rss/terkini.xml', color: '#ff0000' },
  { id: 'cnn', title: 'CNN Indonesia', category: 'Berita', url: 'https://www.cnnindonesia.com/nasional/rss', color: '#cc0000' },
  { id: 'cnbc', title: 'CNBC Indonesia', category: 'Berita', url: 'https://www.cnbcindonesia.com/news/rss', color: '#133560' },
  { id: 'ann', title: 'Anime News Network', category: 'Anime', url: 'https://www.animenewsnetwork.com/news/rss.xml', color: '#1e3050' },
  { id: 'mal', title: 'MyAnimeList', category: 'Anime', url: 'https://myanimelist.net/rss/news.xml', color: '#2e51a2' },
];
