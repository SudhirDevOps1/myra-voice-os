import { useCallback, useEffect, useMemo, useState } from 'react';

/* ─────────────────── Props & Types ─────────────────── */
interface ToolsDashboardProps {
  open: boolean;
  accentColor: string;
  onClose: () => void;
  lang: 'en' | 'hi';
}

interface IpData {
  ip: string; city: string; region: string; country: string;
  lat: number; lon: number; timezone: string; isp: string;
}
interface CurrencyRate { code: string; name: string; rate: number; }
interface SportMatch {
  id: string; league: string; home: string; away: string;
  homeScore: string; awayScore: string; status: string; date: string;
}
interface NewsItem { title: string; desc: string; url: string; source: string; time: string; }
interface User { name: string; username: string; email: string; phone: string; address: string; avatar: string; }
interface University { name: string; country: string; web_pages: string[]; }
interface Paper { display_name: string; publication_year: number; cited_by_count: number; doi?: string; landing?: string; }
interface DictEntry { word: string; phonetic?: string; meanings: { partOfSpeech: string; definitions: { definition: string; example?: string }[] }[]; }
interface MovieCard { id: string; title: string; year: string; type: string; poster: string; }
interface TransitStop { id: string; name: string; type: string; lat?: number; lon?: number; }
interface TriviaQ { category: string; question: string; correct_answer: string; incorrect_answers: string[]; }
interface NasaApod { title: string; url: string; explanation: string; media_type: string; date: string; }
interface Country { name: string; official: string; capital: string; region: string; pop: string; area: string; langs: string; curr: string; flag: string; maps: string; }

type ToolKey = 'ip' | 'currency' | 'sports' | 'news' | 'user' | 'colors' | 'university' | 'research' |
  'dictionary' | 'movies' | 'transit' | 'devai' | 'math' | 'trivia' | 'nasa' | 'music' |
  'recipes' | 'cocktails' | 'poetry' | 'countries' | 'github';

const TOOL_TABS: { key: ToolKey; icon: string; label: string; category: string }[] = [
  { key: 'ip',         icon: '🌐', label: 'IP',       category: 'Network'   },
  { key: 'currency',   icon: '💱', label: 'Money',    category: 'Finance'   },
  { key: 'sports',     icon: '⚽', label: 'Sports',   category: 'Live'      },
  { key: 'news',       icon: '📰', label: 'News',     category: 'Media'     },
  { key: 'user',       icon: '🆔', label: 'User',     category: 'Dev'       },
  { key: 'colors',     icon: '🎨', label: 'Colors',   category: 'Design'    },
  { key: 'university', icon: '🎓', label: 'Uni',      category: 'Education' },
  { key: 'research',   icon: '📊', label: 'Papers',   category: 'Academic'  },
  { key: 'dictionary', icon: '📚', label: 'Dict',     category: 'Language'  },
  { key: 'movies',     icon: '🎬', label: 'Movies',   category: 'Media'     },
  { key: 'transit',    icon: '🚌', label: 'Transit',  category: 'Travel'    },
  { key: 'devai',      icon: '🤖', label: 'DevAI',    category: 'AI'        },
  { key: 'math',       icon: '🧮', label: 'Math',     category: 'Tools'     },
  { key: 'trivia',     icon: '❓', label: 'Quiz',     category: 'Fun'       },
  { key: 'nasa',       icon: '🚀', label: 'NASA',     category: 'Science'   },
  { key: 'music',      icon: '🎵', label: 'Music',    category: 'Art'       },
  { key: 'recipes',    icon: '🍲', label: 'Food',     category: 'Life'      },
  { key: 'cocktails',  icon: '🍹', label: 'Drinks',   category: 'Life'      },
  { key: 'poetry',     icon: '📜', label: 'Poetry',   category: 'Art'       },
  { key: 'countries',  icon: '🌍', label: 'World',    category: 'Info'      },
  { key: 'github',     icon: '💻', label: 'GitHub',   category: 'Dev'       },
];

const CURRENCIES: Record<string, string> = {
  USD: 'US Dollar', INR: 'Indian Rupee', EUR: 'Euro', GBP: 'British Pound',
  JPY: 'Japanese Yen', CNY: 'Chinese Yuan', AUD: 'Australian Dollar', CAD: 'Canadian Dollar',
  CHF: 'Swiss Franc', SGD: 'Singapore Dollar', AED: 'UAE Dirham', SAR: 'Saudi Riyal',
  KRW: 'South Korean Won', BRL: 'Brazilian Real', ZAR: 'South African Rand', THB: 'Thai Baht',
};

const FALLBACK_NEWS: NewsItem[] = [
  { title: 'Tech advances reshape daily life', desc: 'New AI tools transform how people work globally.', url: '#', source: 'Tech Today', time: 'Now' },
  { title: 'Global climate deal reached', desc: 'World leaders commit to new carbon targets.', url: '#', source: 'World News', time: 'Now' },
  { title: 'New Mars mission announced', desc: 'International agencies reveal space plans.', url: '#', source: 'Science Daily', time: 'Now' },
];
const FALLBACK_SPORTS: SportMatch[] = [
  { id: '1', league: 'Premier League', home: 'Arsenal', away: 'Chelsea', homeScore: '2', awayScore: '1', status: '🟡 Sample', date: 'API fallback' },
  { id: '2', league: 'IPL', home: 'Mumbai Indians', away: 'CSK', homeScore: '185', awayScore: '142', status: '🔴 Finished', date: 'API fallback' },
  { id: '3', league: 'NBA', home: 'Lakers', away: 'Warriors', homeScore: '112', awayScore: '108', status: '🟢 Q4', date: 'API fallback' },
];

/* ─────────────────── API helpers ─────────────────── */
async function safeFetch(url: string, opts?: RequestInit): Promise<any> {
  const ctrl = new AbortController();
  const tid = window.setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { ...opts, signal: ctrl.signal });
    window.clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url.split('?')[0]}`);
    return await res.json();
  } catch (err) {
    window.clearTimeout(tid);
    throw err;
  }
}

function stripHtml(html: string) { return html.replace(/<[^>]+>/g, ''); }
function decodeHtml(text: string) {
  if (typeof document === 'undefined') return text;
  const el = document.createElement('div'); el.innerHTML = text; return el.textContent || text;
}
function hsv2hex(h: number, s: number, l: number) {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => { const k = (n + h / 30) % 12; return Math.round((l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))) * 255); };
  return `#${[f(0), f(8), f(4)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}
function generatePalette(): string[] {
  const base = Math.floor(Math.random() * 360);
  const angles = [0, 30, 60, 210, 300];
  return angles.map(offset => hsv2hex((base + offset) % 360, 65 + Math.random() * 20, 40 + Math.random() * 25));
}
function evalMath(expr: string): string {
  const clean = expr.trim();
  if (!/^[0-9+\-*/().%\s^]+$/.test(clean)) throw new Error('Use numbers and operators only: + - * / ^ ( ) %');
  const normalized = clean.replace(/\^/g, '**').replace(/(\d+)%/g, '($1/100)');
  // eslint-disable-next-line no-new-func
  const result = Function(`"use strict"; return (${normalized})`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) throw new Error('Invalid expression');
  return Number(result.toFixed(10)).toLocaleString(undefined, { maximumSignificantDigits: 10 });
}
function readAloud(text: string) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[\p{Extended_Pictographic}\u{1F300}-\u{1FAFF}]/gu, '').replace(/\s+/g, ' ').trim();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = 0.92; u.pitch = 1.02;
  window.speechSynthesis.speak(u);
}

/* ─────────────────── Sub-components ─────────────────── */
function Spinner() {
  return (
    <div className="py-10 flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-[#333] border-t-current rounded-full animate-spin" />
      <p className="text-xs text-[#666] font-mono">Fetching data...</p>
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="bg-[#1A0000] border border-[#FF174455] rounded-xl p-3.5 flex items-start gap-2.5">
      <span className="text-lg">⚠️</span>
      <div>
        <p className="text-xs font-bold text-[#FF6D6D]">Something went wrong</p>
        <p className="text-[11px] text-[#CC5555] mt-0.5">{msg}</p>
      </div>
    </div>
  );
}

function Empty({ msg = 'Search or click the button to load data.' }: { msg?: string }) {
  return <p className="text-xs text-[#666] text-center py-8">{msg}</p>;
}

function Tag({ children, color = '#555' }: { children: React.ReactNode; color?: string }) {
  return <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-mono" style={{ backgroundColor: color + '22', color }}>{children}</span>;
}

function RowKV({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between items-center gap-4 py-1.5 border-b border-[#1C1C1C] last:border-0">
      <span className="text-[10px] text-[#666] font-mono uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-xs text-white font-medium text-right break-all">{value || '—'}</span>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl p-3.5 ${className}`}>{children}</div>;
}

function PillBar({ items, active, onChange, accent }: {
  items: string[]; active: string; onChange: (v: string) => void; accent: string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map(item => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className="mini-chip capitalize"
          style={active === item ? { borderColor: accent, color: accent, background: accent + '18' } : {}}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function CardItems({ items }: { items: { title: string; sub?: string; url?: string; badge?: string }[] }) {
  if (!items.length) return <Empty />;
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={`${item.title}-${i}`} className="bg-[#0E0E0E] border border-[#1E1E1E] rounded-xl p-3 group hover:border-[#333] transition-colors">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs text-white font-semibold leading-snug flex-1">{item.title}</p>
            {item.badge && <span className="text-[9px] bg-[#222] text-[#888] px-1.5 py-0.5 rounded font-mono shrink-0">{item.badge}</span>}
          </div>
          {item.sub && <p className="text-[10px] text-[#666] mt-1">{item.sub}</p>}
          {item.url && item.url !== '#' && (
            <a href={item.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1.5 inline-flex items-center gap-0.5">
              Open <span className="text-[9px]">↗</span>
            </a>
          )}
        </div>
      ))}
    </div>
  );
}

function ActionBtn({ onClick, disabled, children, color, variant = 'solid' }: {
  onClick: () => void; disabled?: boolean; children: React.ReactNode; color: string; variant?: 'solid' | 'outline';
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
      style={variant === 'solid'
        ? { backgroundColor: color, color: '#000' }
        : { borderWidth: 1, borderColor: color, color, background: color + '10' }
      }
    >
      {children}
    </button>
  );
}

function SearchBox({ value, setValue, onSearch, placeholder, accent, label }: {
  value: string; setValue: (v: string) => void; onSearch: () => void;
  placeholder: string; accent: string; label?: string;
}) {
  return (
    <div className="space-y-1.5">
      {label && <p className="text-[10px] text-[#666] font-mono uppercase">{label}</p>}
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          placeholder={placeholder}
          className="tool-input flex-1"
        />
        <button
          onClick={onSearch}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 shrink-0"
          style={{ backgroundColor: accent, color: '#000' }}
        >
          Search
        </button>
      </div>
    </div>
  );
}

function SectionHeader({ icon, title, onRead }: { icon: string; title: string; onRead?: () => void }) {
  return (
    <div className="flex items-center justify-between pb-1">
      <h3 className="text-white font-black text-sm flex items-center gap-2">
        <span className="text-base">{icon}</span>{title}
      </h3>
      {onRead && (
        <button onClick={onRead} className="mini-chip text-[9px] gap-1">🔊 Listen</button>
      )}
    </div>
  );
}

/* ─────────────────── Main Component ─────────────────── */
export default function ToolsDashboard({ open, accentColor, onClose, lang }: ToolsDashboardProps) {
  const [activeTool, setActiveTool] = useState<ToolKey>('ip');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [ipData, setIpData] = useState<IpData | null>(null);
  const [rates, setRates] = useState<CurrencyRate[]>([]);
  const [amount, setAmount] = useState('1');
  const [fromCur, setFromCur] = useState('USD');
  const [toCur, setToCur] = useState('INR');
  const [sports, setSports] = useState<SportMatch[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsCat, setNewsCat] = useState('world');
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [palette, setPalette] = useState<string[]>(generatePalette);
  const [uniQ, setUniQ] = useState('IIT');
  const [unis, setUnis] = useState<University[]>([]);
  const [paperQ, setPaperQ] = useState('machine learning');
  const [papers, setPapers] = useState<Paper[]>([]);
  const [wordQ, setWordQ] = useState('serendipity');
  const [dictEntries, setDictEntries] = useState<DictEntry[]>([]);
  const [dictSimple, setDictSimple] = useState('');
  const [movieQ, setMovieQ] = useState('Avengers');
  const [movies, setMovies] = useState<MovieCard[]>([]);
  const [transitQ, setTransitQ] = useState('Berlin Hbf');
  const [stops, setStops] = useState<TransitStop[]>([]);
  const [devPrompt, setDevPrompt] = useState('Write a Python function to check if a number is prime');
  const [devResult, setDevResult] = useState('');
  const [mathExpr, setMathExpr] = useState('(100 + 200) * 3 / 15');
  const [mathResult, setMathResult] = useState('');
  const [trivia, setTrivia] = useState<TriviaQ | null>(null);
  const [triviaAns, setTriviaAns] = useState(false);
  const [nasa, setNasa] = useState<NasaApod | null>(null);
  const [artistQ, setArtistQ] = useState('Arijit Singh');
  const [artistInfo, setArtistInfo] = useState<{ name: string; summary: string; url: string } | null>(null);
  const [recipeQ, setRecipeQ] = useState('chicken');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [cocktailQ, setCocktailQ] = useState('margarita');
  const [cocktails, setCocktails] = useState<any[]>([]);
  const [poems, setPoems] = useState<any[]>([]);
  const [countryQ, setCountryQ] = useState('India');
  const [country, setCountry] = useState<Country | null>(null);
  const [ghQ, setGhQ] = useState('react');
  const [ghRepos, setGhRepos] = useState<any[]>([]);

  const converted = useMemo(() => {
    const fr = rates.find(r => r.code === fromCur)?.rate;
    const tr = rates.find(r => r.code === toCur)?.rate;
    const n = parseFloat(amount);
    if (!fr || !tr || isNaN(n)) return '—';
    return ((n / fr) * tr).toLocaleString(undefined, { maximumFractionDigits: 4 });
  }, [rates, fromCur, toCur, amount]);

  const run = useCallback(async (task: () => Promise<void>) => {
    setLoading(true); setError('');
    try { await task(); }
    catch (e: any) { setError(e?.message || 'Network error. Try again.'); }
    finally { setLoading(false); }
  }, []);

  /* ─── API loaders ─── */
  const loadIp = useCallback(() => run(async () => {
    const tryFetch = async (url: string, map: (d: any) => IpData) => { const d = await safeFetch(url); setIpData(map(d)); };
    const tries = [
      () => tryFetch('https://ipwho.is/', d => ({ ip: d.ip, city: d.city || '?', region: d.region || '', country: d.country || '?', lat: d.latitude || 0, lon: d.longitude || 0, timezone: d.timezone?.id || '', isp: d.connection?.isp || '' })),
      () => tryFetch('https://ipapi.co/json/', d => ({ ip: d.ip, city: d.city || '?', region: d.region || '', country: d.country_name || '?', lat: d.latitude || 0, lon: d.longitude || 0, timezone: d.timezone || '', isp: d.org || '' })),
      () => tryFetch('https://api.ipify.org?format=json', d => ({ ip: d.ip, city: '—', region: '—', country: '—', lat: 0, lon: 0, timezone: '—', isp: '—' })),
    ];
    for (const t of tries) { try { await t(); return; } catch { /* next */ } }
    throw new Error('All IP APIs failed.');
  }), [run]);

  const loadCurrency = useCallback(() => run(async () => {
    const data = await safeFetch(`https://open.er-api.com/v6/latest/${fromCur}`);
    if (data.result !== 'success' && !data.rates) throw new Error('Exchange rate API unavailable.');
    setRates(Object.entries(CURRENCIES).filter(([c]) => data.rates?.[c]).map(([code, name]) => ({ code, name, rate: data.rates[code] })));
  }), [run, fromCur]);

  const loadSports = useCallback(() => run(async () => {
    try {
      const d = await safeFetch('https://www.thesportsdb.com/api/v1/json/3/eventsnextleague.php?id=4328');
      const matches = (d.events || []).slice(0, 8).map((e: any) => ({
        id: e.idEvent, league: e.strLeague || 'Football',
        home: e.strHomeTeam, away: e.strAwayTeam,
        homeScore: e.intHomeScore ?? '—', awayScore: e.intAwayScore ?? '—',
        status: e.strStatus || 'Upcoming', date: `${e.dateEvent || ''} ${e.strTime || ''}`.trim(),
      }));
      setSports(matches.length ? matches : FALLBACK_SPORTS);
    } catch { setSports(FALLBACK_SPORTS); }
  }), [run]);

  const loadNews = useCallback(() => run(async () => {
    const feeds: Record<string, string> = {
      world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
      technology: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
      sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
      business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
      science: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    };
    try {
      const rss = await safeFetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feeds[newsCat] || feeds.world)}`);
      const articles = (rss.items || []).slice(0, 10).map((item: any) => ({
        title: item.title || 'Untitled',
        desc: stripHtml(item.description || '').slice(0, 150),
        url: item.link || '#',
        source: rss.feed?.title || 'BBC',
        time: item.pubDate ? new Date(item.pubDate).toLocaleDateString() : '',
      }));
      setNews(articles.length ? articles : FALLBACK_NEWS);
    } catch { setNews(FALLBACK_NEWS); }
  }), [run, newsCat]);

  const loadUser = useCallback(() => run(async () => {
    try {
      const d = await safeFetch('https://randomuser.me/api/');
      const p = d.results[0];
      setUserProfile({
        name: `${p.name.first} ${p.name.last}`, username: p.login.username,
        email: p.email, phone: p.phone,
        address: `${p.location.street.number} ${p.location.street.name}, ${p.location.city}, ${p.location.country}`,
        avatar: p.picture.large,
      });
    } catch {
      const id = Math.random().toString(36).slice(2, 9);
      setUserProfile({ name: `Test User ${id}`, username: `test_${id}`, email: `${id}@example.com`, phone: '+91 98765 43210', address: 'Mumbai, Maharashtra, India', avatar: `https://api.dicebear.com/8.x/personas/svg?seed=${id}` });
    }
  }), [run]);

  const loadUni = useCallback(() => run(async () => {
    const data = await safeFetch(`https://universities.hipolabs.com/search?name=${encodeURIComponent(uniQ)}`);
    if (!Array.isArray(data) || !data.length) throw new Error(`No universities found for "${uniQ}". Try: MIT, Oxford, IIT`);
    setUnis(data.slice(0, 12));
  }), [run, uniQ]);

  const loadPapers = useCallback(() => run(async () => {
    const data = await safeFetch(`https://api.openalex.org/works?search=${encodeURIComponent(paperQ)}&per-page=10&select=display_name,publication_year,cited_by_count,doi,primary_location`);
    if (!data.results?.length) throw new Error('No papers found. Try: quantum computing, neural networks');
    setPapers(data.results.map((p: any) => ({
      display_name: p.display_name, publication_year: p.publication_year,
      cited_by_count: p.cited_by_count, doi: p.doi,
      landing: p.primary_location?.landing_page_url,
    })));
  }), [run, paperQ]);

  const loadDict = useCallback(() => run(async () => {
    setDictEntries([]); setDictSimple('');
    const results = await Promise.allSettled([
      safeFetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(wordQ)}`),
      safeFetch(`https://dictionary-api-7hmy.onrender.com/define?word=${encodeURIComponent(wordQ)}`),
    ]);
    if (results[0].status === 'fulfilled') setDictEntries(results[0].value || []);
    if (results[1].status === 'fulfilled') {
      const s = results[1].value;
      setDictSimple(s.definition || s.meaning || s.text || '');
    }
    if (results[0].status === 'rejected' && results[1].status === 'rejected') throw new Error(`Word "${wordQ}" not found.`);
  }), [run, wordQ]);

  const loadMovies = useCallback(() => run(async () => {
    const data = await safeFetch(`https://imdb.iamidiotareyoutoo.com/search?q=${encodeURIComponent(movieQ)}`);
    const list = data.description || data.results || (Array.isArray(data) ? data : []);
    const mapped = (Array.isArray(list) ? list : []).slice(0, 12).map((m: any) => ({
      id: m['#IMDB_ID'] || m.id || String(Math.random()),
      title: m['#TITLE'] || m.title || 'Untitled',
      year: String(m['#YEAR'] || m.year || ''),
      type: m['#TYPE'] || m.type || 'Movie',
      poster: m['#IMG_POSTER'] || m.image || '',
    }));
    if (!mapped.length) throw new Error('No movies found. Try: Avengers, Inception, RRR');
    setMovies(mapped);
  }), [run, movieQ]);

  const loadTransit = useCallback(() => run(async () => {
    const tries = [
      () => safeFetch(`https://v6.db.transport.rest/locations?query=${encodeURIComponent(transitQ)}&results=10`),
      () => safeFetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(transitQ)}&format=json&limit=10`),
    ];
    for (const t of tries) {
      try {
        const data = await t();
        const list = Array.isArray(data) ? data : [];
        if (!list.length) continue;
        setStops(list.slice(0, 10).map((item: any) => ({
          id: item.id || item.place_id || item.name,
          name: item.name || item.display_name || 'Unknown',
          type: item.type || item.class || 'location',
          lat: item.location?.latitude || parseFloat(item.lat) || undefined,
          lon: item.location?.longitude || parseFloat(item.lon) || undefined,
        })));
        return;
      } catch { /* next */ }
    }
    throw new Error('Transit API unavailable. Try cities like: Berlin, Mumbai, Tokyo');
  }), [run, transitQ]);

  const loadDevAI = useCallback((mode: 'generate' | 'fix' | 'user') => run(async () => {
    setDevResult('');
    if (mode === 'user') {
      try {
        const d = await safeFetch('https://devtoolbox-api.devtoolbox-api.workers.dev/random/user');
        setDevResult(JSON.stringify(d, null, 2));
      } catch {
        const id = Math.random().toString(36).slice(2, 9);
        setDevResult(JSON.stringify({ name: `Dev User ${id}`, email: `dev${id}@example.com`, username: `dev_${id}`, phone: `+91-9${id.slice(0,9)}`, job: 'Software Engineer' }, null, 2));
      }
      return;
    }
    const url = mode === 'generate'
      ? 'https://devtoolbox-api.devtoolbox-api.workers.dev/ai/generate'
      : 'https://devtoolbox-api.devtoolbox-api.workers.dev/ai/fix-code';
    const body = mode === 'generate'
      ? { prompt: devPrompt }
      : { code: devPrompt, error: 'Auto-detect and fix all bugs' };
    try {
      const d = await safeFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setDevResult(d.result || d.text || d.response || d.output || JSON.stringify(d, null, 2));
    } catch {
      setDevResult(`DevToolBox API is currently unavailable.\n\nTip: Use the main MYRA chat with your AI provider key for powerful code generation and debugging!`);
    }
  }), [run, devPrompt]);

  const loadMath = useCallback(() => run(async () => {
    setMathResult(evalMath(mathExpr));
  }), [run, mathExpr]);

  const loadTrivia = useCallback(() => run(async () => {
    const d = await safeFetch('https://opentdb.com/api.php?amount=1&type=multiple');
    if (!d.results?.[0]) throw new Error('Trivia API unavailable. Try again in a moment.');
    setTrivia(d.results[0]); setTriviaAns(false);
  }), [run]);

  const loadNasa = useCallback(() => run(async () => {
    const d = await safeFetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!d.url) throw new Error('NASA API unavailable.');
    setNasa(d);
  }), [run]);

  const loadMusic = useCallback(() => run(async () => {
    const search = await safeFetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(artistQ + ' musician')}&format=json&origin=*&srlimit=1`);
    const title = search.query?.search?.[0]?.title;
    if (!title) throw new Error('Artist not found. Try: Taylor Swift, AR Rahman, Coldplay');
    const wiki = await safeFetch(`https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extracts&exintro=1&explaintext=1&format=json&origin=*`);
    const page = wiki.query?.pages?.[Object.keys(wiki.query.pages)[0]];
    setArtistInfo({ name: title, summary: (page?.extract || '').slice(0, 500), url: `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` });
  }), [run, artistQ]);

  const loadRecipes = useCallback(() => run(async () => {
    const d = await safeFetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(recipeQ)}`);
    if (!d.meals?.length) throw new Error(`No recipes for "${recipeQ}". Try: chicken, pasta, biryani, cake`);
    setRecipes(d.meals.slice(0, 8));
  }), [run, recipeQ]);

  const loadCocktails = useCallback(() => run(async () => {
    const d = await safeFetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(cocktailQ)}`);
    if (!d.drinks?.length) throw new Error(`No cocktails for "${cocktailQ}". Try: mojito, margarita, martini`);
    setCocktails(d.drinks.slice(0, 8));
  }), [run, cocktailQ]);

  const loadPoems = useCallback(() => run(async () => {
    const d = await safeFetch('https://poetrydb.org/random/5');
    if (!Array.isArray(d) || !d.length) throw new Error('Poetry API unavailable.');
    setPoems(d.slice(0, 5));
  }), [run]);

  const loadCountry = useCallback(() => run(async () => {
    const d = await safeFetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryQ)}`);
    const c = d?.[0];
    if (!c) throw new Error(`Country "${countryQ}" not found.`);
    setCountry({
      name: c.name?.common, official: c.name?.official, capital: c.capital?.[0] || '—',
      region: `${c.region} / ${c.subregion || '—'}`, pop: c.population?.toLocaleString(),
      area: c.area?.toLocaleString() + ' km²', langs: Object.values(c.languages || {}).join(', '),
      curr: Object.values(c.currencies || {}).map((x: any) => `${x.name} (${x.symbol})`).join(', '),
      flag: c.flags?.svg || c.flags?.png || '', maps: c.maps?.googleMaps || '',
    });
  }), [run, countryQ]);

  const loadGitHub = useCallback(() => run(async () => {
    const d = await safeFetch(`https://api.github.com/search/repositories?q=${encodeURIComponent(ghQ)}&sort=stars&per_page=8`);
    if (!d.items?.length) throw new Error('No repos found. Try: react, python, nextjs');
    setGhRepos(d.items.slice(0, 8).map((r: any) => ({
      name: r.full_name, desc: (r.description || '').slice(0, 100),
      stars: r.stargazers_count, lang: r.language || 'Mixed',
      forks: r.forks_count, url: r.html_url,
    })));
  }), [run, ghQ]);

  // Auto-load on first switch
  useEffect(() => {
    if (!open) return;
    if (activeTool === 'ip' && !ipData) loadIp();
    if (activeTool === 'currency' && !rates.length) loadCurrency();
    if (activeTool === 'sports' && !sports.length) loadSports();
    if (activeTool === 'news' && !news.length) loadNews();
    if (activeTool === 'trivia' && !trivia) loadTrivia();
    if (activeTool === 'nasa' && !nasa) loadNasa();
  }, [activeTool, open, ipData, rates.length, sports.length, news.length, trivia, nasa, loadIp, loadCurrency, loadSports, loadNews, loadTrivia, loadNasa]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex justify-center items-start overflow-y-auto p-3 pt-6 pb-12">
      <div
        className="w-full max-w-lg rounded-2xl border overflow-hidden shadow-2xl my-1"
        style={{ background: '#0C0C0C', borderColor: accentColor + '40', boxShadow: `0 0 60px ${accentColor}18` }}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4" style={{ borderBottom: `1px solid ${accentColor}18` }}>
          <div>
            <h2 className="text-white font-black text-lg tracking-wider flex items-center gap-2">
              <span className="text-xl">🛠️</span> TOOLS HUB
            </h2>
            <p className="text-[10px] text-[#555] font-mono mt-0.5">
              {lang === 'hi' ? '21 Free Tools · No login · Students ke liye' : '21 Free Tools · No login · Student-ready'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1A1A1A] hover:bg-[#252525] flex items-center justify-center transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable Tab Bar ── */}
        <div className="flex gap-1.5 px-3 pt-3 pb-2 overflow-x-auto hide-scrollbar">
          {TOOL_TABS.map(tab => {
            const active = activeTool === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTool(tab.key); setError(''); }}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl text-[11px] font-bold transition-all active:scale-95"
                style={{
                  background: active ? accentColor + '22' : '#141414',
                  color: active ? accentColor : '#666',
                  border: `1px solid ${active ? accentColor + '50' : '#1E1E1E'}`,
                }}
                title={tab.category}
              >
                <span className="text-sm">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Content ── */}
        <div className="p-4 space-y-4 max-h-[68vh] overflow-y-auto">
          {loading && <Spinner />}
          {error && !loading && <ErrBox msg={error} />}

          {/* 1. IP Location */}
          {activeTool === 'ip' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🌐" title="IP Location" onRead={() => ipData && readAloud(`Your IP is ${ipData.ip}. You are in ${ipData.city}, ${ipData.country}.`)} />
              <ActionBtn onClick={loadIp} color={accentColor}>🔍 Detect My Location</ActionBtn>
              {ipData && (
                <Card>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center text-xl">🌍</div>
                    <div><p className="text-white font-bold">{ipData.city}</p><p className="text-[#666] text-xs">{ipData.country}</p></div>
                  </div>
                  {[['IP Address', ipData.ip], ['Region', ipData.region], ['ISP / Org', ipData.isp], ['Timezone', ipData.timezone], ['Coordinates', `${ipData.lat.toFixed(4)}, ${ipData.lon.toFixed(4)}`]].map(([k, v]) => <RowKV key={k} label={k} value={v} />)}
                  {ipData.lat ? <a href={`https://maps.google.com/?q=${ipData.lat},${ipData.lon}`} target="_blank" rel="noreferrer" className="mt-2 text-[10px] text-blue-400 hover:underline inline-block">📍 Open in Google Maps ↗</a> : null}
                </Card>
              )}
            </div>
          )}

          {/* 2. Currency */}
          {activeTool === 'currency' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="💱" title="Currency Converter" onRead={() => readAloud(`${amount} ${fromCur} equals ${converted} ${toCur}`)} />
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <p className="text-[10px] text-[#555] mb-1 font-mono">AMOUNT</p>
                  <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="tool-input" placeholder="1" />
                </div>
                <div>
                  <p className="text-[10px] text-[#555] mb-1 font-mono">FROM</p>
                  <select value={fromCur} onChange={e => setFromCur(e.target.value)} className="tool-input">
                    {Object.entries(CURRENCIES).map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-[10px] text-[#555] mb-1 font-mono">TO</p>
                  <select value={toCur} onChange={e => setToCur(e.target.value)} className="tool-input">
                    {Object.entries(CURRENCIES).map(([c, n]) => <option key={c} value={c}>{c} — {n}</option>)}
                  </select>
                </div>
              </div>
              <ActionBtn onClick={loadCurrency} color={accentColor}>⟳ Refresh Live Rates</ActionBtn>
              {rates.length > 0 && (
                <Card>
                  <p className="text-[10px] text-[#555] font-mono mb-2">RESULT</p>
                  <p className="text-2xl font-black" style={{ color: accentColor }}>{converted} <span className="text-base text-[#888]">{toCur}</span></p>
                  <p className="text-xs text-[#666] mt-1">{amount} {fromCur} = {converted} {toCur}</p>
                  <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-[#1A1A1A]">
                    {rates.slice(0, 8).map(r => (
                      <div key={r.code} className="bg-[#141414] rounded-lg p-1.5 text-center">
                        <p className="text-[9px] text-[#777] font-mono">{r.code}</p>
                        <p className="text-xs text-white font-bold">{r.rate.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* 3. Sports */}
          {activeTool === 'sports' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="⚽" title="Sports Scores" />
              <ActionBtn onClick={loadSports} color={accentColor}>🔄 Load Latest Scores</ActionBtn>
              {sports.length > 0 && sports.map(m => (
                <Card key={m.id}>
                  <div className="flex items-center justify-between mb-2">
                    <Tag color="#10A37F">{m.league}</Tag>
                    <Tag color={m.status.includes('Live') || m.status.includes('Q') ? '#FF1744' : '#888'}>{m.status}</Tag>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-white font-bold flex-1 text-left">{m.home}</p>
                    <p className="text-lg font-black mx-3" style={{ color: accentColor }}>{m.homeScore} — {m.awayScore}</p>
                    <p className="text-xs text-white font-bold flex-1 text-right">{m.away}</p>
                  </div>
                  <p className="text-[9px] text-[#555] text-center mt-2 font-mono">{m.date}</p>
                </Card>
              ))}
            </div>
          )}

          {/* 4. News */}
          {activeTool === 'news' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="📰" title="News Headlines" />
              <PillBar items={['world', 'technology', 'sports', 'business', 'science']} active={newsCat} onChange={c => { setNewsCat(c); setNews([]); }} accent={accentColor} />
              <ActionBtn onClick={loadNews} color={accentColor}>📡 Load {newsCat.charAt(0).toUpperCase() + newsCat.slice(1)} News</ActionBtn>
              {news.map((n, i) => (
                <Card key={i}>
                  <p className="text-xs text-white font-semibold leading-snug">{n.title}</p>
                  {n.desc && <p className="text-[10px] text-[#666] mt-1.5 line-clamp-2">{n.desc}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <Tag color="#7C4DFF">{n.source}</Tag>
                    {n.url !== '#' && <a href={n.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline">Read ↗</a>}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* 5. Random User */}
          {activeTool === 'user' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🆔" title="Random User Generator" />
              <ActionBtn onClick={loadUser} color={accentColor}>👤 Generate Random User</ActionBtn>
              {userProfile && (
                <Card>
                  <div className="flex items-center gap-3 mb-3">
                    <img src={userProfile.avatar} alt="avatar" className="w-16 h-16 rounded-full border-2 object-cover" style={{ borderColor: accentColor }} onError={e => (e.currentTarget.src = `https://api.dicebear.com/8.x/personas/svg?seed=${userProfile.username}`)} />
                    <div>
                      <p className="text-white font-bold">{userProfile.name}</p>
                      <p className="text-[#666] text-xs font-mono">@{userProfile.username}</p>
                    </div>
                  </div>
                  {[['Email', userProfile.email], ['Phone', userProfile.phone], ['Address', userProfile.address]].map(([k, v]) => <RowKV key={k} label={k} value={v} />)}
                  <button onClick={() => navigator.clipboard?.writeText(JSON.stringify(userProfile, null, 2))} className="mini-chip mt-3">📋 Copy as JSON</button>
                </Card>
              )}
            </div>
          )}

          {/* 6. Colors */}
          {activeTool === 'colors' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🎨" title="Color Palette Generator" />
              <ActionBtn onClick={() => setPalette(generatePalette())} color={accentColor}>🎲 Generate New Palette</ActionBtn>
              <div className="flex h-28 rounded-xl overflow-hidden border border-[#222] shadow-inner">
                {palette.map(c => (
                  <button key={c} onClick={() => navigator.clipboard?.writeText(c)} title={c} className="flex-1 flex items-end justify-center pb-2 hover:brightness-110 transition-all active:scale-y-90" style={{ backgroundColor: c }}>
                    <span className="text-[8px] font-mono text-white/70 bg-black/30 px-1 rounded">{c}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {palette.map(c => (
                  <div key={c} className="text-center">
                    <div className="h-10 rounded-lg border border-[#222] mb-1 hover:brightness-110 cursor-pointer" style={{ backgroundColor: c }} onClick={() => navigator.clipboard?.writeText(c)} />
                    <p className="text-[9px] text-[#666] font-mono">{c}</p>
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] text-[#555]">Click any color to copy hex code</p>
            </div>
          )}

          {/* 7. University */}
          {activeTool === 'university' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🎓" title="University Search" />
              <SearchBox value={uniQ} setValue={setUniQ} onSearch={loadUni} placeholder="IIT, MIT, Oxford, Harvard..." accent={accentColor} />
              <PillBar items={['IIT', 'MIT', 'Oxford', 'Stanford', 'Delhi']} active="" onChange={q => { setUniQ(q); }} accent={accentColor} />
              <CardItems items={unis.map(u => ({ title: u.name, sub: u.country, url: u.web_pages?.[0] }))} />
            </div>
          )}

          {/* 8. Research Papers */}
          {activeTool === 'research' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="📊" title="Research Papers (OpenAlex 250M+)" />
              <SearchBox value={paperQ} setValue={setPaperQ} onSearch={loadPapers} placeholder="machine learning, climate change..." accent={accentColor} />
              <PillBar items={['machine learning', 'COVID-19', 'quantum', 'climate', 'cancer']} active="" onChange={q => setPaperQ(q)} accent={accentColor} />
              {papers.map((p, i) => (
                <Card key={i}>
                  <p className="text-xs text-white font-semibold leading-snug">{p.display_name}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {p.publication_year && <Tag color="#4285F4">{p.publication_year}</Tag>}
                    <Tag color="#10A37F">⭐ {p.cited_by_count || 0} citations</Tag>
                  </div>
                  {(p.landing || p.doi) && <a href={p.landing || p.doi} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1.5 inline-block">View Paper ↗</a>}
                </Card>
              ))}
            </div>
          )}

          {/* 9. Dictionary */}
          {activeTool === 'dictionary' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="📚" title="Dictionary (Dual API)" />
              <SearchBox value={wordQ} setValue={setWordQ} onSearch={loadDict} placeholder="serendipity, ephemeral..." accent={accentColor} />
              <PillBar items={['serendipity', 'melancholy', 'ephemeral', 'ubiquitous', 'apple']} active="" onChange={w => setWordQ(w)} accent={accentColor} />
              {dictSimple && <Card><p className="text-[10px] text-[#777] font-mono mb-1">SIMPLIFIED DEFINITION</p><p className="text-sm text-white">{dictSimple}</p></Card>}
              {dictEntries.map(entry => (
                <Card key={entry.word}>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-white font-black">{entry.word}</h4>
                    {entry.phonetic && <span className="text-xs text-[#777] font-mono">{entry.phonetic}</span>}
                    <button onClick={() => readAloud(entry.word)} className="mini-chip ml-auto">🔊</button>
                  </div>
                  {entry.meanings.slice(0, 3).map(m => (
                    <div key={m.partOfSpeech} className="mb-2">
                      <Tag color="#AA00FF">{m.partOfSpeech}</Tag>
                      <p className="text-xs text-[#CCC] mt-1.5">{m.definitions[0]?.definition}</p>
                      {m.definitions[0]?.example && <p className="text-[10px] text-[#666] italic mt-1">"{m.definitions[0].example}"</p>}
                    </div>
                  ))}
                </Card>
              ))}
            </div>
          )}

          {/* 10. Movies */}
          {activeTool === 'movies' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🎬" title="Movies & TV Shows" />
              <SearchBox value={movieQ} setValue={setMovieQ} onSearch={loadMovies} placeholder="Avengers, RRR, Breaking Bad..." accent={accentColor} />
              {movies.length > 0 && (
                <div className="grid grid-cols-2 gap-2">
                  {movies.map(m => (
                    <a key={m.id} href={`https://www.imdb.com/title/${m.id}`} target="_blank" rel="noreferrer" className="card hover:border-[#333] transition-colors">
                      {m.poster && <img src={m.poster} alt={m.title} className="w-full h-32 object-cover rounded-lg bg-[#1A1A1A] mb-2" onError={e => (e.currentTarget.style.display = 'none')} />}
                      <p className="text-white text-xs font-bold leading-snug">{m.title}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {m.year && <Tag color="#FFB300">{m.year}</Tag>}
                        <Tag color="#555">{m.type}</Tag>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 11. Transit */}
          {activeTool === 'transit' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🚌" title="Public Transport Locator" />
              <SearchBox value={transitQ} setValue={setTransitQ} onSearch={loadTransit} placeholder="Berlin, Mumbai, Tokyo station..." accent={accentColor} />
              <PillBar items={['Berlin Hbf', 'Mumbai CST', 'Tokyo', 'London Bridge', 'Paris']} active="" onChange={q => setTransitQ(q)} accent={accentColor} />
              <CardItems items={stops.map(s => ({
                title: s.name, badge: s.type,
                sub: s.lat ? `📍 ${s.lat.toFixed(4)}, ${s.lon?.toFixed(4)}` : undefined,
                url: s.lat ? `https://maps.google.com/?q=${s.lat},${s.lon}` : undefined,
              }))} />
            </div>
          )}

          {/* 12. DevAI */}
          {activeTool === 'devai' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🤖" title="DevToolBox AI (Free)" />
              <div>
                <p className="text-[10px] text-[#555] font-mono mb-1.5">PROMPT / CODE</p>
                <textarea
                  value={devPrompt}
                  onChange={e => setDevPrompt(e.target.value)}
                  className="tool-input min-h-[110px] resize-none"
                  placeholder="Write a Python function to check if a number is prime..."
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <ActionBtn onClick={() => loadDevAI('generate')} color={accentColor}>✨ Generate</ActionBtn>
                <ActionBtn onClick={() => loadDevAI('fix')} color={accentColor}>🔧 Fix Code</ActionBtn>
                <ActionBtn onClick={() => loadDevAI('user')} color={accentColor} variant="outline">👤 Fake User</ActionBtn>
              </div>
              {devResult && (
                <Card>
                  <div className="flex items-center justify-between mb-2">
                    <Tag color={accentColor}>AI Output</Tag>
                    <button onClick={() => navigator.clipboard?.writeText(devResult)} className="mini-chip">📋 Copy</button>
                  </div>
                  <pre className="text-[11px] text-[#CCC] whitespace-pre-wrap leading-relaxed max-h-56 overflow-auto">{devResult}</pre>
                </Card>
              )}
            </div>
          )}

          {/* 13. Math */}
          {activeTool === 'math' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🧮" title="Quick Math Calculator" />
              <SearchBox value={mathExpr} setValue={setMathExpr} onSearch={loadMath} placeholder="(100 + 200) * 3 / 15" accent={accentColor} label="Expression (+ - * / ^ %)" />
              <PillBar items={['2^10', '(1+1/1000)^1000', '100*0.18', '(12+8)*5/2', '360/7']} active="" onChange={e => setMathExpr(e)} accent={accentColor} />
              {mathResult && (
                <Card>
                  <p className="text-[10px] text-[#555] font-mono mb-1">RESULT</p>
                  <p className="text-2xl font-black" style={{ color: accentColor }}>{mathResult}</p>
                  <p className="text-xs text-[#555] mt-1 font-mono">{mathExpr} = {mathResult}</p>
                </Card>
              )}
              <Card>
                <p className="text-[10px] text-[#555] font-mono mb-1.5">SUPPORTED OPERATORS</p>
                <div className="flex flex-wrap gap-1.5">
                  {['+', '−', '×', '÷', '^', '%', '( )'].map(op => <Tag key={op} color="#666">{op}</Tag>)}
                </div>
              </Card>
            </div>
          )}

          {/* 14. Trivia */}
          {activeTool === 'trivia' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="❓" title="Trivia Quiz (Open Trivia DB)" />
              <ActionBtn onClick={loadTrivia} color={accentColor}>🎲 New Random Question</ActionBtn>
              {trivia && (
                <Card>
                  <Tag color="#7C4DFF">{trivia.category}</Tag>
                  <p className="text-sm text-white font-semibold mt-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: decodeHtml(trivia.question) }} />
                  {!triviaAns && (
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      {[trivia.correct_answer, ...trivia.incorrect_answers].sort(() => Math.random() - 0.5).map((ans, i) => (
                        <button key={i} onClick={() => setTriviaAns(true)} className="tool-input text-left hover:border-[#555] cursor-pointer transition-colors text-xs" style={{ cursor: 'pointer' }}>{decodeHtml(ans)}</button>
                      ))}
                    </div>
                  )}
                  {triviaAns && (
                    <div className="mt-3 p-3 rounded-lg bg-[#001A00] border border-[#00E67644]">
                      <p className="text-[10px] text-[#00E676] font-mono mb-1">✅ CORRECT ANSWER</p>
                      <p className="text-sm text-white font-bold">{decodeHtml(trivia.correct_answer)}</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* 15. NASA */}
          {activeTool === 'nasa' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🚀" title="NASA Astronomy Picture of the Day" />
              <ActionBtn onClick={loadNasa} color={accentColor}>🌌 Load Today's NASA APOD</ActionBtn>
              {nasa && (
                <Card>
                  {nasa.media_type === 'image'
                    ? <img src={nasa.url} alt={nasa.title} className="w-full rounded-xl mb-3" />
                    : <a href={nasa.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 p-3 bg-[#141414] rounded-xl mb-3 text-blue-400 text-sm">▶ Watch on NASA ↗</a>
                  }
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-white font-black text-sm flex-1">{nasa.title}</h4>
                    <Tag color="#555">{nasa.date}</Tag>
                  </div>
                  <p className="text-xs text-[#AAA] leading-relaxed line-clamp-5">{nasa.explanation}</p>
                  <button onClick={() => readAloud(nasa.explanation)} className="mini-chip mt-2">🔊 Listen</button>
                </Card>
              )}
            </div>
          )}

          {/* 16. Music */}
          {activeTool === 'music' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🎵" title="Music Artist Info (Wikipedia)" />
              <SearchBox value={artistQ} setValue={setArtistQ} onSearch={loadMusic} placeholder="Arijit Singh, Taylor Swift..." accent={accentColor} />
              <PillBar items={['Arijit Singh', 'AR Rahman', 'Taylor Swift', 'BTS', 'Coldplay']} active="" onChange={a => setArtistQ(a)} accent={accentColor} />
              {artistInfo && (
                <Card>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[#1A1A1A] flex items-center justify-center text-2xl shrink-0">🎤</div>
                    <div>
                      <h4 className="text-white font-black">{artistInfo.name}</h4>
                      <button onClick={() => readAloud(artistInfo.summary)} className="mini-chip mt-1">🔊 Listen</button>
                    </div>
                  </div>
                  <p className="text-xs text-[#AAA] leading-relaxed">{artistInfo.summary}</p>
                  <a href={artistInfo.url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-2 inline-block">Read full article on Wikipedia ↗</a>
                </Card>
              )}
            </div>
          )}

          {/* 17. Recipes */}
          {activeTool === 'recipes' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🍲" title="Food Recipes (TheMealDB)" />
              <SearchBox value={recipeQ} setValue={setRecipeQ} onSearch={loadRecipes} placeholder="chicken, biryani, pasta..." accent={accentColor} />
              <PillBar items={['Chicken', 'Biryani', 'Pasta', 'Cake', 'Soup', 'Sushi']} active="" onChange={r => setRecipeQ(r)} accent={accentColor} />
              <div className="grid grid-cols-2 gap-2">
                {recipes.map((m: any) => (
                  <div key={m.idMeal} className="card">
                    <img src={m.strMealThumb} alt={m.strMeal} className="w-full h-28 object-cover rounded-lg mb-2" />
                    <p className="text-white text-xs font-bold leading-snug">{m.strMeal}</p>
                    <div className="flex gap-1 flex-wrap mt-1">
                      <Tag color="#FF7000">{m.strCategory}</Tag>
                      <Tag color="#4285F4">{m.strArea}</Tag>
                    </div>
                    {(m.strSource || m.strYoutube) && (
                      <a href={m.strSource || m.strYoutube} target="_blank" rel="noreferrer" className="text-[10px] text-blue-400 hover:underline mt-1.5 inline-block">
                        {m.strYoutube ? '▶ Watch Recipe' : 'View Recipe ↗'}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 18. Cocktails */}
          {activeTool === 'cocktails' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🍹" title="Cocktail Recipes (TheCocktailDB)" />
              <SearchBox value={cocktailQ} setValue={setCocktailQ} onSearch={loadCocktails} placeholder="mojito, margarita..." accent={accentColor} />
              <PillBar items={['Margarita', 'Mojito', 'Martini', 'Daiquiri', 'Negroni']} active="" onChange={c => setCocktailQ(c)} accent={accentColor} />
              <div className="grid grid-cols-2 gap-2">
                {cocktails.map((d: any) => (
                  <div key={d.idDrink} className="card">
                    <img src={d.strDrinkThumb} alt={d.strDrink} className="w-full h-28 object-cover rounded-lg mb-2" />
                    <p className="text-white text-xs font-bold">{d.strDrink}</p>
                    <Tag color="#39C5BB">{d.strCategory}</Tag>
                    <p className="text-[10px] text-[#777] mt-1">{(d.strInstructions || '').slice(0, 80)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 19. Poetry */}
          {activeTool === 'poetry' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="📜" title="Random Poetry (PoetryDB)" />
              <ActionBtn onClick={loadPoems} color={accentColor}>📖 Load 5 Random Poems</ActionBtn>
              {poems.map((p: any, i: number) => (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-white font-black text-sm leading-snug">{p.title}</h4>
                    <Tag color="#D97757">{p.linecount} lines</Tag>
                  </div>
                  <p className="text-[10px] text-[#777] mb-2 font-mono">by {p.author}</p>
                  <pre className="text-xs text-[#CCC] whitespace-pre-wrap leading-relaxed font-serif italic">{(p.lines || []).slice(0, 8).join('\n')}</pre>
                  {(p.lines?.length || 0) > 8 && <p className="text-[10px] text-[#555] mt-1">...and {(p.lines.length || 0) - 8} more lines</p>}
                  <button onClick={() => readAloud(`${p.title} by ${p.author}. ${(p.lines || []).join('. ')}`)} className="mini-chip mt-2">🔊 Listen</button>
                </Card>
              ))}
            </div>
          )}

          {/* 20. Countries */}
          {activeTool === 'countries' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="🌍" title="World Country Data" onRead={() => country && readAloud(`${country.name} is located in ${country.region}. Capital is ${country.capital}. Population is ${country.pop}.`)} />
              <SearchBox value={countryQ} setValue={setCountryQ} onSearch={loadCountry} placeholder="India, Japan, Brazil..." accent={accentColor} />
              <PillBar items={['India', 'USA', 'Japan', 'Germany', 'Brazil', 'Australia']} active="" onChange={c => setCountryQ(c)} accent={accentColor} />
              {country && (
                <Card>
                  {country.flag && <img src={country.flag} alt={country.name} className="w-full h-24 object-cover rounded-xl mb-3 border border-[#222]" />}
                  {[['Name', country.name], ['Official Name', country.official], ['Capital', country.capital], ['Region', country.region], ['Population', country.pop], ['Area', country.area], ['Languages', country.langs], ['Currencies', country.curr]].map(([k, v]) => <RowKV key={k} label={k} value={v} />)}
                  {country.maps && <a href={country.maps} target="_blank" rel="noreferrer" className="mt-2 text-[10px] text-blue-400 hover:underline inline-block">📍 View on Google Maps ↗</a>}
                </Card>
              )}
            </div>
          )}

          {/* 21. GitHub */}
          {activeTool === 'github' && !loading && (
            <div className="space-y-3">
              <SectionHeader icon="💻" title="GitHub Repos (Public API)" />
              <SearchBox value={ghQ} setValue={setGhQ} onSearch={loadGitHub} placeholder="react, nextjs, python..." accent={accentColor} />
              <PillBar items={['react', 'nextjs', 'python', 'flutter', 'rust', 'golang']} active="" onChange={q => setGhQ(q)} accent={accentColor} />
              {ghRepos.map((r: any, i: number) => (
                <Card key={i}>
                  <div className="flex items-start justify-between gap-2">
                    <a href={r.url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-400 hover:underline leading-snug">{r.name}</a>
                    <div className="flex gap-1 shrink-0">
                      <Tag color="#FFB300">⭐ {r.stars?.toLocaleString()}</Tag>
                      <Tag color="#10A37F">🍴 {r.forks?.toLocaleString()}</Tag>
                    </div>
                  </div>
                  {r.desc && <p className="text-[10px] text-[#777] mt-1.5">{r.desc}</p>}
                  {r.lang && <Tag color="#7C4DFF">{r.lang}</Tag>}
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: `1px solid ${accentColor}11` }}>
          <p className="text-[9px] text-[#444] font-mono">21 APIs · No keys required · Free forever</p>
          <p className="text-[9px] text-[#333] font-mono">by @SudhirDevOps1</p>
        </div>
      </div>
    </div>
  );
}
