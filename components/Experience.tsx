import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import emailjs from '@emailjs/browser';
import { useLanguage } from '../App';
import { Goal, PanelKind, PanelState, PROJECT_SLOTS, SPOTS, resolve } from './room/spots';

const Scene = lazy(() => import('./room/Scene'));

const Loading: React.FC<{ text: string }> = ({ text }) => (
  <div className="room-loading" role="status">
    <div className="room-loading-box" />
    <span>{text}</span>
  </div>
);

const EMAIL = 'semihsoykaniletisim@gmail.com';

const ui = {
  tr: {
    role: 'Web & Mobil Uygulama Geliştirici',
    loading: 'Oda hazırlanıyor…',
    hint: 'Yere tıkla, karakterin yürüsün. Parlayan objelere tıkla.',
    hintTouch: 'Yere dokun, karakterin yürüsün.',
    projects: 'Projeler', apps: 'Uygulamalar', about: 'Hakkımda', social: 'Sosyal', contact: 'İletişim',
    hello: 'Merhaba! Bir proje mi var? 👋',
    sent: 'Mesajın gönderildi, teşekkürler!',
    error: 'Gönderilemedi. Lütfen tekrar dene ya da e-posta at.',
    getApp: "App Store'da aç",
    copy: 'Kopyala', copied: 'Kopyalandı',
    close: 'Kapat',
    elsewhere: 'Beni burada da bulabilirsin',
    expand: 'Büyüt', browse: 'Siteyi buradan gezebilirsin', siteLoading: 'Site yükleniyor…',
    internal: 'Şirket içi sistem. Güvenlik nedeniyle yalnızca ekran görüntüsü gösteriliyor.',
    linkedin: "LinkedIn'de gör",
  },
  en: {
    role: 'Web & Mobile App Developer',
    loading: 'Setting up the room…',
    hint: 'Click the floor to walk. Click glowing objects.',
    hintTouch: 'Tap the floor to walk.',
    projects: 'Projects', apps: 'Apps', about: 'About', social: 'Social', contact: 'Contact',
    hello: 'Hi! Got a project? 👋',
    sent: 'Message sent, thank you!',
    error: "Couldn't send. Please try again or email me.",
    getApp: 'Open in App Store',
    copy: 'Copy', copied: 'Copied',
    close: 'Close',
    elsewhere: 'You can also find me here',
    expand: 'Expand', browse: 'Browse the live site right here', siteLoading: 'Loading site…',
    internal: 'Internal company system. Only a screenshot is shown for security reasons.',
    linkedin: 'View on LinkedIn',
  },
};

const SOCIALS = [
  { label: 'Instagram', handle: '@soykandev', href: 'https://www.instagram.com/soykandev/', color: '#e1306c' },
  { label: 'LinkedIn', handle: 'in/soykansemih', href: 'https://www.linkedin.com/in/soykansemih/', color: '#0a66c2' },
  { label: 'GitHub', handle: 'soykansemih', href: 'https://github.com/soykansemih', color: '#24292f' },
  { label: 'Medium', handle: '@soykansemih', href: 'https://medium.com/@soykansemih', color: '#111111' },
];

const ContactForm: React.FC = () => {
  const { t, language } = useLanguage();
  const u = ui[language];
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [copied, setCopied] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setStatus('sending');
    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        import.meta.env.VITE_EMAILJS_PUBLIC_KEY
      )
      .then(() => { setStatus('ok'); formRef.current?.reset(); })
      .catch((err) => { console.error('EmailJS error:', err); setStatus('err'); });
  };

  const copy = () => {
    navigator.clipboard?.writeText(EMAIL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <p className="text-[#6b6070]">{t.contactSubtitle}</p>
      <form ref={formRef} onSubmit={submit} className="space-y-3">
        <input id="c-name" name="name" placeholder={t.nameLabel} required className="room-input" />
        <input id="c-email" name="email" type="email" placeholder={t.emailLabel} required className="room-input" />
        <textarea id="c-msg" name="message" rows={4} placeholder={t.messageLabel} required className="room-input resize-none" />
        <button type="submit" disabled={status === 'sending'} className="room-btn w-full">
          {status === 'sending' ? '…' : t.sendBtn}
        </button>
        {status === 'ok' && <p className="text-sm text-emerald-600 text-center font-semibold">{u.sent}</p>}
        {status === 'err' && <p className="text-sm text-rose-600 text-center font-semibold">{u.error}</p>}
      </form>
      <div className="flex items-center justify-between gap-2 rounded-2xl bg-[#fbeee0] px-4 py-3 text-sm">
        <span className="truncate select-all">{EMAIL}</span>
        <button onClick={copy} className="shrink-0 font-bold text-[#ff7a59] hover:underline">{copied ? u.copied : u.copy}</button>
      </div>
    </div>
  );
};

/** Live website rendered at desktop width and scaled down into a laptop frame. */
const SiteFrame: React.FC<{ url: string; title: string; width?: number; loadingText: string }> = ({ url, title, width = 1280, loadingText }) => {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  useEffect(() => setLoaded(false), [url]);
  const height = width * 0.625;
  return (
    <div ref={box} className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: '16 / 10' }}>
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#8a7a6c] bg-[#fbeee0] animate-pulse">{loadingText}</div>}
      <iframe
        key={url}
        src={url}
        title={title}
        loading="lazy"
        sandbox="allow-scripts allow-same-origin allow-forms"
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        style={{ width, height, transform: `scale(${scale})`, transformOrigin: '0 0', border: 0 }}
        className="absolute top-0 left-0"
      />
    </div>
  );
};

const Laptop: React.FC<{ children: React.ReactNode; host?: string; onExpand?: () => void; expandLabel: string }> = ({ children, host, onExpand, expandLabel }) => (
  <div className="relative">
    <div className="rounded-t-[14px] bg-[#2d2a35] p-[6px] pb-[8px] shadow-[0_18px_30px_-18px_rgba(59,51,72,.6)]">
      <div className="flex items-center gap-1.5 px-2 pb-1.5">
        <span className="w-2 h-2 rounded-full bg-[#ff7a59]" /><span className="w-2 h-2 rounded-full bg-[#ffd166]" /><span className="w-2 h-2 rounded-full bg-[#7cc7a8]" />
        {host && <span className="ml-2 flex-1 truncate rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white/70">{host}</span>}
        {onExpand && (
          <button onClick={onExpand} className="ml-auto rounded-full bg-white/15 hover:bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white">⤢ {expandLabel}</button>
        )}
      </div>
      <div className="rounded-[6px] overflow-hidden">{children}</div>
    </div>
    <div className="mx-[-10px] h-3 rounded-b-[12px] bg-gradient-to-b from-[#d8d2cc] to-[#b9b2ab]" />
    <div className="mx-auto h-1 w-1/4 rounded-b bg-[#a39b93]" />
  </div>
);

const Panel: React.FC<{ state: PanelState; onClose: () => void; onPick: (i: number) => void }> = ({ state, onClose, onPick }) => {
  const { t, language } = useLanguage();
  const u = ui[language];

  // site: embedded live; image only (no link) for internal systems; external: image + outside link.
  const projects: { title: string; desc: string; site?: string; image?: string; external?: string; internal?: boolean }[] = [
    { title: t.proj1Title, desc: t.proj1Desc, image: '/assets/operation_mockup.jpg', internal: true },
    { title: t.proj2Title, desc: t.proj2Desc, site: 'https://otoyikamabb.com' },
    { title: t.proj4Title, desc: t.proj4Desc, site: 'https://mersinoyuncak.com' },
    { title: t.proj3Title, desc: t.proj3Desc, image: '/assets/smart_mockup.jpg', external: 'https://www.linkedin.com/feed/update/urn:li:activity:7338653025886007296/' },
  ];
  const [full, setFull] = useState(false);
  const apps = [
    { name: 'BB Oto Yıkama', cat: t.bbAppCategory, desc: t.bbAppDesc, icon: '/assets/bb-icon.jpg', link: 'https://apps.apple.com/tr/app/bb-oto-y%C4%B1kama/id6760658074?l=tr' },
    { name: 'Forx: Döviz Altın Kripto', cat: t.forxAppCategory, desc: t.forxAppDesc, icon: '/assets/forx-icon.png', link: 'https://apps.apple.com/tr/app/forx-d%C3%B6viz-alt%C4%B1n-kripto/id6767925625?l=tr' },
  ];

  const titles: Record<PanelKind, string> = { projects: t.portfolioTitle, apps: t.mobileAppsTitle, about: t.aboutTitle, social: u.social, contact: t.contactTitle };
  const i = state.index ?? 0;
  const p = projects[i];

  return (
    <>
    <aside className={`room-panel ${state.kind === 'projects' ? 'is-wide' : ''}`} role="dialog" aria-label={titles[state.kind]}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-[#3b3348]">{titles[state.kind]}</h2>
        <button onClick={onClose} aria-label={u.close} className="w-9 h-9 rounded-full bg-[#fbeee0] hover:bg-[#f6dcc4] flex items-center justify-center text-[#3b3348]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      {state.kind === 'projects' && (
        <div className="space-y-4">
          {p.site ? (
            <Laptop host={new URL(p.site).host} onExpand={() => setFull(true)} expandLabel={u.expand}>
              <SiteFrame url={p.site} title={p.title} loadingText={u.siteLoading} />
            </Laptop>
          ) : (
            <div className="rounded-2xl overflow-hidden bg-[#f3ece6]">
              <img src={p.image} alt={p.title} className="w-full aspect-[16/11] object-cover" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-lg text-[#3b3348]">{p.title}</h3>
            <p className="text-[#6b6070] text-sm mt-1">{p.desc}</p>
            {p.site && <p className="text-xs font-bold text-[#ff7a59] mt-2">👆 {u.browse}</p>}
            {p.internal && <p className="text-xs text-[#8a7a6c] mt-2 flex gap-1.5"><span>🔒</span>{u.internal}</p>}
          </div>
          {p.site && <button onClick={() => setFull(true)} className="room-btn w-full">⤢ {u.expand}</button>}
          {p.external && <a href={p.external} target="_blank" rel="noopener noreferrer" className="room-btn w-full">{u.linkedin} ↗</a>}
          <div className="grid grid-cols-4 gap-2">
            {projects.map((x, k) => (
              <button key={k} onClick={() => onPick(k)} title={x.title}
                className={`h-2.5 rounded-full transition ${k === i ? 'bg-[#ff7a59]' : 'bg-[#f3d9bd] hover:bg-[#f0c9a4]'}`} />
            ))}
          </div>
        </div>
      )}

      {state.kind === 'apps' && (
        <div className="space-y-3">
          {apps.map((a) => (
            <a key={a.name} href={a.link} target="_blank" rel="noopener noreferrer" className="flex gap-4 p-3 rounded-2xl bg-[#fbeee0] hover:bg-[#f6e0ca] transition">
              <img src={a.icon} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
              <div className="min-w-0">
                <div className="font-bold text-[#3b3348]">{a.name}</div>
                <div className="text-xs font-semibold text-[#ff7a59] uppercase tracking-wide">{a.cat}</div>
                <p className="text-sm text-[#6b6070] mt-1">{a.desc}</p>
                <div className="text-sm font-bold text-[#3b3348] mt-2">{u.getApp} ↗</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {state.kind === 'about' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img src="/assets/semih.jpg" alt="Semih Soykan" className="w-20 h-20 rounded-2xl object-cover" />
            <div>
              <div className="font-bold text-lg text-[#3b3348]">Semih Soykan</div>
              <div className="text-sm text-[#6b6070]">{u.role}</div>
            </div>
          </div>
          <p className="font-display text-lg text-[#3b3348] leading-snug">“{t.aboutQuote}”</p>
          <p className="text-[#6b6070] text-[15px] leading-relaxed">{t.aboutBody}</p>
        </div>
      )}

      {state.kind === 'social' && (
        <div className="space-y-2">
          <p className="text-[#6b6070] text-sm mb-3">{u.elsewhere}</p>
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 rounded-2xl bg-[#fbeee0] hover:bg-[#f6e0ca] transition">
              <span className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                <span className="font-bold text-[#3b3348]">{s.label}</span>
              </span>
              <span className="text-sm text-[#6b6070]">{s.handle} ↗</span>
            </a>
          ))}
        </div>
      )}

      {state.kind === 'contact' && <ContactForm />}
    </aside>
    {full && p.site && state.kind === 'projects' && (
      <div className="room-full" role="dialog" aria-label={p.title} onClick={() => setFull(false)}>
        <div className="room-full-win" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#2d2a35]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a59]" /><span className="w-2.5 h-2.5 rounded-full bg-[#ffd166]" /><span className="w-2.5 h-2.5 rounded-full bg-[#7cc7a8]" />
            <span className="ml-2 flex-1 truncate rounded-full bg-white/10 px-3 py-1 text-xs text-white/75">{new URL(p.site).host}</span>
            <button onClick={() => setFull(false)} className="rounded-full bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-bold text-white">{u.close} ✕</button>
          </div>
          <iframe src={p.site} title={p.title} sandbox="allow-scripts allow-same-origin allow-forms" referrerPolicy="no-referrer" className="flex-1 w-full border-0 bg-white" />
        </div>
      </div>
    )}
    </>
  );
};

const Experience: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const u = ui[language];
  const [goal, setGoal] = useState<Goal | null>(null);
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [nearMe, setNearMe] = useState(false);
  const touch = useMemo(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches, []);

  const go = useCallback((kind: PanelKind, index?: number) => {
    setPanel(null);
    const [x, z] = kind === 'projects' ? [SPOTS.projects[0], PROJECT_SLOTS[index ?? 0].z] : SPOTS[kind];
    setGoal({ x, z, then: { kind, index: kind === 'projects' ? index ?? 0 : undefined }, id: Date.now() });
  }, []);

  const onFloor = useCallback((x: number, z: number) => {
    setPanel(null);
    const [rx, rz] = resolve(x, z);
    setGoal({ x: rx, z: rz, id: Date.now() });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const labels = {
    projects: [t.proj1Title, t.proj2Title, t.proj4Title, t.proj3Title],
    apps: u.apps, about: u.about, social: u.social, contact: u.contact, hello: u.hello,
  };

  const menu: PanelKind[] = ['projects', 'apps', 'about', 'social', 'contact'];

  return (
    <div className="room-root">
      <div className="absolute inset-0">
        <Suspense fallback={<Loading text={u.loading} />}>
        <Scene labels={labels} goal={goal} onFloor={onFloor} onGo={go}
          onArrive={setPanel} bubble={nearMe && panel?.kind !== 'contact'} onNearMe={setNearMe} />
        </Suspense>
      </div>

      {/* top bar */}
      <header className="room-top">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#3b3348] leading-none">Semih Soykan</h1>
          <p className="text-sm text-[#8a7a6c] mt-1">{u.role}</p>
        </div>
        <div className="flex rounded-full bg-white/80 backdrop-blur p-1 text-xs font-bold shadow-sm">
          {(['tr', 'en'] as const).map((l) => (
            <button key={l} onClick={() => setLanguage(l)}
              className={`px-3 py-1.5 rounded-full uppercase transition ${language === l ? 'bg-[#ff7a59] text-white' : 'text-[#6b6070] hover:text-[#3b3348]'}`}>
              {l}
            </button>
          ))}
        </div>
      </header>

      {/* bottom menu */}
      <nav className="room-menu" aria-label="Menu">
        {menu.map((k) => (
          <button key={k} onClick={() => go(k)} className={`room-menu-item ${panel?.kind === k ? 'is-active' : ''} ${k === 'contact' ? 'is-cta' : ''}`}>
            {u[k]}
          </button>
        ))}
      </nav>
      <p className="room-hint">{touch ? u.hintTouch : u.hint}</p>

      {panel && <Panel state={panel} onClose={() => setPanel(null)} onPick={(i) => go('projects', i)} />}

      {/* plain content for search engines and screen readers */}
      <div className="sr-only">
        <p>{t.heroSubtitle}</p>
        <p>{t.aboutBody}</p>
        <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
      </div>
    </div>
  );
};

export default Experience;
