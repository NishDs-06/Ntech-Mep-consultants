// One smooth-scroll engine (Lenis) driving GSAP ScrollTrigger.
// Under prefers-reduced-motion there is no Lenis and no scrubbed timelines.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

export const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

export let lenis = null;

if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95, touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // In-page anchors go through Lenis so pinned sections stay in sync.
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="#"]');
    if (!a) return;
    const url = new URL(a.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.querySelector(url.hash);
    if (!target) return;
    e.preventDefault();
    lenis.scrollTo(target, { duration: 1.6 });
    history.pushState(null, '', url.hash);
  });

  addEventListener('pagehide', () => lenis?.destroy(), { once: true });
}

const refresh = () => ScrollTrigger.refresh();
document.fonts?.ready.then(refresh);
addEventListener('load', refresh, { once: true });

/** Word-by-word heading reveal with an unsplit accessible name. */
export function revealHeading(el, opts = {}) {
  if (reduceMotion) return null;
  const split = SplitText.create(el, { type: 'words', mask: 'words', aria: 'auto' });
  return gsap.from(split.words, {
    yPercent: 110,
    duration: 1.1,
    ease: 'expo.out',
    stagger: 0.06,
    ...opts,
    scrollTrigger: opts.scrollTrigger ?? { trigger: el, start: 'top 85%', once: true },
  });
}

/** Fade-up for supporting copy, sequenced after a heading. */
export function revealUp(targets, trigger, opts = {}) {
  if (reduceMotion) return null;
  return gsap.from(targets, {
    y: 28,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
    stagger: 0.08,
    ...opts,
    scrollTrigger: { trigger, start: 'top 80%', once: true },
  });
}

export { gsap, ScrollTrigger, SplitText };
