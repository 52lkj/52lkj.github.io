import fs from 'node:fs/promises';

const TIME_ZONE = 'Asia/Shanghai';
const TARGET_TOTAL = 20;

const FEEDS = [
  {
    category: '大模型',
    target: 7,
    query: '人工智能 OR 大模型 OR OpenAI OR Anthropic OR Gemini OR ChatGPT when:2d',
  },
  {
    category: '芯片',
    target: 6,
    query: '芯片 OR 半导体 OR GPU OR HBM OR 台积电 OR 英伟达 when:2d',
  },
  {
    category: '新产品',
    target: 7,
    query: '科技 新产品 OR AI 产品 OR 机器人 OR 智能硬件 when:2d',
  },
];

function formatDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

function formatWeekday(date = new Date()) {
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: TIME_ZONE,
    weekday: 'long',
  }).format(date);
}

function decodeXml(value = '') {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .trim();
}

function stripHtml(value = '') {
  return decodeXml(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function readTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match ? decodeXml(match[1]) : '';
}

function googleNewsUrl(query) {
  const params = new URLSearchParams({
    q: query,
    hl: 'zh-CN',
    gl: 'CN',
    ceid: 'CN:zh-Hans',
  });
  return `https://news.google.com/rss/search?${params.toString()}`;
}

function cleanTitle(title, source) {
  let result = stripHtml(title);
  if (source && result.endsWith(` - ${source}`)) {
    result = result.slice(0, -` - ${source}`.length);
  }
  return result.replace(/\s+/g, ' ').trim();
}

function makeTags(title, category) {
  const tags = [category];
  const candidates = [
    'OpenAI',
    'ChatGPT',
    'Google',
    'Gemini',
    'Anthropic',
    'Claude',
    'Meta',
    '英伟达',
    'NVIDIA',
    '台积电',
    '华为',
    '芯片',
    '机器人',
    'AI',
  ];
  for (const candidate of candidates) {
    if (tags.length >= 3) break;
    if (title.toLowerCase().includes(candidate.toLowerCase()) && !tags.includes(candidate)) {
      tags.push(candidate);
    }
  }
  return tags;
}

async function fetchFeed(feed) {
  const response = await fetch(googleNewsUrl(feed.query), {
    headers: {
      'user-agent': 'TechPulseBot/1.0 (+https://52lkj.github.io/)',
    },
  });
  if (!response.ok) {
    throw new Error(`${feed.category} RSS failed: ${response.status}`);
  }

  const xml = await response.text();
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map((match) => match[1]);

  return items.map((item) => {
    const rawTitle = readTag(item, 'title');
    const source = stripHtml(readTag(item, 'source')) || 'Google News';
    const title = cleanTitle(rawTitle, source);
    const pubDate = new Date(readTag(item, 'pubDate'));
    const publishTime = Number.isNaN(pubDate.getTime())
      ? `${formatDate()} 09:00`
      : new Intl.DateTimeFormat('sv-SE', {
          timeZone: TIME_ZONE,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(pubDate).replace(' ', ' ');

    return {
      category: feed.category,
      title,
      summary: `${title}。来源：${source}。`,
      source,
      publish_time: publishTime,
      url: readTag(item, 'link'),
      tags: makeTags(title, feed.category),
    };
  }).filter((item) => item.title && item.url);
}

function uniqueItems(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.title.replace(/\W+/g, '').toLowerCase().slice(0, 80);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function main() {
  const grouped = await Promise.all(FEEDS.map(fetchFeed));
  const selected = [];

  for (let index = 0; index < FEEDS.length; index += 1) {
    selected.push(...uniqueItems(grouped[index]).slice(0, FEEDS[index].target));
  }

  const overflow = uniqueItems(grouped.flat())
    .filter((item) => !selected.some((selectedItem) => selectedItem.url === item.url))
    .slice(0, TARGET_TOTAL - selected.length);

  const hotspots = [...selected, ...overflow]
    .slice(0, TARGET_TOTAL)
    .sort((a, b) => b.publish_time.localeCompare(a.publish_time))
    .map((item, index) => ({ id: index + 1, ...item }));

  if (hotspots.length < 10) {
    throw new Error(`Only generated ${hotspots.length} hotspots; refusing to publish sparse data.`);
  }

  const date = formatDate();
  const weekday = formatWeekday();
  const counts = Object.fromEntries(FEEDS.map((feed) => [
    feed.category,
    hotspots.filter((item) => item.category === feed.category).length,
  ]));
  const topTitles = hotspots.slice(0, 5).map((item) => item.title).join('；');
  const data = {
    date,
    weekday,
    summary: `${date} 科技热点自动更新：共收录 ${hotspots.length} 条资讯，覆盖大模型 ${counts['大模型'] || 0} 条、芯片 ${counts['芯片'] || 0} 条、新产品 ${counts['新产品'] || 0} 条。重点包括：${topTitles}。`,
    keywords: [...new Set(hotspots.flatMap((item) => item.tags))].slice(0, 10),
    hotspots,
  };

  await fs.writeFile('data.json', `${JSON.stringify(data, null, 2)}\n`, 'utf8');

  const html = await fs.readFile('index.html', 'utf8');
  const updatedHtml = html.replace(
    /let DATA = \{[\s\S]*?\n\};\n\n\/\/ 渲染/,
    `let DATA = ${JSON.stringify(data, null, 2)};\n\n// 渲染`,
  );
  if (updatedHtml === html) {
    throw new Error('Could not update inline DATA fallback in index.html');
  }
  await fs.writeFile('index.html', updatedHtml, 'utf8');

  console.log(`Generated ${hotspots.length} hotspots for ${date}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
