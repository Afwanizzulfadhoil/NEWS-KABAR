import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

// Extend the Parser options to handle image thumbnails
export const dynamic = 'force-dynamic';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:group', 'enclosure', 'content:encoded'],
  },
  requestOptions: {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 WibuNews'
    }
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedUrl = searchParams.get('url');

  if (!feedUrl) {
    return NextResponse.json({ error: 'Feed URL is required' }, { status: 400 });
  }

  try {
    let response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'application/rss+xml, application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      // Fallback 1: CodeTabs proxy
      response = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(feedUrl)}`, {
        next: { revalidate: 300 }
      });
    }
    
    if (!response.ok) {
      // Fallback 2: rss2json
      const r2j = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`, {
         next: { revalidate: 300 }
      });
      
      if (r2j.ok) {
         const data = await r2j.json();
         if (data.status === 'ok') {
           return NextResponse.json({
             title: data.feed.title,
             items: data.items.map((item: any) => ({
               title: item.title,
               link: item.link,
               pubDate: item.pubDate,
               isoDate: item.pubDate,
               contentSnippet: item.description?.replace(/<[^>]+>/g, '').substring(0, 200),
               content: item.content || item.description,
               guid: item.guid,
               enclosure: item.enclosure?.link ? { url: item.enclosure.link, type: item.enclosure.type } : undefined,
               'media:content': item.thumbnail ? { '$': { url: item.thumbnail } } : undefined
             }))
           });
         }
      }
      
      throw new Error(`Status code ${response.status} from proxies`);
    }

    const text = await response.text();
    const feed = await parser.parseString(text);
    return NextResponse.json(feed);
  } catch (error) {
    console.error('Error parsing RSS feed:', error);
    return NextResponse.json(
      { error: 'Failed to parse RSS feed', details: String(error) },
      { status: 500 }
    );
  }
}
