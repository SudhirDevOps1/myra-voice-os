import { useState, useCallback } from 'react';

interface FunDashboardProps {
  open: boolean;
  accentColor: string;
  onClose: () => void;
  lang: 'en' | 'hi';
}

interface JokeData {
  setup: string;
  delivery: string;
  type: string;
}

interface FactData {
  text: string;
}

interface DogImage {
  url: string;
}

export default function FunDashboard({ open, accentColor, onClose, lang }: FunDashboardProps) {
  const [activeTab, setActiveTab] = useState<'joke' | 'image' | 'fact'>('joke');

  // ===== JOKE STATE =====
  const [joke, setJoke] = useState<JokeData | null>(null);
  const [jokeLoading, setJokeLoading] = useState(false);
  const [jokeError, setJokeError] = useState('');

  // ===== IMAGE STATE =====
  const [dogImage, setDogImage] = useState<DogImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState('');

  // ===== FACT STATE =====
  const [fact, setFact] = useState<FactData | null>(null);
  const [factLoading, setFactLoading] = useState(false);
  const [factError, setFactError] = useState('');

  // ===== FETCH JOKE (JokeAPI - FREE, no key) =====
  const fetchJoke = useCallback(async () => {
    setJokeLoading(true);
    setJokeError('');
    setJoke(null);
    try {
      // JokeAPI v2 - free, no authentication needed
      const res = await fetch('https://v2.jokeapi.dev/joke/Any?safe-mode', {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('Joke fetch failed');
      const data = await res.json();

      if (data.error) {
        throw new Error(data.message || 'API error');
      }

      const jokeData: JokeData = {
        setup: data.setup || '',
        delivery: data.delivery || '',
        type: data.type || 'single',
      };
      setJoke(jokeData);
    } catch (e: any) {
      setJokeError(e.message || 'Joke nahi mila. Phir se try karo!');
    } finally {
      setJokeLoading(false);
    }
  }, []);

  // ===== FETCH DOG IMAGE (PlaceDog API - FREE, no key) =====
  const fetchDogImage = useCallback(async () => {
    setImageLoading(true);
    setImageError('');
    setDogImage(null);
    try {
      // PlaceDog - free dog images, no key needed
      const randomSize = Math.floor(Math.random() * 3) + 1; // 1=small, 2=medium, 3=large
      const res = await fetch(`https://placedog.net/${randomSize}/id?r=${Date.now()}`);
      if (!res.ok) throw new Error('Image fetch failed');

      const imgData: DogImage = { url: res.url };
      setDogImage(imgData);
    } catch (e: any) {
      // Fallback to Lorem Picsum
      try {
        const res = await fetch(`https://picsum.photos/400/300?random=${Date.now()}`);
        if (!res.ok) throw new Error('');
        const imgData: DogImage = { url: res.url };
        setDogImage(imgData);
      } catch {
        setImageError('Image nahi mili. Phir se try karo!');
      }
    } finally {
      setImageLoading(false);
    }
  }, []);

  // ===== FETCH RANDOM FACT (Useless Facts API - FREE, no key) =====
  const fetchFact = useCallback(async () => {
    setFactLoading(true);
    setFactError('');
    setFact(null);
    try {
      // Useless Facts API - completely free
      const res = await fetch('https://uselessfacts.jsph.pl/random.json?language=en', {
        headers: { 'Accept': 'application/json' },
      });
      if (!res.ok) throw new Error('Fact fetch failed');
      const data = await res.json();

      const factData: FactData = {
        text: data.text || 'Koi fact nahi mila.',
      };
      setFact(factData);
    } catch (e: any) {
      // Fallback to another free fact API
      try {
        const res = await fetch('https://catfact.ninja/fact');
        if (!res.ok) throw new Error('');
        const data = await res.json();
        const factData: FactData = {
          text: data.fact || 'Koi fact nahi mila.',
        };
        setFact(factData);
      } catch {
        setFactError('Fact nahi mila. Phir se try karo!');
      }
    } finally {
      setFactLoading(false);
    }
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex justify-center items-start overflow-y-auto pt-6 pb-12 px-3 backdrop-blur-sm">
      {/* Self-contained Fun Dashboard */}
      <div
        className="w-full max-w-md rounded-2xl border overflow-hidden my-2"
        style={{
          background: 'linear-gradient(145deg, #121212, #0D0D0D, #1A1A1A)',
          borderColor: `${accentColor}44`,
          boxShadow: `0 0 40px ${accentColor}15, 0 20px 60px rgba(0,0,0,0.8)`,
        }}
      >

        {/* ===== HEADER ===== */}
        <div
          className="px-5 pt-5 pb-3 flex items-center justify-between"
          style={{ borderBottom: `1px solid ${accentColor}22` }}
        >
          <div>
            <h2 className="text-white font-black text-xl tracking-wider flex items-center gap-2">
              <span className="text-2xl">🎪</span> FUN ZONE
            </h2>
            <p className="text-[10px] text-[#666] font-mono mt-0.5">
              {lang === 'hi' ? 'Free APIs · Bina login · Masti karo!' : 'Free APIs · No login · Have fun!'}
            </p>
          </div>
          <button onClick={onClose} className="text-[#888] hover:text-white p-1.5 rounded-lg hover:bg-[#1A1A1A] transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* ===== TAB BAR ===== */}
        <div className="flex px-3 pt-3 gap-1.5">
          {[
            { key: 'joke' as const,  icon: '😂', label: lang === 'hi' ? 'Chutkula' : 'Joke' },
            { key: 'image' as const, icon: '🐕', label: lang === 'hi' ? 'Kutta Photo' : 'Dog Pic' },
            { key: 'fact' as const,  icon: '📰', label: lang === 'hi' ? 'Fact' : 'Fact' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              style={{
                background: activeTab === tab.key ? `${accentColor}22` : '#111',
                color: activeTab === tab.key ? accentColor : '#666',
                border: `1px solid ${activeTab === tab.key ? accentColor + '44' : '#222'}`,
              }}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===== CONTENT AREA ===== */}
        <div className="p-4 space-y-3">

          {/* ===== JOKE TAB ===== */}
          {activeTab === 'joke' && (
            <div className="space-y-3">
              {/* Joke Display Card */}
              {joke && (
                <div
                  className="rounded-xl p-4 border space-y-3 animate-fadeIn"
                  style={{
                    background: 'linear-gradient(135deg, #1A1A00, #0D0D0D, #1A0A00)',
                    borderColor: '#FFE06633',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{
                        background: joke.type === 'single' ? '#FF6D6D22' : '#00E67622',
                        color: joke.type === 'single' ? '#FF6D6D' : '#00E676',
                      }}>
                      {joke.type === 'single' ? '😂 SINGLE' : '🤔 TWO-PART'}
                    </span>
                  </div>

                  {/* Setup */}
                  <p className="text-sm text-[#EEE] font-medium leading-relaxed">
                    {joke.setup}
                  </p>

                  {/* Delivery (for two-part jokes) */}
                  {joke.delivery && (
                    <div className="mt-3 pt-3 border-t border-[#222]">
                      <p className="text-sm font-bold" style={{ color: accentColor }}>
                        {joke.delivery}
                      </p>
                    </div>
                  )}

                  {/* Copy / Share buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        const fullJoke = joke.delivery
                          ? `${joke.setup}\n${joke.delivery}`
                          : joke.setup;
                        navigator.clipboard.writeText(fullJoke).catch(() => {});
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-lg border border-[#333] text-[#999] hover:text-white transition-colors"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={fetchJoke}
                      disabled={jokeLoading}
                      className="text-[10px] px-3 py-1.5 rounded-lg border text-[#999] hover:text-white transition-colors disabled:opacity-40"
                      style={{ borderColor: accentColor + '44' }}
                    >
                      🔄 Next Joke
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {jokeError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D] flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{jokeError}</span>
                </div>
              )}

              {/* Loading */}
              {jokeLoading && (
                <div className="bg-[#111] rounded-xl p-6 text-center">
                  <div className="text-3xl animate-bounce">😂</div>
                  <p className="text-xs text-[#888] mt-2 font-mono">
                    {lang === 'hi' ? 'Chutkula dhoond rahe hain...' : 'Searching for a joke...'}
                  </p>
                </div>
              )}

              {/* Empty state + Fetch button */}
              {!joke && !jokeLoading && !jokeError && (
                <div className="text-center space-y-3 py-4">
                  <div className="text-5xl">😂</div>
                  <p className="text-xs text-[#888] font-mono">
                    {lang === 'hi' ? 'Programming ya general chutkula sunna chahte ho?' : 'Want to hear a programming or general joke?'}
                  </p>
                  <button
                    onClick={fetchJoke}
                    className="px-6 py-3 rounded-xl text-sm font-black text-black active:scale-95 transition-all hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #FFE066, #FFD54F)',
                      boxShadow: '0 4px 20px rgba(255, 224, 102, 0.3)',
                    }}
                  >
                    😂 {lang === 'hi' ? 'Chutkula Sunao!' : 'Tell Me a Joke!'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== IMAGE TAB ===== */}
          {activeTab === 'image' && (
            <div className="space-y-3">
              {/* Image Display */}
              {dogImage && (
                <div className="rounded-xl overflow-hidden border animate-fadeIn"
                  style={{ borderColor: '#40C4FF33' }}>
                  <div className="relative">
                    <img
                      src={dogImage.url}
                      alt="Cute dog"
                      className="w-full h-auto object-cover"
                      style={{ minHeight: '200px', maxHeight: '350px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://picsum.photos/400/300?random=' + Date.now();
                      }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                      <p className="text-xs text-white font-bold">🐕 Cute Dog!</p>
                      <p className="text-[10px] text-[#CCC] font-mono">
                        {lang === 'hi' ? 'Random kutte ki photo' : 'Random dog photo'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {imageError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D] flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{imageError}</span>
                </div>
              )}

              {/* Loading */}
              {imageLoading && (
                <div className="bg-[#111] rounded-xl p-6 text-center">
                  <div className="text-3xl animate-pulse">🐕</div>
                  <p className="text-xs text-[#888] mt-2 font-mono">
                    {lang === 'hi' ? 'Kutta dhoond rahe hain...' : 'Finding a cute dog...'}
                  </p>
                </div>
              )}

              {/* Empty state + Fetch button */}
              {!dogImage && !imageLoading && !imageError && (
                <div className="text-center space-y-3 py-4">
                  <div className="text-5xl">🐕</div>
                  <p className="text-xs text-[#888] font-mono">
                    {lang === 'hi' ? 'Ek pyaara kutte ka photo dekhna chahte ho?' : 'Want to see a cute random dog photo?'}
                  </p>
                  <button
                    onClick={fetchDogImage}
                    className="px-6 py-3 rounded-xl text-sm font-black text-black active:scale-95 transition-all hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #40C4FF, #29B6F6)',
                      boxShadow: '0 4px 20px rgba(64, 196, 255, 0.3)',
                    }}
                  >
                    🐕 {lang === 'hi' ? 'Kutta Dikhao!' : 'Show Me a Dog!'}
                  </button>
                </div>
              )}

              {/* Extra: Show more dogs button */}
              {dogImage && !imageLoading && (
                <button
                  onClick={fetchDogImage}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border text-[#999] hover:text-white transition-colors active:scale-95"
                  style={{ borderColor: '#40C4FF44' }}
                >
                  🔄 {lang === 'hi' ? 'Aur Kutta Dikhao' : 'Show Another Dog'}
                </button>
              )}
            </div>
          )}

          {/* ===== FACT TAB ===== */}
          {activeTab === 'fact' && (
            <div className="space-y-3">
              {/* Fact Display Card */}
              {fact && (
                <div
                  className="rounded-xl p-4 border space-y-3 animate-fadeIn"
                  style={{
                    background: 'linear-gradient(135deg, #1A0033, #0D0D0D, #001A33)',
                    borderColor: '#7C4DFF33',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-mono"
                      style={{
                        background: '#7C4DFF22',
                        color: '#B388FF',
                      }}>
                      💡 DID YOU KNOW?
                    </span>
                  </div>

                  <p className="text-sm text-[#DDD] font-medium leading-relaxed">
                    {fact.text}
                  </p>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(fact.text).catch(() => {});
                      }}
                      className="text-[10px] px-3 py-1.5 rounded-lg border border-[#333] text-[#999] hover:text-white transition-colors"
                    >
                      📋 Copy
                    </button>
                    <button
                      onClick={fetchFact}
                      disabled={factLoading}
                      className="text-[10px] px-3 py-1.5 rounded-lg border text-[#999] hover:text-white transition-colors disabled:opacity-40"
                      style={{ borderColor: '#7C4DFF44' }}
                    >
                      🔄 Another Fact
                    </button>
                  </div>
                </div>
              )}

              {/* Error */}
              {factError && (
                <div className="bg-[#1A0000] border border-[#FF1744] rounded-xl p-3 text-xs text-[#FF6D6D] flex items-start gap-2">
                  <span>⚠️</span>
                  <span>{factError}</span>
                </div>
              )}

              {/* Loading */}
              {factLoading && (
                <div className="bg-[#111] rounded-xl p-6 text-center">
                  <div className="text-3xl animate-spin inline-block">📰</div>
                  <p className="text-xs text-[#888] mt-2 font-mono">
                    {lang === 'hi' ? 'Fact dhoond rahe hain...' : 'Searching for a fact...'}
                  </p>
                </div>
              )}

              {/* Empty state + Fetch button */}
              {!fact && !factLoading && !factError && (
                <div className="text-center space-y-3 py-4">
                  <div className="text-5xl">📰</div>
                  <p className="text-xs text-[#888] font-mono">
                    {lang === 'hi' ? 'Ek bekaar fact jaanna chahte ho?' : 'Want to learn a useless random fact?'}
                  </p>
                  <button
                    onClick={fetchFact}
                    className="px-6 py-3 rounded-xl text-sm font-black text-white active:scale-95 transition-all hover:shadow-lg"
                    style={{
                      background: 'linear-gradient(135deg, #7C4DFF, #651FFF)',
                      boxShadow: '0 4px 20px rgba(124, 77, 255, 0.3)',
                    }}
                  >
                    📰 {lang === 'hi' ? 'Fact Batao!' : 'Give Me a Fact!'}
                  </button>
                </div>
              )}

              {/* Extra: Show more facts button */}
              {fact && !factLoading && (
                <button
                  onClick={fetchFact}
                  className="w-full py-2.5 rounded-xl text-xs font-bold border text-[#999] hover:text-white transition-colors active:scale-95"
                  style={{ borderColor: '#7C4DFF44' }}
                >
                  🔄 {lang === 'hi' ? 'Aur Fact Batao' : 'Another Fact'}
                </button>
              )}
            </div>
          )}

        </div>

        {/* ===== FOOTER ===== */}
        <div
          className="px-4 py-3 text-center"
          style={{ borderTop: `1px solid ${accentColor}11` }}
        >
          <p className="text-[9px] text-[#444] font-mono">
            APIs: JokeAPI · PlaceDog · UselessFacts · CatFact — All FREE, No Key
          </p>
        </div>

      </div>
    </div>
  );
}
