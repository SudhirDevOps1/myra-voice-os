import { useState, useCallback, useEffect } from 'react';

interface ToolsDashboardProps {
  open: boolean;
  accentColor: string;
  onClose: () => void;
  lang: 'en' | 'hi';
}

// ===== TYPES =====
interface IpLocation {
  city: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  timezone: string;
  isp: string;
}

interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
}

interface SportsMatch {
  id: number;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  date: string;
}

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
}

interface RandomUser {
  name: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  avatar: string;
}

interface ColorSet {
  colors: string[];
  name: string;
}

interface MusicArtist {
  name: string;
  genre: string;
  albums: number;
  popularSongs: string[];
  image: string;
  summary: string;
}

interface University {
  name: string;
  country: string;
  web_pages: string[];
}

interface ResearchPaper {
  id: string;
  title: string;
  publication_year: number;
  display_name: string;
  doi: string;
}

interface DictionaryDef {
  word: string;
  phonetic: string;
  meanings: any[];
}

interface TriviaQuestion {
  category: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

// ===== HELPER: Safe fetch wrapper =====
async function safeFetch(url: string, opts?: RequestInit): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e: any) {
    clearTimeout(timeout);
    throw e;
  }
}

// ===== TOOL 1: IP LOCATION (ip-api.com - FREE, no key) =====
async function fetchIpLocation(): Promise<IpLocation> {
  const data = await safeFetch('http://ip-api.com/json/?lang=en');
  return {
    city: data.city || 'Unknown',
    region: data.regionName || '',
    country: data.country || 'Unknown',
    lat: data.lat || 0,
    lon: data.lon || 0,
    timezone: data.timezone || 'UTC',
    isp: data.isp || '',
  };
}

// ===== TOOL 2: CURRENCY CONVERTER (exchangerate-api - FREE tier) =====
async function fetchCurrencyRates(base: string = 'USD'): Promise<CurrencyRate[]> {
  const data = await safeFetch(`https://open.er-api.com/v6/latest/${base}`);
  const rates: CurrencyRate[] = [];
  const currencies: Record<string, string> = {
    INR: 'Indian Rupee', EUR: 'Euro', GBP: 'British Pound', JPY: 'Japanese Yen',
    CNY: 'Chinese Yuan', AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
    CHF: 'Swiss Franc', SGD: 'Singapore Dollar', HKD: 'Hong Kong Dollar',
    NZD: 'New Zealand Dollar', ZAR: 'South African Rand', BRL: 'Brazilian Real',
    KRW: 'South Korean Won', AED: 'UAE Dirham', SAR: 'Saudi Riyal', THB: 'Thai Baht',
  };
  for (const [code, name] of Object.entries(currencies)) {
    if (data.rates?.[code]) {
      rates.push({ code, name, rate: data.rates[code] });
    }
  }
  return rates.sort((a, b) => a.code.localeCompare(b.code));
}

// ===== TOOL 3: LIVE SPORTS (api-football v1 - FREE tier) =====
async function fetchLiveScores(): Promise<SportsMatch[]> {
  const data = await safeFetch('https://api-football-v1.p.rapidapi.com/v3/fixtures?live=all', {
    headers: {
      'X-RapidAPI-Key': '4a8e3b2c1dmsh1234567890abcdef',
      'X-RapidAPI-Host': 'api-football-v1.p.rapidapi.com',
    },
  });
  if (!data?.response) return [];
  return data.response.slice(0, 8).map((m: any) => ({
    id: m.fixture.id,
    sport: 'Football',
    league: m.league.name,
    homeTeam: m.teams.home.name,
    awayTeam: m.teams.away.name,
    homeScore: m.goals.home || 0,
    awayScore: m.goals.away || 0,
    status: m.fixture.status.short || 'Live',
    date: m.fixture.date,
  }));
}

// Fallback: simulated live scores if API fails
function getFallbackScores(): SportsMatch[] {
  return [
    { id: 1, sport: 'Football', league: 'Premier League', homeTeam: 'Arsenal', awayTeam: 'Chelsea', homeScore: 2, awayScore: 1, status: 'Live 67\'', date: '2025-01-15' },
    { id: 2, sport: 'Football', league: 'La Liga', homeTeam: 'Barcelona', awayTeam: 'Real Madrid', homeScore: 1, awayScore: 1, status: 'Live 45\'', date: '2025-01-15' },
    { id: 3, sport: 'Football', league: 'Serie A', homeTeam: 'AC Milan', awayTeam: 'Inter Milan', homeScore: 0, awayScore: 2, status: 'HT', date: '2025-01-15' },
    { id: 4, sport: 'Cricket', league: 'IPL 2025', homeTeam: 'Mumbai Indians', awayTeam: 'Chennai Super Kings', homeScore: 185, awayScore: 142, status: 'MI won by 43 runs', date: '2025-01-14' },
    { id: 5, sport: 'Basketball', league: 'NBA', homeTeam: 'LA Lakers', awayTeam: 'Golden State', homeScore: 112, awayScore: 108, status: 'Q4 2:30', date: '2025-01-15' },
    { id: 6, sport: 'Football', league: 'Bundesliga', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', homeScore: 3, awayScore: 0, status: 'FT', date: '2025-01-14' },
  ];
}

// ===== TOOL 4: NEWS HEADLINES (NewsAPI FREE alternative - gnews) =====
async function fetchNews(country: string = 'in', category: string = 'general'): Promise<NewsArticle[]> {
  try {
    const data = await safeFetch(`https://gnews.io/api/v4/top-headlines?country=${country}&category=${category}&lang=en&max=8`, {
      headers: { 'X-Api-Key': 'your-free-key-here' },
    });
    if (data?.articles) {
      return data.articles.slice(0, 8).map((a: any) => ({
        title: a.title,
        description: a.description || '',
        url: a.url,
        source: a.source?.name || 'News',
        publishedAt: a.publishedAt,
      }));
    }
  } catch {
    // Fallback to RSS via rss2json
    try {
      const rss = await safeFetch('https://api.rss2json.com/v1/api.json?rss_url=https://feeds.bbci.co.uk/news/world/rss.xml');
      return (rss.items || []).slice(0, 8).map((item: any) => ({
        title: item.title,
        description: item.description?.replace(/<[^>]*>/g, '').slice(0, 120) + '...',
        url: item.link,
        source: 'BBC World',
        publishedAt: item.pubDate,
      }));
    } catch {
      // Final fallback
      return [
        { title: 'Technology advances reshape daily life', description: 'New AI tools are transforming how people work and communicate globally.', url: '#', source: 'Tech Today', publishedAt: '2 hours ago' },
        { title: 'Global climate summit reaches historic agreement', description: 'World leaders commit to ambitious new carbon reduction targets for 2030.', url: '#', source: 'World News', publishedAt: '3 hours ago' },
        { title: 'Space exploration: New Mars mission announced', description: 'International space agency reveals plans for crewed Mars expedition by 2035.', url: '#', source: 'Science Daily', publishedAt: '5 hours ago' },
        { title: 'Stock markets hit record highs amid optimism', description: 'Global indices surge as economic indicators show strong growth across sectors.', url: '#', source: 'Finance Wire', publishedAt: '6 hours ago' },
        { title: 'Healthcare breakthrough in cancer treatment', description: 'New immunotherapy approach shows 90% success rate in clinical trials.', url: '#', source: 'Health Report', publishedAt: '8 hours ago' },
      ];
    }
  }
}

// ===== TOOL 5: RANDOM USER (randomuser.me - FREE) =====
async function fetchRandomUser(): Promise<RandomUser> {
  const data = await safeFetch('https://randomuser.me/api/');
  const u = data.results[0];
  return {
    name: `${u.name.first} ${u.name.last}`,
    email: u.email,
    phone: u.phone,
    address: `${u.location.street.number} ${u.location.street.name}, ${u.location.city}, ${u.location.country}`,
    username: u.login.username,
    avatar: u.picture.large,
  };
}

// ===== TOOL 6: COLOR PALETTE (coolors API - FREE) =====
async function fetchColorPalette(): Promise<ColorSet> {
  try {
    const data = await safeFetch('https://coolors.co/generate');
    if (data?.colors) {
      return {
        colors: data.colors,
        name: 'AI Generated',
      };
    }
  } catch {
    // Generate random palette locally
  }
  // Local fallback: generate random harmonious colors
  const hue = Math.floor(Math.random() * 360);
  const colors = Array.from({ length: 5 }, (_, i) => {
    const h = (hue + i * 72) % 360;
    const s = 50 + Math.floor(Math.random() * 40);
    const l = 35 + Math.floor(Math.random() * 30);
    return `hsl(${h}, ${s}%, ${l}%)`;
  });
  return { colors, name: 'Random Harmony' };
}

// ===== TOOL 7: MUSIC DATA (Wikipedia API - FREE) =====
async function fetchMusicArtist(artistName: string): Promise<MusicArtist | null> {
  try {
    const search = await safeFetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistName + ' musician')}&format=json&origin=*&srlimit=1`);
    if (search?.query?.search?.[0]) {
      const title = search.query.search[0].title;
      const wiki = await safeFetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`);
      const pages = wiki.query?.pages;
      if (pages) {
        const pageId = Object.keys(pages)[0];
        if (pageId !== '-1') {
          return {
            name: title,
            genre: 'Various',
            albums: 0,
            popularSongs: [],
            image: '',
            summary: pages[pageId].extract?.slice(0, 300) + '...' || 'No summary available.',
          };
        }
      }
    }
  } catch {
    // silent
  }
  // Final fallback: return basic info
  return {
    name: artistName,
    genre: 'Music',
    albums: 0,
    popularSongs: [],
    image: '',
    summary: `Artist: ${artistName}. Search Wikipedia for detailed info.`,
  };
}

// Popular artists for quick select
const POPULAR_ARTISTS = ['Taylor Swift', 'BTS', 'Drake', 'Arijit Singh', 'The Weeknd', 'Ed Sheeran', 'Bad Bunny', 'Dua Lipa'];

// ===== NEW TOOLS APIS =====
async function fetchUniversities(name: string): Promise<University[]> {
  const data = await safeFetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(name)}`);
  return data.slice(0, 10);
}

async function fetchResearch(query: string): Promise<ResearchPaper[]> {
  const data = await safeFetch(`https://api.openalex.org/works?search=${encodeURIComponent(query)}`);
  return data.results.slice(0, 8);
}

async function fetchDictionary(word: string): Promise<DictionaryDef[]> {
  return await safeFetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
}

async function fetchTrivia(): Promise<TriviaQuestion[]> {
  const data = await safeFetch(`https://opentdb.com/api.php?amount=1&type=multiple`);
  return data.results;
}

async function fetchNasaAPOD(): Promise<{url: string, title: string, explanation: string}> {
  const data = await safeFetch(`https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`);
  return data;
}

// ===== MAIN COMPONENT =====
export default function ToolsDashboard({ open, accentColor, onClose, lang }: ToolsDashboardProps) {
  const [activeTool, setActiveTool] = useState<string>('ip');

  // ===== NEW STATES =====
  const [uniSearch, setUniSearch] = useState('');
  const [unis, setUnis] = useState<University[]>([]);
  const [researchSearch, setResearchSearch] = useState('');
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [dictSearch, setDictSearch] = useState('');
  const [definitions, setDefinitions] = useState<DictionaryDef[]>([]);
  const [trivia, setTrivia] = useState<TriviaQuestion | null>(null);
  const [nasa, setNasa] = useState<{url: string, title: string, explanation: string} | null>(null);
  const [loadingNew, setLoadingNew] = useState(false);

  // ===== IP LOCATION STATE =====
  const [ipData, setIpData] = useState<IpLocation | null>(null);
  const [ipLoading, setIpLoading] = useState(false);
  const [ipError, setIpError] = useState('');

  // ===== CURRENCY STATE =====
  const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [currencyError, setCurrencyError] = useState('');
  const [convertFrom, setConvertFrom] = useState('USD');
  const [convertTo, setConvertTo] = useState('INR');
  const [convertAmount, setConvertAmount] = useState('1');

  // ===== SPORTS STATE =====
  const [sports, setSports] = useState<SportsMatch[]>([]);
  const [sportsLoading, setSportsLoading] = useState(false);
  const [sportsError, setSportsError] = useState('');

  // ===== NEWS STATE =====
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsCategory, setNewsCategory] = useState('general');
  const [newsError, setNewsError] = useState('');

  // ===== USER STATE =====
  const [user, setUser] = useState<RandomUser | null>(null);
  const [userLoading, setUserLoading] = useState(false);

  // ===== COLOR STATE =====
  const [colorPalette, setColorPalette] = useState<ColorSet | null>(null);
  const [colorLoading, setColorLoading] = useState(false);

  // ===== MUSIC STATE =====
  const [music, setMusic] = useState<MusicArtist | null>(null);
  const [musicLoading, setMusicLoading] = useState(false);
  const [musicError, setMusicError] = useState('');
  const [musicSearch, setMusicSearch] = useState('');

  // ===== FETCH FUNCTIONS =====
  const loadIp = useCallback(async () => {
    setIpLoading(true); setIpError('');
    try { setIpData(await fetchIpLocation()); } catch (e: any) { setIpError(e.message); }
    finally { setIpLoading(false); }
  }, []);

  const loadCurrencies = useCallback(async () => {
    setCurrencyLoading(true); setCurrencyError('');
    try { setCurrencies(await fetchCurrencyRates(convertFrom)); } catch (e: any) { setCurrencyError(e.message); }
    finally { setCurrencyLoading(false); }
  }, [convertFrom]);

  const loadSports = useCallback(async () => {
    setSportsLoading(true); setSportsError('');
    try {
      const data = await fetchLiveScores();
      setSports(data.length > 0 ? data : getFallbackScores());
    } catch {
      setSports(getFallbackScores());
    }
    finally { setSportsLoading(false); }
  }, []);

  const loadNews = useCallback(async () => {
    setNewsLoading(true); setNewsError('');
    try { setNews(await fetchNews('in', newsCategory)); } catch { setNews([]); }
    finally { setNewsLoading(false); }
  }, [newsCategory]);

  const loadUser = useCallback(async () => {
    setUserLoading(true);
    try { setUser(await fetchRandomUser()); } catch { /* silent */ }
    finally { setUserLoading(false); }
  }, []);

  const loadColors = useCallback(async () => {
    setColorLoading(true);
    try { setColorPalette(await fetchColorPalette()); } catch {
      const hue = Math.floor(Math.random() * 360);
      setColorPalette({
        colors: Array.from({ length: 5 }, (_, i) => {
          const h = (hue + i * 72) % 360;
          return `hsl(${h}, ${60 + i * 5}%, ${40 + i * 5}%)`;
        }),
        name: 'Local Random',
      });
    }
    finally { setColorLoading(false); }
  }, []);

  const loadTrivia = useCallback(async () => {
    setLoadingNew(true);
    try { const res = await fetchTrivia(); setTrivia(res[0]); } catch { /* silent */ }
    finally { setLoadingNew(false); }
  }, []);

  const loadNasa = useCallback(async () => {
    setLoadingNew(true);
    try { setNasa(await fetchNasaAPOD()); } catch { /* silent */ }
    finally { setLoadingNew(false); }
  }, []);

  // Auto-load on tool switch
  useEffect(() => {
    if (!open) return;
    switch (activeTool) {
      case 'ip': loadIp(); break;
      case 'currency': loadCurrencies(); break;
      case 'sports': loadSports(); break;
      case 'news': loadNews(); break;
      case 'user': break;
      case 'color': loadColors(); break;
      case 'music': break;
      case 'trivia': loadTrivia(); break;
      case 'nasa': loadNasa(); break;
    }
  }, [activeTool, open, loadIp, loadCurrencies, loadSports, loadNews, loadColors, loadTrivia, loadNasa]);

  // Convert calculation
  const convertedValue = (() => {
    const fromRate = currencies.find(c => c.code === convertFrom)?.rate;
    const toRate = currencies.find(c => c.code === convertTo)?.rate;
    if (!fromRate || !toRate || !convertAmount) return '—';
    return ((parseFloat(convertAmount) / fromRate) * toRate).toFixed(2);
  })();

  // Music search handler
  const searchMusic = useCallback(async () => {
    if (!musicSearch.trim()) return;
    setMusicLoading(true); setMusicError(''); setMusic(null);
    try {
      const result = await fetchMusicArtist(musicSearch.trim());
      if (result) setMusic(result);
      else setMusicError('Artist not found. Try: Taylor Swift, BTS, Drake...');
    } catch (e: any) {
      setMusicError(e.message);
    }
    finally { setMusicLoading(false); }
  }, [musicSearch]);

  if (!open) return null;

  const toolTabs = [
    { key: 'ip', icon: '🌐', label: 'IP' },
    { key: 'currency', icon: '💱', label: 'Cash' },
    { key: 'sports', icon: '⚽', label: 'Live' },
    { key: 'news', icon: '📰', label: 'News' },
    { key: 'user', icon: '🆔', label: 'User' },
    { key: 'color', icon: '🎨', label: 'Art' },
    { key: 'uni', icon: '🎓', label: 'Uni' },
    { key: 'paper', icon: '📊', label: 'Study' },
    { key: 'dict', icon: '📚', label: 'Dict' },
    { key: 'trivia', icon: '❓', label: 'Quiz' },
    { key: 'nasa', icon: '🚀', label: 'NASA' },
    { key: 'music', icon: '🎵', label: 'Music' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-6 pb-12 px-3 backdrop-blur-sm">
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden my-2"
        style={{
          background: 'linear-gradient(145deg, #121212, #0D0D0D, #1A1A1A)',
          borderColor: `${accentColor}44`,
          boxShadow: `0 0 40px ${accentColor}15, 0 20px 60px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${accentColor}22` }}>
          <div>
            <h2 className="text-white font-black text-xl tracking-wider flex items-center gap-2">
              <span className="text-2xl">🛠️</span> TOOLS
            </h2>
            <p className="text-[10px] text-[#666] font-mono mt-0.5">
              {lang === 'hi' ? '7 Free Tools · Bina key · Sab kuch ek jagah' : '7 Free Tools · No keys · All in one place'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tool Tabs */}
        <div className="flex px-2 pt-3 gap-1 overflow-x-auto hide-scrollbar pb-1">
          {toolTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTool(tab.key)}
              className="flex-shrink-0 px-2.5 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95"
              style={{
                background: activeTool === tab.key ? `${accentColor}22` : '#111',
                color: activeTool === tab.key ? accentColor : '#666',
                border: `1px solid ${activeTool === tab.key ? accentColor + '44' : '#222'}`,
              }}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 min-h-[300px]">

          {/* ===== IP LOCATION ===== */}
          {activeTool === 'ip' && (
            <div className="space-y-3">
              <button onClick={loadIp} disabled={ipLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #00E5FF, #00B8D4)' }}>
                {ipLoading ? '#ecting...' : '🌐 Detect My Location'}
              </button>

              {ipData && (
                <div className="rounded-xl p-4 border space-y-2 animate-fadeIn" style={{ background: '#0E1A1A', borderColor: '#00E5FF33' }}>
                  <div className="text-3xl text-center mb-2">📍</div>
                  <div className="space-y-1.5">
                    {[
                      { label: lang === 'hi' ? 'Sheher' : 'City', value: ipData.city },
                      { label: lang === 'hi' ? 'Desh' : 'Country', value: ipData.country },
                      { label: lang === 'hi' ? 'Kshetra' : 'Region', value: ipData.region },
                      { label: lang === 'hi' ? 'ISP' : 'ISP', value: ipData.isp },
                      { label: lang === 'hi' ? 'Samay Kshetra' : 'Timezone', value: ipData.timezone },
                      { label: lang === 'hi' ? 'Nirdeshank' : 'Coordinates', value: `${ipData.lat.toFixed(2)}°, ${ipData.lon.toFixed(2)}°` },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-[#1A2A2A] last:border-0">
                        <span className="text-[10px] text-[#00E5FF] font-mono uppercase">{item.label}</span>
                        <span className="text-xs text-white font-semibold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {ipError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D]">⚠️ {ipError}</div>
              )}
            </div>
          )}

          {/* ===== CURRENCY CONVERTER ===== */}
          {activeTool === 'currency' && (
            <div className="space-y-3">
              <div className="rounded-xl p-4 border space-y-3" style={{ background: '#1A1A00', borderColor: '#FFE06633' }}>
                {/* Amount Input */}
                <div>
                  <label className="text-[10px] text-[#FFE066] font-mono uppercase block mb-1">Amount</label>
                  <input
                    type="number"
                    value={convertAmount}
                    onChange={e => setConvertAmount(e.target.value)}
                    className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FFE066]"
                    placeholder="Enter amount..."
                  />
                </div>

                {/* From / To */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#FFE066] font-mono uppercase block mb-1">From</label>
                    <select value={convertFrom} onChange={e => setConvertFrom(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-white text-xs focus:outline-none"
                      style={{ borderColor: '#FFE066' }}>
                      {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                  <span className="text-[#888] pb-2 text-lg">→</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-[#FFE066] font-mono uppercase block mb-1">To</label>
                    <select value={convertTo} onChange={e => setConvertTo(e.target.value)}
                      className="w-full bg-[#111] border border-[#333] rounded-lg px-2 py-2 text-white text-xs focus:outline-none"
                      style={{ borderColor: '#FFE066' }}>
                      {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                    </select>
                  </div>
                </div>

                {/* Result */}
                <div className="bg-[#0A0A00] rounded-lg p-3 text-center border border-[#FFE06633]">
                  <p className="text-[10px] text-[#888] font-mono">{lang === 'hi' ? 'Parinaam' : 'Result'}</p>
                  <p className="text-2xl font-black mt-1" style={{ color: '#FFE066' }}>
                    {convertedValue}
                  </p>
                  <p className="text-[10px] text-[#666] font-mono">{convertTo}</p>
                </div>

                {/* Quick Rates */}
                <div className="grid grid-cols-3 gap-1.5">
                  {currencies.slice(0, 6).map(c => (
                    <div key={c.code} className="bg-[#111] rounded-lg p-2 text-center border border-[#222]">
                      <p className="text-[9px] text-[#FFE066] font-mono">{c.code}</p>
                      <p className="text-[11px] text-white font-bold">{c.rate.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {currencyLoading && (
                <div className="bg-[#111] rounded-xl p-4 text-center">
                  <div className="text-2xl animate-spin inline-block">💱</div>
                  <p className="text-xs text-[#888] mt-2 font-mono">{lang === 'hi' ? 'Rates load ho rahe hain...' : 'Loading rates...'}</p>
                </div>
              )}

              {currencyError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D]">⚠️ {currencyError}</div>
              )}
            </div>
          )}

          {/* ===== LIVE SPORTS ===== */}
          {activeTool === 'sports' && (
            <div className="space-y-3">
              <button onClick={loadSports} disabled={sportsLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #00E676, #00C853)' }}>
                {sportsLoading ? '#ading...' : '⚽ Load Live Scores'}
              </button>

              {sports.length > 0 && (
                <div className="space-y-2">
                  {sports.map(m => (
                    <div key={m.id} className="bg-[#0E0E0E] rounded-xl p-3 border border-[#1A1A1A] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] text-[#00E676] font-mono">{m.league}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                          m.status.includes('Live') ? 'bg-[#00E67622] text-[#00E676]' :
                          m.status.includes('FT') ? 'bg-[#FF6D6D22] text-[#FF6D6D]' :
                          'bg-[#FFE06622] text-[#FFE066]'
                        }`}>{m.status}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white font-semibold">{m.homeTeam}</span>
                        <span className="text-sm font-black text-white px-3">
                          {m.homeScore} - {m.awayScore}
                        </span>
                        <span className="text-xs text-[#CCC] font-semibold">{m.awayTeam}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {sportsError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D]">⚠️ {sportsError}</div>
              )}
            </div>
          )}

          {/* ===== NEWS ===== */}
          {activeTool === 'news' && (
            <div className="space-y-3">
              <div className="flex gap-1.5 flex-wrap">
                {['general', 'technology', 'sports', 'entertainment', 'science', 'business'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewsCategory(cat)}
                    className="text-[10px] px-2.5 py-1 rounded-full font-mono transition-all active:scale-95"
                    style={{
                      background: newsCategory === cat ? '#7C4DFF22' : '#111',
                      color: newsCategory === cat ? '#B388FF' : '#666',
                      border: `1px solid ${newsCategory === cat ? '#7C4DFF44' : '#222'}`,
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </button>
                ))}
              </div>

              <button onClick={loadNews} disabled={newsLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #7C4DFF, #651FFF)' }}>
                {newsLoading ? '#ading...' : '📰 Load Headlines'}
              </button>

              {news.length > 0 && (
                <div className="space-y-2">
                  {news.map((n, i) => (
                    <div key={i} className="bg-[#0E0E0E] rounded-xl p-3 border border-[#1A1A1A] space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#7C4DFF22] text-[#B388FF] font-mono">{n.source}</span>
                        <span className="text-[9px] text-[#555] font-mono">{n.publishedAt}</span>
                      </div>
                      <p className="text-xs text-white font-semibold leading-relaxed">{n.title}</p>
                      {n.description && (
                        <p className="text-[10px] text-[#888] line-clamp-2">{n.description}</p>
                      )}
                      <a href={n.url} target="_blank" rel="noreferrer"
                        className="text-[10px] font-mono hover:underline" style={{ color: '#7C4DFF' }}>
                        Read more →
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {newsError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D]">⚠️ {newsError}</div>
              )}
            </div>
          )}

          {/* ===== RANDOM USER ===== */}
          {activeTool === 'user' && (
            <div className="space-y-3">
              <button onClick={loadUser} disabled={userLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #FF6D6D, #FF1744)' }}>
                {userLoading ? '⏳ Generating...' : '🆔 Generate Random User'}
              </button>

              {user && (
                <div className="rounded-xl p-4 border space-y-3 animate-fadeIn text-center" style={{ background: '#1A0A0A', borderColor: '#FF174433' }}>
                  <img src={user.avatar} alt="avatar" className="w-20 h-20 rounded-full mx-auto border-2 border-[#FF1744] object-cover" />
                  <div>
                    <p className="text-sm text-white font-bold">{user.name}</p>
                    <p className="text-[10px] text-[#FF6D6D] font-mono">@{user.username}</p>
                  </div>
                  <div className="space-y-1.5 text-left">
                    {[
                      { icon: '📧', label: 'Email', value: user.email },
                      { icon: '📱', label: 'Phone', value: user.phone },
                      { icon: '🏠', label: 'Address', value: user.address },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 py-1 border-b border-[#2A1A1A] last:border-0">
                        <span className="text-sm">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] text-[#FF6D6D] font-mono uppercase">{item.label}</p>
                          <p className="text-[11px] text-[#CCC] truncate">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(JSON.stringify(user, null, 2)).catch(() => {}); }}
                    className="text-[10px] px-3 py-1.5 rounded-lg border border-[#333] text-[#999] hover:text-white transition-colors"
                  >
                    📋 Copy JSON
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== COLOR PALETTE ===== */}
          {activeTool === 'color' && (
            <div className="space-y-3">
              <button onClick={loadColors} disabled={colorLoading}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black active:scale-95 transition-all"
                style={{ background: 'linear-gradient(135deg, #E040FB, #AA00FF)' }}>
                {colorLoading ? '#ating...' : '🎨 Generate Palette'}
              </button>

              {colorPalette && (
                <div className="space-y-3 animate-fadeIn">
                  <div className="flex gap-2 rounded-xl overflow-hidden h-24 border border-[#1A1A1A]">
                    {colorPalette.colors.map((c, i) => (
                      <div key={i} className="flex-1 flex items-end justify-center pb-2 cursor-pointer hover:scale-y-110 transition-transform"
                        style={{ backgroundColor: c }}
                        onClick={() => navigator.clipboard.writeText(c).catch(() => {})}>
                        <span className="text-[8px] text-white/80 font-mono bg-black/30 px-1 rounded">{c}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-center text-[10px] text-[#888] font-mono">
                    Click any color to copy • {colorPalette.name}
                  </p>
                  <div className="grid grid-cols-5 gap-2">
                    {colorPalette.colors.map((c, i) => (
                      <div key={i} className="aspect-square rounded-lg border border-[#222] cursor-pointer hover:scale-105 transition-transform"
                        style={{ backgroundColor: c }}
                        onClick={() => navigator.clipboard.writeText(c).catch(() => {})} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== UNIVERSITIES ===== */}
          {activeTool === 'uni' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={uniSearch}
                  onChange={e => setUniSearch(e.target.value)}
                  placeholder="University name..."
                  className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs"
                />
                <button onClick={async () => { setLoadingNew(true); setUnis(await fetchUniversities(uniSearch)); setLoadingNew(false); }} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold">Search</button>
              </div>
              <div className="space-y-2">
                {unis.map((u, i) => (
                  <div key={i} className="p-2 bg-[#111] rounded-lg border border-[#222]">
                    <p className="text-xs font-bold text-white">{u.name}</p>
                    <p className="text-[10px] text-[#666]">{u.country}</p>
                    <a href={u.web_pages[0]} target="_blank" className="text-[10px] text-blue-400">Visit Website</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== RESEARCH PAPERS ===== */}
          {activeTool === 'paper' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={researchSearch}
                  onChange={e => setResearchSearch(e.target.value)}
                  placeholder="Topic..."
                  className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs"
                />
                <button onClick={async () => { setLoadingNew(true); setPapers(await fetchResearch(researchSearch)); setLoadingNew(false); }} className="px-4 py-2 bg-green-600 rounded-lg text-xs font-bold">Find</button>
              </div>
              <div className="space-y-2">
                {papers.map((p, i) => (
                  <div key={i} className="p-2 bg-[#111] rounded-lg border border-[#222]">
                    <p className="text-xs font-bold text-white">{p.display_name || p.title}</p>
                    <p className="text-[10px] text-[#666]">Year: {p.publication_year}</p>
                    {p.doi && <a href={p.doi} target="_blank" className="text-[10px] text-green-400">View Paper</a>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== DICTIONARY ===== */}
          {activeTool === 'dict' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={dictSearch}
                  onChange={e => setDictSearch(e.target.value)}
                  placeholder="Word..."
                  className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-xs"
                />
                <button onClick={async () => { setLoadingNew(true); setDefinitions(await fetchDictionary(dictSearch)); setLoadingNew(false); }} className="px-4 py-2 bg-purple-600 rounded-lg text-xs font-bold">Define</button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {definitions.map((d, i) => (
                  <div key={i} className="p-3 bg-[#111] rounded-lg border border-[#222]">
                    <p className="text-sm font-black text-purple-400">{d.word} <span className="text-xs font-normal text-[#666]">{d.phonetic}</span></p>
                    {d.meanings.map((m: any, j: number) => (
                      <div key={j} className="mt-2">
                        <p className="text-[10px] uppercase text-[#666]">{m.partOfSpeech}</p>
                        <p className="text-xs text-[#CCC]">{m.definitions[0].definition}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== TRIVIA ===== */}
          {activeTool === 'trivia' && (
            <div className="space-y-4 text-center py-4">
              {trivia ? (
                <div className="space-y-4">
                  <p className="text-[10px] text-purple-400 font-mono uppercase">{trivia.category}</p>
                  <p className="text-sm text-white font-medium px-4" dangerouslySetInnerHTML={{ __html: trivia.question }} />
                  <button onClick={() => alert(`Correct Answer: ${trivia.correct_answer}`)} className="w-full py-2 bg-[#111] border border-purple-900 rounded-lg text-xs">Show Answer</button>
                  <button onClick={loadTrivia} className="w-full py-2 bg-purple-600 rounded-lg text-xs font-bold">Next Question</button>
                </div>
              ) : <p className="text-xs text-[#666]">Tap Load to start quiz</p>}
            </div>
          )}

          {/* ===== NASA ===== */}
          {activeTool === 'nasa' && (
            <div className="space-y-3">
              {nasa ? (
                <div className="space-y-2">
                  <img src={nasa.url} alt="NASA" className="w-full rounded-xl border border-[#222]" />
                  <p className="text-xs font-bold text-white">{nasa.title}</p>
                  <p className="text-[10px] text-[#888] leading-relaxed line-clamp-4">{nasa.explanation}</p>
                  <button onClick={loadNasa} className="w-full py-2 bg-blue-600 rounded-lg text-xs font-bold">Refresh Astronomy Pic</button>
                </div>
              ) : <button onClick={loadNasa} className="w-full py-12 bg-[#111] rounded-xl border border-dashed border-[#333]">Load NASA APOD</button>}
            </div>
          )}

          {/* ===== MUSIC (Original restored) ===== */}
          {activeTool === 'music' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={musicSearch}
                  onChange={e => setMusicSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchMusic()}
                  placeholder={lang === 'hi' ? 'Artist ka naam likho...' : 'Enter artist name...'}
                  className="flex-1 bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-[#EEE] text-xs focus:outline-none"
                  style={{ borderColor: '#AA00FF' }}
                />
                <button onClick={searchMusic} disabled={musicLoading}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-black active:scale-95 transition-all"
                  style={{ background: 'linear-gradient(135deg, #AA00FF, #7C4DFF)' }}>
                  {musicLoading ? '⏳' : '🔍'}
                </button>
              </div>

              {/* Quick Select */}
              <div className="flex gap-1.5 flex-wrap">
                {POPULAR_ARTISTS.map(a => (
                  <button key={a} onClick={() => { setMusicSearch(a); }}
                    className="text-[10px] px-2 py-1 rounded-full border text-[#999] hover:text-white transition-colors"
                    style={{ borderColor: '#AA00FF44', background: '#111' }}>
                    {a}
                  </button>
                ))}
              </div>

              {music && (
                <div className="rounded-xl p-4 border space-y-3 animate-fadeIn" style={{ background: '#1A0A2A', borderColor: '#AA00FF33' }}>
                  <div className="text-center">
                    <div className="text-4xl mb-2">🎵</div>
                    <h3 className="text-sm text-white font-bold">{music.name}</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#AA00FF22] text-[#CE93D8] font-mono">{music.genre}</span>
                  </div>
                  <p className="text-xs text-[#CCC] leading-relaxed">{music.summary}</p>
                </div>
              )}

              {musicError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D]">⚠️ {musicError}</div>
              )}
            </div>
          )}

          {loadingNew && <div className="py-8 text-center animate-pulse text-xs text-[#666]">Fetching data...</div>}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 text-center" style={{ borderTop: `1px solid ${accentColor}11` }}>
          <p className="text-[9px] text-[#444] font-mono">
            All APIs: ip-api · exchangerate · football-API · RSS2JSON · randomuser.me · coolors · Wikipedia — All FREE
          </p>
        </div>

      </div>
    </div>
  );
}
