'use client';

import { useState, useEffect } from 'react';
import { FEEDS, FeedConfig } from '@/lib/feeds';
import { Rss, Newspaper, Tv, ExternalLink, Loader2, Clock, Image as ImageIcon, Sparkles, Share2, Check } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

type FeedItem = {
  title: string;
  link: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  guid?: string;
  enclosure?: { url: string; type?: string };
  'media:content'?: { '$': { url: string } } | any;
  feedId: string;
  feedTitle: string;
  category: string;
  color?: string;
};

// Helper to extract image URL from RSS item
const extractImage = (item: any): string | null => {
  if (item.enclosure?.url && item.enclosure?.type?.startsWith('image/')) {
    return item.enclosure.url;
  }
  if (item['media:content'] && item['media:content']['$']?.url) {
    return item['media:content']['$'].url;
  }
  if (item['media:content'] && Array.isArray(item['media:content']) && item['media:content'][0]?.['$']?.url) {
    return item['media:content'][0]['$'].url;
  }
  // Try to parse img tag from content
  const content = item.content || item['content:encoded'] || '';
  const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
  if (imgMatch && imgMatch[1]) {
    return imgMatch[1];
  }
  return null;
};

function FeedCard({ item }: { item: FeedItem }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (item.link) {
      navigator.clipboard.writeText(item.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  
  const image = extractImage(item);
  const dateObj = new Date(item.isoDate || item.pubDate || Date.now());
  let timeAgo = '';
  try {
     timeAgo = formatDistanceToNow(dateObj, { addSuffix: true, locale: idLocale });
  } catch(e) {
     timeAgo = 'Beberapa saat lalu';
  }
  
  // Clean up snippet
  let fullSnippet = item.contentSnippet || '';
  // Simple strip HTML helper
  fullSnippet = fullSnippet.replace(/<[^>]+>/g, '').trim();
  
  const isLong = fullSnippet.length > 120;
  const displaySnippet = (!expanded && isLong) ? fullSnippet.substring(0, 120) + '...' : fullSnippet;

  return (
    <article 
      className="group bg-white brutalist-border flex flex-col hover:-translate-y-1 hover:shadow-md transition-all duration-200"
    >
      {/* Image/Header area */}
      {image ? (
        <div className="relative h-56 w-full overflow-hidden border-b-2 border-black bg-gray-100">
          <img 
            src={image} 
            alt={item.title} 
            className="object-cover object-center w-full h-full grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500 ease-out"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-4 left-4">
            <span 
              className="px-2 py-1 text-[10px] font-bold text-white uppercase mono brutalist-border"
              style={{ backgroundColor: item.color || '#000' }}
            >
              {item.feedTitle}
            </span>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-4 pb-2 border-b-2 border-black">
            <span 
              className="px-2 py-1 text-[10px] font-bold text-white uppercase mono brutalist-border inline-block"
              style={{ backgroundColor: item.color || '#000' }}
            >
              {item.feedTitle}
            </span>
        </div>
      )}

      <div className="p-5 flex flex-col flex-grow">
        <h2 className={`text-xl font-black text-black uppercase leading-tight mb-3 ${!expanded ? 'line-clamp-3' : ''}`} title={item.title}>
          {item.title}
        </h2>
        
        {fullSnippet && (
          <div className="mb-4 flex flex-col flex-grow">
            <p className={`font-mono text-xs leading-relaxed opacity-80 ${!expanded ? 'line-clamp-3' : ''}`}>
              {displaySnippet}
            </p>
            {isLong && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setExpanded(!expanded);
                }} 
                className="self-start mt-2 text-xs font-bold uppercase underline hover:text-[#FF4500] transition-colors"
              >
                {expanded ? 'Tutup' : 'Baca Lebih Lanjut'}
              </button>
            )}
          </div>
        )}
        
        <div className="mt-auto pt-4 border-t-2 border-black flex items-center justify-between text-xs font-bold uppercase">
          <div className="flex items-center gap-1.5 truncate pr-2">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="mono truncate">{timeAgo}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              title="Bagikan Tautan"
              className="flex items-center justify-center p-1.5 brutalist-border bg-white hover:bg-black hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-600" /> : <Share2 className="w-3 h-3" />}
            </button>
            <a 
              href={item.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 bg-brand-yellow px-3 py-1 brutalist-border hover:bg-black hover:text-white transition-colors flex-shrink-0"
            >
              Buka
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<'Semua' | 'Berita' | 'Anime'>('Semua');
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchPromises = FEEDS.map(async (feedConfig) => {
        try {
          const res = await fetch(`/api/rss?url=${encodeURIComponent(feedConfig.url)}`);
          if (!res.ok) {
            console.error(`Failed to fetch ${feedConfig.title}`);
            return [];
          }
          const data = await res.json();
          // Safety check if items is array
          return (Array.isArray(data.items) ? data.items : []).map((item: any) => ({
            ...item,
            feedId: feedConfig.id,
            feedTitle: feedConfig.title,
            category: feedConfig.category,
            color: feedConfig.color,
          }));
        } catch (e) {
          console.error(`Error processing ${feedConfig.title}`, e);
          return [];
        }
      });

      const results = await Promise.all(fetchPromises);
      const allItems = results.flat();
      
      // Sort in descending order
      allItems.sort((a, b) => {
        const dateA = new Date(a.isoDate || a.pubDate || 0).getTime();
        const dateB = new Date(b.isoDate || b.pubDate || 0).getTime();
        return dateB - dateA;
      });

      setItems(allItems);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat berita. Silakan periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = items.filter(
    item => activeCategory === 'Semua' || item.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex flex-col font-sans text-black">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black text-white brutalist-border border-x-0 border-t-0 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black italic uppercase">
                WibuNews / Kabar
              </h1>
            </div>
            
            {/* Navigation Pills */}
            <div className="flex items-center p-1 bg-black gap-2 overflow-x-auto min-w-0 max-w-full no-scrollbar">
              {(['Semua', 'Berita', 'Anime'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveCategory(tab)}
                  className={`flex items-center gap-2 px-6 py-2 brutalist-border text-xs font-bold uppercase transition-all duration-300 flex-shrink-0 ${
                    activeCategory === tab 
                      ? 'bg-brand-yellow text-black' 
                      : 'bg-white text-black hover:bg-gray-200'
                  }`}
                >
                  {tab === 'Semua' && <Rss className="w-4 h-4" />}
                  {tab === 'Berita' && <Newspaper className="w-4 h-4" />}
                  {tab === 'Anime' && <Tv className="w-4 h-4" />}
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-black">
            <Loader2 className="w-12 h-12 animate-spin mb-4" />
            <p className="font-bold text-lg mono uppercase tracking-widest">SINKRONISASI...</p>
          </div>
        ) : error ? (
          <div className="bg-brand-orange text-white brutalist-border p-6 text-center max-w-lg mx-auto shadow-[4px_4px_0px_rgba(0,0,0,1)]">
            <p className="font-bold uppercase text-lg mb-2">ERROR KONEKSI</p>
            <p className="font-mono text-sm mb-4">{error}</p>
            <button 
              onClick={fetchItems}
              className="px-6 py-2 bg-black text-white brutalist-border text-sm font-bold transition-transform hover:-translate-y-1 uppercase"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-black">
            <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-bold uppercase mono">Tidak ada data sinkronisasi.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max items-start">
            {filteredItems.map((item, index) => (
              <FeedCard key={`${item.guid || item.link}-${index}`} item={item} />
            ))}
          </div>
        )}
      </main>
      
      {/* Footer */}
      <footer className="mt-auto w-full brutalist-border border-b-0 border-x-0 border-t-2 bg-brand-yellow font-bold uppercase text-lg py-3 overflow-hidden">
        <div className="whitespace-nowrap animate-[scroll_20s_linear_infinite] flex gap-10">
          <div className="flex-shrink-0 flex gap-10">
            <span>+++ BREAKING: WIBUNEWS BERITA DAN ANIME TERBARU +++</span>
            <span>+++ SINKRONISASI DATA AKTIF +++</span>
            <span>+++ LIVE RSS FEED v2.4 +++</span>
            <span>+++ BREAKING: WIBUNEWS BERITA DAN ANIME TERBARU +++</span>
            <span>+++ SINKRONISASI DATA AKTIF +++</span>
            <span>+++ LIVE RSS FEED v2.4 +++</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
