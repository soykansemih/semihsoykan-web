import React, { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
    role: 'Mobil & Web Uygulama Geliştirici',
    loading: 'Oda hazırlanıyor…',
    hint: 'Yere tıkla, karakterin yürüsün. Parlayan objelere tıkla.',
    hintTouch: 'Yere dokun, karakterin yürüsün.',
    projects: 'Projeler', apps: 'Uygulamalar', about: 'Hakkımda', social: 'Sosyal', contact: 'İletişim',
    hello: 'Merhaba! Bir proje mi var? 👋',
    sent: 'Mesajın gönderildi, teşekkürler!',
    error: 'Gönderilemedi. Lütfen tekrar dene ya da e-posta at.',
    copy: 'Kopyala', copied: 'Kopyalandı',
    close: 'Kapat',
    elsewhere: 'Beni burada da bulabilirsin',
    expand: 'Büyüt', browse: 'Siteyi buradan gezebilirsin', siteLoading: 'Site yükleniyor…',
    myApps: 'Uygulamalarım', tapApp: 'Açmak için bir uygulamaya dokun', internal: 'Şirket içi sistem: içeriği yalnızca yetkililere açık.',
  },
  en: {
    role: 'Mobile & Web App Developer',
    loading: 'Setting up the room…',
    hint: 'Click the floor to walk. Click glowing objects.',
    hintTouch: 'Tap the floor to walk.',
    projects: 'Projects', apps: 'Apps', about: 'About', social: 'Social', contact: 'Contact',
    hello: 'Hi! Got a project? 👋',
    sent: 'Message sent, thank you!',
    error: "Couldn't send. Please try again or email me.",
    copy: 'Copy', copied: 'Copied',
    close: 'Close',
    elsewhere: 'You can also find me here',
    expand: 'Expand', browse: 'Browse the live site right here', siteLoading: 'Loading site…',
    myApps: 'My Apps', tapApp: 'Tap an app to open it', internal: 'Internal system: content is open to authorized users only.',
  },
};

const SI = (slug: string) => `https://cdn.jsdelivr.net/npm/simple-icons@13.21.0/icons/${slug}.svg`;
const SOCIALS = [
  { label: 'Instagram', handle: '@soykandev', href: 'https://www.instagram.com/soykandev/', bg: 'linear-gradient(45deg,#feda75,#fa7e1e 30%,#d62976 60%,#962fbf 85%,#4f5bd5)', icon: SI('instagram') },
  { label: 'LinkedIn', handle: 'in/soykansemih', href: 'https://www.linkedin.com/in/soykansemih/', bg: '#0066cc', icon: SI('linkedin') },
  { label: 'GitHub', handle: 'soykansemih', href: 'https://github.com/soykansemih', bg: '#0c0c0c', icon: SI('github') },
  { label: 'Medium', handle: '@soykansemih', href: 'https://medium.com/@soykansemih', bg: '#050505', icon: SI('medium') },
];

/** A phone home screen: a widget on top and a grid of tappable app icons. */
const PhoneHome: React.FC<{ kicker: string; title: string; items: { key: string; href: string; label: string; title?: string; icon: React.ReactNode }[] }> = ({ kicker, title, items }) => (
  <div className="room-phone">
    <div className="room-phone-screen">
      <div className="room-phone-status"><span>9:41</span><span className="room-phone-notch" /><span>●●● ▮</span></div>
      <div className="room-phone-widget">
        <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">{kicker}</div>
        <div className="text-lg font-bold leading-tight">{title}</div>
      </div>
      <div className="room-phone-grid">
        {items.map((it) => (
          <a key={it.key} href={it.href} target="_blank" rel="noopener noreferrer" className="room-phone-app" title={it.title}>
            {it.icon}
            <span>{it.label}</span>
          </a>
        ))}
      </div>
      <div className="room-phone-home" />
    </div>
  </div>
);

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
      <p className="text-[#1f1f1f]">{t.contactSubtitle}</p>
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
      <div className="flex items-center justify-between gap-2 bg-[#fbfbfb] px-4 py-3 text-sm">
        <span className="truncate select-all">{EMAIL}</span>
        <button onClick={copy} className="shrink-0 font-bold bg-[#ffe600] px-2 py-0.5 text-[#121212] hover:bg-[#121212] hover:text-[#ffe600]">{copied ? u.copied : u.copy}</button>
      </div>
    </div>
  );
};

/** Live website rendered at desktop width and scaled down into a laptop frame. */
const SiteFrame: React.FC<{ url: string; title: string; width?: number; loadingText: string }> = ({ url, title, width = 1280, loadingText }) => {
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);
  const [loaded, setLoaded] = useState(false);
  // Measure before the first paint, so the site never shows at the wrong scale first.
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    setScale(el.clientWidth / width);
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  useEffect(() => setLoaded(false), [url]);
  const height = width * 0.625;
  return (
    <div ref={box} className="relative w-full overflow-hidden bg-white" style={{ aspectRatio: '16 / 10' }}>
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-[#252525] bg-[#fbfbfb] animate-pulse">{loadingText}</div>}
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
  <div className="relative mx-auto" data-fit>
    <div className="bg-[#0e0e0e] p-[6px] pb-[8px]">
      <div className="flex items-center gap-1.5 px-2 pb-1.5">
        <span className="w-2 h-2 bg-[#ffe600]" /><span className="w-2 h-2 bg-white" /><span className="w-2 h-2 bg-white" />
        {host && <span className="ml-2 flex-1 truncate bg-white/10 px-2.5 py-0.5 text-[10px] text-white/70">{host}</span>}
        {onExpand && (
          <button onClick={onExpand} className="ml-auto bg-white/15 hover:bg-white/25 px-2.5 py-0.5 text-[10px] font-bold text-white">⤢ {expandLabel}</button>
        )}
      </div>
      <div className="overflow-hidden">{children}</div>
    </div>
    <div className="mx-[-10px] h-3 bg-gradient-to-b from-[#f6f6f6] to-[#d1d1d1]" />
    <div className="mx-auto h-1 w-1/4 bg-[#bababa]" />
  </div>
);

/**
 * Keeps a panel's content inside the panel without scrolling, whatever the screen size.
 * First switches to compact text (data-compact), then narrows the [data-fit] element (the laptop
 * preview, whose height follows its width), then scales the whole body down if that is not enough.
 */
const useFitPanel = (deps: unknown[]) => {
  const panel = useRef<HTMLElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const fit = () => {
      const p = panel.current;
      const b = body.current;
      if (!p || !b) return;
      const flex = b.querySelector<HTMLElement>('[data-fit]');
      b.style.setProperty('zoom', '1');
      if (flex) flex.style.maxWidth = '';
      p.removeAttribute('data-compact');
      let over = p.scrollHeight - p.clientHeight;
      if (over <= 0) return;
      // Smaller text and tighter spacing come first, so the preview stays as large as possible.
      p.setAttribute('data-compact', '');
      over = p.scrollHeight - p.clientHeight;
      if (over <= 0) return;
      if (flex) {
        // 16:10 preview: every pixel of height costs 1.6 pixels of width.
        flex.style.maxWidth = `${Math.max(180, flex.offsetWidth - over * 1.6 - 2)}px`;
        over = p.scrollHeight - p.clientHeight;
        if (over <= 0) return;
      }
      const chrome = p.scrollHeight - b.offsetHeight; // header + padding, not scaled
      const avail = p.clientHeight - chrome;
      let zoom = avail / b.offsetHeight;
      for (let k = 0; k < 6; k++) {
        b.style.setProperty('zoom', String(zoom));
        const cur = p.scrollHeight - chrome;
        if (cur <= avail + 0.5) break;
        zoom *= (avail / cur) * 0.99;
      }
    };
    fit();
    window.addEventListener('resize', fit);
    document.fonts?.ready.then(fit).catch(() => {});
    // Refit when the content's own size changes later (late styles, fonts, images),
    // so the first open never stays at a stale, too-small size.
    let last = -1;
    const ro = new ResizeObserver(() => {
      const b = body.current;
      if (!b || b.scrollHeight === last) return;
      fit();
      last = b.scrollHeight;
    });
    if (body.current) ro.observe(body.current);
    return () => { window.removeEventListener('resize', fit); ro.disconnect(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { panel, body };
};

const Panel: React.FC<{ state: PanelState; onClose: () => void; onPick: (i: number) => void }> = ({ state, onClose, onPick }) => {
  const { t, language } = useLanguage();
  const u = ui[language];
  const fit = useFitPanel([state.kind, state.index, language]);

  // site: embedded live; image only (no link) for internal systems.
  const projects: { title: string; desc: string; site?: string; image?: string; internal?: boolean; features?: string[] }[] = [
    { title: t.proj1Title, desc: t.proj1Desc, site: 'https://defterim.otoyikamabb.com', internal: true },
    { title: t.proj2Title, desc: t.proj2Desc, site: 'https://otoyikamabb.com' },
    { title: t.proj4Title, desc: t.proj4Desc, site: 'https://mersinoyuncak.com' },
    { title: t.proj5Title, desc: t.proj5Desc, site: 'https://www.fotomuat.com' },
    { title: t.proj6Title, desc: t.proj6Desc, site: 'https://celiller.com' },
    { title: t.proj7Title, desc: t.proj7Desc, site: 'https://stok.mersinoyuncak.com', internal: true },
  ];
  const [full, setFull] = useState(false);
  const apps = [
    { name: 'BB Oto Yıkama', cat: t.bbAppCategory, desc: t.bbAppDesc, icon: '/assets/bb-icon.jpg',
      ios: 'https://apps.apple.com/tr/app/bb-oto-y%C4%B1kama/id6760658074?l=tr',
      android: 'https://play.google.com/store/apps/details?id=com.semihsoykan.bbApp' },
    { name: 'Forx: Döviz Altın Kripto', cat: t.forxAppCategory, desc: t.forxAppDesc, icon: '/assets/forx-icon.png',
      ios: 'https://apps.apple.com/tr/app/forx-d%C3%B6viz-alt%C4%B1n-kripto/id6767925625?l=tr' },
  ] as { name: string; cat: string; desc: string; icon: string; ios?: string; android?: string }[];

  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const titles: Record<PanelKind, string> = { projects: t.portfolioTitle, apps: t.mobileAppsTitle, about: t.aboutTitle, social: u.social, contact: t.contactTitle };
  const i = state.index ?? 0;
  const p = projects[i];
  const step = (d: number) => onPick((i + d + projects.length) % projects.length);
  // Swipe left/right on the card (outside the live preview) to change project.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swipeStart = (e: React.TouchEvent) => { swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; };
  const swipeEnd = (e: React.TouchEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.changedTouches[0].clientX - s.x;
    const dy = e.changedTouches[0].clientY - s.y;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };

  return (
    <>
    <aside ref={fit.panel} className={`room-panel ${state.kind === 'projects' ? 'is-wide' : state.kind === 'apps' || state.kind === 'social' ? 'is-phone' : ''}`} role="dialog" aria-label={titles[state.kind]}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-[#121212]">{titles[state.kind]}</h2>
        <button onClick={onClose} aria-label={u.close} className="w-9 h-9 bg-[#fbfbfb] hover:bg-[#f8f8f8] flex items-center justify-center text-[#121212]">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div ref={fit.body}>
      {state.kind === 'projects' && (
        <div className="fit-stack" onTouchStart={swipeStart} onTouchEnd={swipeEnd}>
          {p.site ? (
            <Laptop host={new URL(p.site).host} onExpand={() => setFull(true)} expandLabel={u.expand}>
              <SiteFrame url={p.site} title={p.title} loadingText={u.siteLoading} />
            </Laptop>
          ) : p.image ? (
            <div className="overflow-hidden bg-[#fbfbfb]">
              <img src={p.image} alt={p.title} className="w-full aspect-[16/11] object-cover" />
            </div>
          ) : (
            <div className="bg-[#fbfbfb] aspect-[16/11] flex flex-col items-center justify-center gap-4 p-6 text-center">
              <div className="w-14 h-14 bg-white flex items-center justify-center text-2xl shadow-sm">📦</div>
              <div className="flex flex-wrap justify-center gap-2">
                {p.features?.map((f) => (
                  <span key={f} className="bg-white px-3 py-1.5 text-xs font-bold text-[#121212]">{f}</span>
                ))}
              </div>
            </div>
          )}
          {/* Every project's text sits in the same grid cell, so the block is always as tall as
              the longest one and the laptop above keeps the same size for all projects. */}
          <div className="grid">
            {projects.map((x, k) => (
              <div key={k} aria-hidden={k !== i} className={`col-start-1 row-start-1 ${k === i ? '' : 'invisible'}`}>
                <h3 className="fit-title font-bold text-lg text-[#121212]">{x.title}</h3>
                <p className="fit-desc text-[#1f1f1f] text-sm mt-1">{x.desc}</p>
                {x.site && !x.internal && <p className="fit-note text-xs font-bold text-[#121212] mt-2">👆 {u.browse}</p>}
                {x.internal && <p className="fit-note text-xs text-[#252525] mt-2">{u.internal}</p>}
              </div>
            ))}
          </div>
          {/* One row: previous, expand, next. The bars below show the position and can be tapped too. */}
          <div>
            <div className="flex items-stretch gap-2">
              <button onClick={() => step(-1)} aria-label={language === 'tr' ? 'Önceki proje' : 'Previous project'}
                className="w-11 h-11 shrink-0 border-2 border-[#121212] text-lg font-bold text-[#121212] hover:bg-[#ffe600] active:bg-[#ffe600]">←</button>
              <button onClick={() => setFull(true)} className="room-btn flex-1 h-11" style={{ padding: '0 12px' }}>⤢ {u.expand}</button>
              <button onClick={() => step(1)} aria-label={language === 'tr' ? 'Sonraki proje' : 'Next project'}
                className="w-11 h-11 shrink-0 border-2 border-[#121212] text-lg font-bold text-[#121212] hover:bg-[#ffe600] active:bg-[#ffe600]">→</button>
            </div>
            <div className="grid grid-cols-6 mt-1">
              {projects.map((x, k) => (
                <button key={k} onClick={() => onPick(k)} title={x.title} aria-label={x.title} aria-current={k === i}
                  className="group h-7 px-1 flex items-center">
                  <span className={`block w-full h-1.5 transition ${k === i ? 'bg-[#121212]' : 'bg-[#d9d9d9] group-hover:bg-[#ffe600]'}`} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {state.kind === 'apps' && (
        <PhoneHome kicker={u.myApps} title={u.tapApp} items={apps.map((a) => ({
          key: a.name,
          href: isAndroid && a.android ? a.android : (a.ios ?? a.android ?? '#'),
          label: a.name.split(':')[0],
          title: a.desc,
          icon: <img src={a.icon} alt="" />,
        }))} />
      )}

      {state.kind === 'about' && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img src="/assets/semih.jpg" alt="Semih Soykan" className="w-20 h-20 object-cover" />
            <div>
              <div className="font-bold text-lg text-[#121212]">Semih Soykan</div>
              <div className="text-sm text-[#1f1f1f]">{u.role}</div>
            </div>
          </div>
          <p className="font-display text-lg text-[#121212] leading-snug">“{t.aboutQuote}”</p>
          <p className="text-[#1f1f1f] text-[15px] leading-relaxed">{t.aboutBody}</p>
        </div>
      )}

      {state.kind === 'social' && (
        <PhoneHome kicker={u.social} title={u.elsewhere} items={SOCIALS.map((x) => ({
          key: x.label,
          href: x.href,
          label: x.label,
          title: x.handle,
          icon: <span className="room-phone-icon" style={{ background: x.bg }}><img src={x.icon} alt="" /></span>,
        }))} />
      )}

      {state.kind === 'contact' && <ContactForm />}
      </div>
    </aside>
    {full && p.site && state.kind === 'projects' && (
      <div className="room-full" role="dialog" aria-label={p.title} onClick={() => setFull(false)}>
        <div className="room-full-win" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0e0e0e]">
            <span className="w-2.5 h-2.5 bg-[#ffe600]" /><span className="w-2.5 h-2.5 bg-white" /><span className="w-2.5 h-2.5 bg-white" />
            <span className="ml-2 flex-1 truncate bg-white/10 px-3 py-1 text-xs text-white/75">{new URL(p.site).host}</span>
            <button onClick={() => setFull(false)} className="bg-white/15 hover:bg-white/25 px-3 py-1 text-xs font-bold text-white">{u.close} ✕</button>
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

  const noop = useCallback(() => {}, []);
  const go = useCallback((kind: PanelKind, index?: number) => {
    const target = { kind, index: kind === 'projects' ? index ?? 0 : undefined };
    // Open right away; the character still walks over in the background.
    setPanel(target);
    const [x, z] = kind === 'projects' ? [SPOTS.projects[0], PROJECT_SLOTS[index ?? 0].z] : SPOTS[kind];
    setGoal({ x, z, then: target, id: Date.now() });
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
    projects: [t.proj1Title, t.proj2Title, t.proj4Title, t.proj5Title, t.proj6Title, t.proj7Title],
    apps: u.apps, about: u.about, social: u.social, contact: u.contact, hello: u.hello,
    shelf: language === 'tr' ? 'Neler Yaptım' : 'My Work',
    you: language === 'tr' ? 'Sen' : 'You',
  };

  const menu: PanelKind[] = ['projects', 'apps', 'about', 'social', 'contact'];

  return (
    <div className="room-root">
      <div className="absolute inset-0">
        <Suspense fallback={<Loading text={u.loading} />}>
        <Scene labels={labels} goal={goal} onFloor={onFloor} onGo={go}
          onArrive={noop} bubble={nearMe && panel?.kind !== 'contact'} onNearMe={setNearMe} />
        </Suspense>
      </div>

      {/* top bar */}
      <header className="room-top">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl text-[#121212] leading-none">Semih Soykan</h1>
          <p className="text-sm text-[#252525] mt-1">{u.role}</p>
        </div>
        <div className="flex bg-white p-1 text-xs font-bold border-2 border-[#121212] shadow-[4px_4px_0_#121212]">
          {(['tr', 'en'] as const).map((l) => (
            <button key={l} onClick={() => setLanguage(l)}
              className={`px-3 py-1.5 uppercase transition ${language === l ? 'bg-[#ffe600] text-black' : 'text-[#1f1f1f] hover:text-[#121212]'}`}>
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
