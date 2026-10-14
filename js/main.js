/* ═══════════════════════════════════════════════════════════════════════════
   main.js — vanilla port of the agency-site template (all 12 components; origin in SKILL.md).
   Requires (load first): gsap, ScrollTrigger, InertiaPlugin, Lenis.
   Every section initialises independently and silently skips if its markup
   is missing, so you can delete sections from index.html freely.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
'use strict';

/* ─── CONFIG — everything you'd normally tweak lives here ────────────────── */
const CONFIG = {
	tabAwayTitle: 'the gel is still running 🧪',
	introScribbleOnLoad: true,           // full-screen scribble wipe on first load
	wiggle: { logo: 4, socials: 5, jobHeading: 1, googleMap: 1, email: 1, whatsapp: 1 },
	scribble: { strokeWidthStart: '8%', strokeWidthMax: '31%', scale: 0.7, durationIn: 2.2, durationOut: 2.7 },
	// soft fluorescent-protein palette: mint, periwinkle, plum, butter, peach, raspberry, blush
	palette: ['var(--color-green)', 'var(--color-lightblue)', 'var(--color-darkblue)',
		'var(--color-lightgreen)', 'var(--color-orange)', 'var(--color-maroon)', 'var(--color-pink)'],
	lightColors: ['var(--color-green)', 'var(--color-lightblue)', 'var(--color-lightgreen)', 'var(--color-orange)', 'var(--color-pink)'],
	// marquee tiles: techniques & tools as text (no third-party logos)
	brands: [
		{ name: 'GC–MS' }, { name: 'FPLC' }, { name: 'PCR' }, { name: 'ELISA' },
		{ name: 'DSC' }, { name: 'qPCR' }, { name: 'western blot' }, { name: 'pET-SUMO' },
		{ name: 'E. coli', italic: true }, { name: 'PBMCs' }, { name: 'GraphPad Prism' }, { name: 'cloning' }
	],
	cardRotations: [4, -5, 5, -8, 5],           // desktop fan (must match CSS)
	mobileCardRotations: [-6, 4, -8, 5, -3],    // mobile scroll stack
	cursorBubbleTargets: '.footer-column h3, .footer-map-link span, .footer-email, .footer-whatsapp, .single-social, .site-logo, .nav-work-btn, .nav-wa-link, .edu-card--pub',
	cursorBubbleLabels: { '.site-logo': 'to top', '.edu-card--pub': 'read it', '.footer-email': 'say hi', '.nav-wa-link': 'say hi' }
};

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const canHover = matchMedia('(hover: hover) and (pointer: fine)').matches;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.registerPlugin(ScrollTrigger, InertiaPlugin);

/* ─── shared: steps(1) wiggle on hover ───────────────────────────────────── */
function wiggle(el, intensity, duration = 0.17) {
	if (!el || !intensity) return;
	const target = el.querySelector('[data-wiggle-target]') || el;
	gsap.set(target, { transformOrigin: 'center center' });
	let tween;
	el.addEventListener('mouseenter', () => {
		tween = gsap.to(target, { rotation: intensity, duration, repeat: -1, yoyo: true, ease: 'steps(1)' });
	});
	el.addEventListener('mouseleave', () => {
		if (tween) { tween.kill(); gsap.to(target, { rotation: 0, duration: 0.3, ease: 'power2.out' }); }
	});
}

/* ─── 1. Smooth scroll + tab title ───────────────────────────────────────── */
function initSmoothScroll() {
	const original = document.title;
	document.addEventListener('visibilitychange', () => {
		document.title = document.hidden ? `${CONFIG.tabAwayTitle} - ${original.split('—')[0].trim()}` : original;
	});
	if (reduceMotion) return;
	const lenis = new Lenis({
		duration: 1.2,
		easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		smoothWheel: true,
		touchMultiplier: 1.5
	});
	lenis.on('scroll', ScrollTrigger.update);
	gsap.ticker.add((time) => lenis.raf(time * 1000));
	gsap.ticker.lagSmoothing(0);
	window.__lenis = lenis;
}

/* ─── 2. Navbar: colour switching, pop-outs, wiggles ─────────────────────── */
function initNavbar() {
	const navbar = $('.navbar');
	if (!navbar) return;

	// on-dark / on-light by section under the navbar's vertical centre
	const zones = [   // [selector, mode] — evaluated bottom-up, first match wins
		['.main-footer', 'on-dark'],
		['.Double-marquee', 'on-light'],
		['.service-cards-wrapper', 'on-light'],
		['#experience', 'on-dark'],
		['.content-section', 'on-light']
	];
	const setMode = (mode) => {
		navbar.classList.toggle('on-dark', mode === 'on-dark');
		navbar.classList.toggle('on-light', mode === 'on-light');
	};
	const update = () => {
		const pos = window.scrollY + navbar.offsetHeight / 2;
		for (const [sel, mode] of zones) {
			const el = $(sel);
			if (el && pos >= el.getBoundingClientRect().top + window.scrollY) return setMode(mode);
		}
		setMode('on-dark');
	};
	window.addEventListener('scroll', update, { passive: true });
	update();

	wiggle($('.site-logo'), CONFIG.wiggle.logo);

	const overlay = $('.nav-overlay');
	if (overlay) gsap.set(overlay, { opacity: 0, visibility: 'hidden' });
	const showOverlay = () => { if (!overlay) return; gsap.set(overlay, { visibility: 'visible' }); gsap.to(overlay, { opacity: 1, duration: 0.35, ease: 'power2.out' }); };
	const hideOverlay = () => { if (!overlay) return; gsap.to(overlay, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => gsap.set(overlay, { visibility: 'hidden' }) }); };

	// pop-out box that grows from an icon's centre
	function popout(trigger, box, icon, extraEnter, extraLeave) {
		if (!trigger || !box) return;
		const items = $$('.nav-popout-inner > *', box);
		gsap.set(box, { visibility: 'visible', scale: 1, opacity: 1 });
		const b = box.getBoundingClientRect();
		const i = (icon || box).getBoundingClientRect();
		const origin = `${i.left + i.width / 2 - b.left}px ${i.top + i.height / 2 - b.top}px`;
		gsap.set(box, { visibility: 'hidden', scale: 0, opacity: 0, transformOrigin: origin });
		gsap.set(items, { y: 10, opacity: 0 });

		let isOpen = false;
		const open = () => {
			isOpen = true; trigger.classList.add('is-open');
			gsap.killTweensOf([box, ...items]);
			showOverlay();
			extraEnter && extraEnter();
			gsap.set(box, { visibility: 'visible' });
			gsap.fromTo(box, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: 'expo.out' });
			gsap.to(items, { y: 0, opacity: 1, duration: 0.45, stagger: 0.06, ease: 'power3.out', delay: 0.18 });
		};
		const close = () => {
			if (!isOpen) return;
			isOpen = false; trigger.classList.remove('is-open');
			gsap.killTweensOf([box, ...items]);
			hideOverlay();
			extraLeave && extraLeave();
			gsap.to(items, { y: 10, opacity: 0, duration: 0.15, ease: 'power2.in' });
			gsap.to(box, { scale: 0, opacity: 0, duration: 0.3, ease: 'expo.in', delay: 0.05, onComplete: () => gsap.set(box, { visibility: 'hidden' }) });
		};
		if (canHover) {
			trigger.addEventListener('mouseenter', open);
			trigger.addEventListener('mouseleave', close);
		} else {
			// touch: tap the icon to toggle, tap a link inside to follow it, tap anywhere else to close
			trigger.addEventListener('click', (e) => {
				if (e.target.closest('.nav-popout a')) { close(); return; }
				e.preventDefault(); e.stopPropagation();
				isOpen ? close() : (closeAllPopouts(), open());
			});
			popoutClosers.push(close);
		}
	}
	const popoutClosers = [];
	const closeAllPopouts = () => popoutClosers.forEach((c) => c());
	if (!canHover) {
		document.addEventListener('click', (e) => { if (!e.target.closest('.nav-hover-trigger')) closeAllPopouts(); });
		window.addEventListener('scroll', closeAllPopouts, { passive: true });
	}

	const workBlob = $('.nav-bar__work-blob-svg');
	if (workBlob) gsap.set(workBlob, { transformOrigin: 'center center' });
	popout($('.nav-left'), $('.nav-work-box'), workBlob,
		() => { gsap.killTweensOf(workBlob); gsap.to(workBlob, { rotation: '+=360', duration: 0.7, ease: 'power3.inOut' }); },
		() => { gsap.killTweensOf(workBlob); gsap.to(workBlob, { rotation: 0, duration: 0.5, ease: 'power2.out' }); });

	const waPath = $('.nav-bar__whatsapp-svg path');
	popout($('.nav-right'), $('.nav-wa-box'), $('.nav-bar__whatsapp-svg'),
		() => waPath && gsap.to(waPath, { fill: '#c4153a', duration: 0.3 }),
		() => waPath && gsap.to(waPath, { fill: 'currentColor', duration: 0.3 }));

	// work items: badge wiggle + image tilt
	$$('.nav-work-item').forEach((item) => {
		const badge = $('.nav-work-badge', item), img = $('.nav-work-item__img', item);
		let t;
		item.addEventListener('mouseenter', () => {
			if (badge) { gsap.set(badge, { transformOrigin: 'center center' }); t = gsap.to(badge, { rotation: 5, duration: 0.15, repeat: -1, yoyo: true, ease: 'steps(1)' }); }
			if (img) gsap.to(img, { rotation: 16, scale: 1.15, duration: 0.25, ease: 'power2.out' });
		});
		item.addEventListener('mouseleave', () => {
			if (t) t.kill();
			if (badge) gsap.to(badge, { rotation: 0, duration: 0.3, ease: 'power2.out' });
			if (img) gsap.to(img, { rotation: 0, scale: 1, duration: 0.3, ease: 'power2.out' });
		});
	});

	const btnText = $('.nav-work-btn__text');
	if (btnText) {
		btnText.setAttribute('data-wiggle-target', '');   // wiggle() rotates this, not the whole button
		gsap.set(btnText, { display: 'inline-block' });
		wiggle($('.nav-work-btn'), 4, 0.12);
	}
}

/* ─── 3. Cursor bubble ───────────────────────────────────────────────────── */
function initCursorBubble() {
	const bubble = $('.cursor-bubble');
	if (!bubble || !canHover) return;
	const xTo = gsap.quickTo(bubble, 'x', { duration: 0.5, ease: 'power3' });
	const yTo = gsap.quickTo(bubble, 'y', { duration: 0.5, ease: 'power3' });
	let active = false;
	gsap.set(bubble, { rotation: -30 });
	const show = () => { gsap.killTweensOf(bubble, 'opacity,scale,rotation'); gsap.to(bubble, { opacity: 1, scale: 1, rotation: 0, duration: 1.7, delay: 0.1, ease: 'elastic.out(1, 0.4)' }); };
	const hide = () => { gsap.killTweensOf(bubble, 'opacity,scale,rotation'); gsap.to(bubble, { opacity: 1, scale: 0, rotation: -30, duration: 0.3, ease: 'sine.inOut' }); };

	window.addEventListener('mousemove', (e) => { xTo(e.clientX + 13); yTo(e.clientY - 43); });
	document.addEventListener('mouseover', (e) => {
		const found = e.target.closest(CONFIG.cursorBubbleTargets);
		if (found && !active) {
			active = true;
			bubble.textContent = Object.entries(CONFIG.cursorBubbleLabels).find(([sel]) => found.matches(sel))?.[1] || 'click';
			show();
		} else if (!found && active) { active = false; hide(); }
	});
	document.addEventListener('mouseleave', () => { if (active) { active = false; hide(); } });
}

/* ─── 4. Hero: glowing "fluorescence" blobs + cursor hello bubble ────────── */
function initHero() {
	const hero = $('.vimeo-hero');
	if (!hero) return;
	const bubble = $('.hero-bubble'), title = $('.vimeo-hero__title', hero), photo = $('.hero-photo', hero);
	const glows = $$('.glow', hero);

	// entrance: words rise, photo pops
	if (!reduceMotion) {
		gsap.from($$('.vimeo-hero__word', hero), { yPercent: 110, opacity: 0, rotation: 4, duration: 1.1, stagger: 0.07, ease: 'expo.out', delay: CONFIG.introScribbleOnLoad ? 2.4 : 0.2 });
		if (photo) gsap.from(photo, { scale: 0, rotation: -25, duration: 1.6, ease: 'elastic.out(1, 0.45)', delay: CONFIG.introScribbleOnLoad ? 2.9 : 0.6 });
		$$('.home-header__smiley, .home-header__star', hero).forEach((s, i) =>
			gsap.from(s, { scale: 0, duration: 1.4, ease: 'elastic.out(1, 0.4)', delay: (CONFIG.introScribbleOnLoad ? 3.2 : 0.8) + i * 0.2 }));
		// slow drifting glows, like cells under a fluorescence microscope
		glows.forEach((g, i) => gsap.to(g, {
			xPercent: () => gsap.utils.random(-35, 35), yPercent: () => gsap.utils.random(-30, 30), scale: () => gsap.utils.random(0.8, 1.25),
			duration: gsap.utils.random(6, 10), repeat: -1, yoyo: true, repeatRefresh: true, ease: 'sine.inOut', delay: i * 0.4
		}));
		gsap.to(hero, { '--hero-shift': 1, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
	}
	if (photo && !canHover) {
		const img = $('.hero-photo__frame', photo);
		photo.addEventListener('click', () => gsap.fromTo(img, { rotation: 10, scale: 1.08 }, { rotation: 0, scale: 1, duration: 1.2, ease: 'elastic.out(1, 0.35)' }));
	}
	if (photo && canHover) {
		const img = $('.hero-photo__frame', photo);
		photo.addEventListener('mouseenter', () => gsap.to(img, { rotation: 8, scale: 1.06, duration: 0.9, ease: 'elastic.out(1, 0.4)' }));
		photo.addEventListener('mouseleave', () => gsap.to(img, { rotation: 0, scale: 1, duration: 0.9, ease: 'elastic.out(1, 0.4)' }));
	}
	if (!canHover) return;
	// glows lean toward the cursor
	const layer = $('.hero-glow', hero);
	if (layer && !reduceMotion) {
		const lx = gsap.quickTo(layer, 'x', { duration: 1.2, ease: 'power3' }), ly = gsap.quickTo(layer, 'y', { duration: 1.2, ease: 'power3' });
		hero.addEventListener('mousemove', (e) => { const r = hero.getBoundingClientRect(); lx((e.clientX - r.left - r.width / 2) * 0.06); ly((e.clientY - r.top - r.height / 2) * 0.06); });
	}
	if (!bubble) return;
	const xTo = gsap.quickTo(bubble, 'x', { duration: 0.5, ease: 'power3' });
	const yTo = gsap.quickTo(bubble, 'y', { duration: 0.5, ease: 'power3' });
	const pop = (on, elastic) => {
		gsap.killTweensOf(bubble, 'opacity,scale,rotation');
		gsap.to(bubble, on
			? { opacity: 1, scale: 1, rotation: 0, duration: elastic ? 1.7 : 0.3, delay: elastic ? 0.05 : 0, ease: elastic ? 'elastic.out(1, 0.4)' : 'sine.inOut' }
			: { opacity: 0, scale: 0, rotation: -30, duration: 0.3, ease: 'sine.inOut' });
	};
	window.addEventListener('mousemove', (e) => { xTo(e.clientX + 13); yTo(e.clientY - 43); });
	hero.addEventListener('mouseenter', () => pop(true, true));
	hero.addEventListener('mouseleave', () => pop(false));
	[title, photo, $('.hero-scroll', hero)].forEach((el) => {
		if (!el) return;
		el.addEventListener('mouseenter', () => pop(false));
		el.addEventListener('mouseleave', () => pop(true));
	});
}

/* ─── 4b. Experience: split timeline (pinned year rail + depth parallax) ── */
function initExperience() {
	const section = $('#experience');
	if (!section) return;
	const items = $$('.exp-item', section);
	const reel = $('.exp-year__reel', section), labels = $$('.exp-rail__label span', section);
	const dots = $$('.exp-progress__dot', section), fill = $('.exp-progress__fill', section);

	// the rail always tracks which role is in the middle of the screen
	let current = -1;
	const setActive = (i) => {
		if (i === current) return;
		current = i;
		if (reel) gsap.to(reel, { yPercent: -100 * i / items.length, duration: 0.9, ease: 'expo.out', overwrite: true });
		labels.forEach((l, j) => l.classList.toggle('is-active', j === i));
		const num = $('.exp-rail__num', section);
		if (num) num.textContent = String(i + 1).padStart(2, '0');
		dots.forEach((d, j) => d.classList.toggle('is-passed', j <= i));
		items.forEach((it, j) => it.classList.toggle('is-active', j === i));
	};
	setActive(0);
	items.forEach((item, i) => ScrollTrigger.create({
		trigger: item, start: 'top 55%', end: 'bottom 55%',
		onToggle: (self) => self.isActive && setActive(i)
	}));
	if (fill) gsap.fromTo(fill, { scaleY: 0 }, { scaleY: 1, ease: 'none',
		scrollTrigger: { trigger: '.exp-list', start: 'top 55%', end: 'bottom 55%', scrub: true } });

	if (!reduceMotion) {
		gsap.from($$('.exp-head', section), { y: 60, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.1,
			scrollTrigger: { trigger: section, start: 'top 75%', toggleActions: 'play none none reverse' } });
		$$('.edu-card', section).forEach((item) => gsap.from(item, { y: 80, opacity: 0, duration: 1, ease: 'expo.out',
			scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } }));
		$$('.exp-sticker', section).forEach((s, i) => {
			gsap.fromTo(s, { scale: 0, rotation: -30 }, { scale: 1, rotation: i % 2 ? 10 : -8, duration: 1.4, ease: 'elastic.out(1, 0.4)',
				scrollTrigger: { trigger: s.parentElement, start: 'top 75%', toggleActions: 'play none none reverse' } });
		});

		const mm = gsap.matchMedia();
		mm.add({ wide: '(min-width: 1201px)', mid: '(min-width: 901px) and (max-width: 1200px)' }, (ctx) => {
			// depth parallax: each layer starts displaced by its data-speed and drifts home (gsap-parallax-scroll pattern)
			// below 1201px the date sits above the text, so only the sticker floats there
			const wide = ctx.conditions.wide;
			items.forEach((item) => {
				$$(wide ? '[data-speed]' : '.exp-sticker[data-speed]', item).forEach((el) => gsap.from(el, {
					y: () => 1 - parseFloat(el.dataset.speed),
					ease: 'none',
					scrollTrigger: { trigger: item, start: 'top bottom', end: 'center 45%', scrub: 1.9, invalidateOnRefresh: true }
				}));
				gsap.from(item, { y: 140, ease: 'none', scrollTrigger: { trigger: item, start: 'top bottom', end: 'top 50%', scrub: 1.2 } });
			});
		});
		mm.add('(max-width: 900px)', () => {
			items.forEach((item) => gsap.from(item, { y: 60, opacity: 0, duration: 0.9, ease: 'expo.out',
				scrollTrigger: { trigger: item, start: 'top 88%', toggleActions: 'play none none reverse' } }));
		});
	}
	if (!canHover) $$('.exp-sticker', section).forEach((s) => s.addEventListener('click', () =>
		gsap.fromTo(s, { scale: 1.25 }, { scale: 1, rotation: '+=360', duration: 1.2, ease: 'elastic.out(1, 0.4)' })));
	$$('.exp-sticker', section).forEach((s) => {
		s.addEventListener('mouseenter', () => gsap.to(s, { scale: 1.2, rotation: '+=20', duration: 0.8, ease: 'elastic.out(1, 0.35)' }));
		s.addEventListener('mouseleave', () => gsap.to(s, { scale: 1, rotation: '-=20', duration: 0.8, ease: 'elastic.out(1, 0.35)' }));
	});
}

/* ─── 4c. In-page anchors via Lenis ──────────────────────────────────────── */
function initAnchors() {
	document.addEventListener('click', (e) => {
		const a = e.target.closest('a[href^="#"]');
		if (!a) return;
		const id = a.getAttribute('href');
		if (id === '#') { e.preventDefault(); return; }
		const target = $(id);
		if (!target) return;
		e.preventDefault();
		window.__lenis ? window.__lenis.scrollTo(target, { offset: -20, duration: 1.6 }) : target.scrollIntoView({ behavior: 'smooth' });
	});
}

/* ─── 5. Horizontal words: pinned sideways scroll + elastic letters ──────── */
function initHorizontalWords() {
	const section = $('.horizontal-words-section');
	if (!section) return;
	const track = $('.horizontal-words__relative', section);
	const entrance = () => window.innerHeight, pinned = 2500;

	const scrollTween = gsap.timeline({
		scrollTrigger: { trigger: section, start: 'top bottom', end: () => `+=${entrance() + pinned}`, scrub: 1, invalidateOnRefresh: true }
	});
	scrollTween
		.fromTo(track, { x: () => window.innerWidth }, { x: () => window.innerWidth * 0.5, ease: 'none', duration: entrance() })
		.to(track, { x: () => -(track.scrollWidth - window.innerWidth * 0.5), ease: 'none', duration: pinned });

	ScrollTrigger.create({ trigger: section, start: 'top top', end: () => `+=${pinned}`, pin: true, pinSpacing: true, invalidateOnRefresh: true });

	if (reduceMotion) return;
	const bounce = (el, extra) => gsap.from(el, Object.assign({
		yPercent: (Math.random() - 0.5) * 500,
		rotation: (Math.random() - 0.5) * 60,
		ease: 'elastic.out(1.2, 1)',
		scrollTrigger: { trigger: el, containerAnimation: scrollTween, start: 'left 90%', end: 'left 50%', scrub: 0.5 }
	}, extra));
	$$('.letter', section).forEach((l) => bounce(l));
	$$('.horizontal-words__sticker-watch, .horizontal-words__sticker-cursor, .horizontal-words__sticker-phone', section)
		.forEach((s) => bounce(s, { scale: 0, yPercent: (Math.random() - 0.5) * 400 }));
	$$('.horizontal-words__arrow-svg path, .horizontal-words__arrow-end-svg path', section).forEach((p) => {
		const len = p.getTotalLength();
		gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
		gsap.to(p, { strokeDashoffset: 0, scrollTrigger: { trigger: p.parentElement, containerAnimation: scrollTween, start: 'left 90%', end: 'left 50%', scrub: 0.5 } });
	});
}

/* ─── 6. Motion cards: InertiaPlugin fling + entry pop/draw ──────────────── */
function initMotionCards() {
	const section = $('#motion-card-section');
	if (!section) return;
	const fling = (el, vMul, rMul) => {
		let lastX = 0, lastY = 0, sx = 0, sy = 0;
		const r0 = gsap.getProperty(el, 'rotation'), x0 = gsap.getProperty(el, 'x'), y0 = gsap.getProperty(el, 'y');
		el.addEventListener('mouseenter', (e) => { sx = sy = 0; lastX = e.clientX; lastY = e.clientY; });
		el.addEventListener('mousemove', (e) => { sx = e.clientX - lastX; sy = e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; });
		el.addEventListener('mouseleave', () => gsap.to(el, { inertia: {
			x: { velocity: sx * vMul, end: x0 }, y: { velocity: sy * vMul, end: y0 }, rotation: { velocity: sx * rMul, end: r0 } } }));
	};
	if (canHover) {
		$$('.motion-card__card', section).forEach((c) => fling(c, 20, 1.5));
		$$('.motion-card__floating-label', section).forEach((l) => fling(l, 25, 2));
	} else {
		// touch: a tap tosses the card or label in a random direction and it springs home
		const toss = (el, power) => {
			const r0 = gsap.getProperty(el, 'rotation'), x0 = gsap.getProperty(el, 'x'), y0 = gsap.getProperty(el, 'y');
			el.addEventListener('click', () => {
				const a = Math.random() * Math.PI * 2;
				gsap.to(el, { inertia: { x: { velocity: Math.cos(a) * power, end: x0 }, y: { velocity: Math.sin(a) * power, end: y0 }, rotation: { velocity: (Math.random() - 0.5) * power * 0.15, end: r0 } } });
			});
		};
		$$('.motion-card__card', section).forEach((c) => toss(c, 900));
		$$('.motion-card__floating-label', section).forEach((l) => toss(l, 1100));
	}
	const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 70%', toggleActions: 'play none none reverse' } });
	const sticker = $('.motion-card__sticker--top img', section);
	if (sticker) { gsap.set(sticker, { scale: 0, opacity: 0, rotation: -30 }); tl.to(sticker, { scale: 1, opacity: 1, rotation: 0, duration: 1.7, ease: 'elastic.out(1, 0.4)' }, 0); }
	const line = $('.motion-card__underline-path', section);
	if (line) { const len = line.getTotalLength(); gsap.set(line, { strokeDasharray: len, strokeDashoffset: len }); tl.to(line, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }, 0.2); }
}

/* ─── 7. Service cards: elastic fan (desktop) / pinned stack (mobile) ────── */
function initServiceCards() {
	const wrapper = $('.cards-wrapper');
	if (!wrapper) return;
	gsap.to('.title-underline-svg path', {
		strokeDashoffset: 0, duration: 1.2, ease: 'power3.out', stagger: 0.3,
		scrollTrigger: { trigger: '.service-cards-wrapper', start: 'top 70%', toggleActions: 'play none none reverse' }
	});
	const cards = $$('.card', wrapper);
	const rot = CONFIG.cardRotations;
	const mm = gsap.matchMedia();

	// fan needs a mouse and room; touch screens and anything ≤1024px get the pinned stack
	const FAN = '(min-width: 1025px) and (hover: hover)', STACK = '(max-width: 1024px), (hover: none)';
	mm.add(FAN, () => {
		const ELASTIC = 'elastic.out(1, 0.5)', CARD_W = 320, HOVER_GAP = 120, CLUSTER_GAP = 150;
		// the fan spans ~1340px; scale the whole wrapper down on smaller laptops
		const fit = () => {
			const s = Math.min(1, (window.innerWidth - 40) / 1340);
			gsap.set(wrapper, { scale: s, transformOrigin: 'top center', marginBottom: 100 + 650 * (s - 1) });
		};
		fit();
		window.addEventListener('resize', fit);
		const enter = (index) => () => {
			const hovered = cards[index];
			const left = hovered.offsetLeft;
			gsap.to(hovered, { x: 0, y: 50 - hovered.offsetTop, rotation: 0, scale: 1.08, duration: 0.9, ease: ELASTIC, overwrite: true });
			cards.forEach((c, i) => {
				if (i === index) return;
				const right = i > index;
				const slot = right ? i - index - 1 : index - i - 1;
				const targetAbs = right ? left + CARD_W + HOVER_GAP + slot * CLUSTER_GAP : left - HOVER_GAP - CARD_W - slot * CLUSTER_GAP;
				const x = right ? Math.max(targetAbs - c.offsetLeft, 10) : Math.min(targetAbs - c.offsetLeft, -10);
				gsap.to(c, { x, y: x * Math.tan(rot[i] * Math.PI / 180), rotation: rot[i], scale: 1, duration: 1.0, ease: ELASTIC, overwrite: true });
			});
		};
		const leave = () => cards.forEach((c, i) => gsap.to(c, { x: 0, y: 0, scale: 1, rotation: rot[i], zIndex: i + 1, duration: 1.0, ease: ELASTIC, overwrite: true, delay: 0.08 }));
		const handlers = cards.map((c, i) => { const h = enter(i); c.addEventListener('mouseenter', h); c.addEventListener('mouseleave', leave); return h; });
		return () => {
			window.removeEventListener('resize', fit);
			cards.forEach((c, i) => { c.removeEventListener('mouseenter', handlers[i]); c.removeEventListener('mouseleave', leave); });
		};
	});

	mm.add(STACK, () => {
		wrapper.classList.add('is-stack');
		const per = window.innerHeight * 0.8, navH = 60, mrot = CONFIG.mobileCardRotations;
		cards.forEach((c, i) => gsap.set(c, {
			position: 'absolute', left: '50%', top: 0, xPercent: -50, y: i === 0 ? 0 : window.innerHeight * 1.1,
			rotation: mrot[i % mrot.length], zIndex: i + 1, transformOrigin: 'center center'
		}));
		// the pin's own spacing supplies the scroll distance, so the wrapper only needs to hold one card
		// (the template also added per × (n − 1) here, which left ~2000px of blank page after the stack)
		gsap.set(wrapper, { height: Math.max(...cards.map((c) => c.offsetHeight)) + 60 });
		// one pinned timeline: each card slides up during its own slice of the pin.
		// (separate triggers on the pinned element got shifted past the pin end by ScrollTrigger's pin spacing)
		const tl = gsap.timeline({ scrollTrigger: { trigger: wrapper, start: `top ${navH}px`, end: `+=${per * (cards.length - 1)}`, pin: true, pinSpacing: true, scrub: 0.4, invalidateOnRefresh: true } });
		cards.forEach((c, i) => {
			if (!i) return;
			tl.fromTo(c, { y: () => window.innerHeight * 1.1 }, { y: 0, ease: 'power3.out', duration: 1 }, i - 1);
		});
		return () => wrapper.classList.remove('is-stack');
	});
}

/* ─── 8. Double marquee: constraint-shuffled logos + entry draw ──────────── */
function shuffle(a) { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function shuffleNoAdjacentSrc(list) {
	const arr = shuffle(list);
	for (let i = 1; i < arr.length; i++) if (arr[i].name === arr[i - 1].name)
		for (let j = i + 1; j < arr.length; j++) if (arr[j].name !== arr[i - 1].name) { [arr[i], arr[j]] = [arr[j], arr[i]]; break; }
	const n = arr.length;
	if (n > 2 && arr[n - 1].name === arr[0].name)
		for (let j = 1; j < n - 1; j++) if (arr[j].name !== arr[0].name && arr[j].name !== arr[n - 2].name) { [arr[n - 1], arr[j]] = [arr[j], arr[n - 1]]; break; }
	return arr;
}
function colorsNoAdjacent(count, pool) {
	const out = [];
	for (let i = 0; i < count; i++) {
		const prev = out[i - 1], seam = i === count - 1 ? out[0] : null;
		const ok = pool.filter((c) => c !== prev && c !== seam);
		const p = ok.length ? ok : pool.filter((c) => c !== prev);
		out.push(p[Math.floor(Math.random() * p.length)]);
	}
	return out;
}
function initMarquee() {
	const right = $('.marquee-right');
	if (!right) return;
	const build = () => {
		$$('.marquee-track', right).forEach((track) => {
			const brands = shuffleNoAdjacentSrc(CONFIG.brands);
			const colors = colorsNoAdjacent(brands.length, CONFIG.palette);
			let items = brands.map((b, i) => ({ b, c: colors[i] }));
			items = [...items, ...items];   // duplicate → seamless CSS loop (vertical on desktop, horizontal rows on phones)
			track.innerHTML = items.map(({ b, c }) => {
				const ink = CONFIG.lightColors.includes(c) ? 'var(--color-dark)' : 'var(--color-white)';
				const label = b.italic ? `<em>${b.name}</em>` : b.name;
				return `<div class="marquee-item" data-brand="${b.name}" style="background-color:${c};color:${ink}"><div class="marquee-logo"><span class="marquee-word">${label}</span></div></div>`;
			}).join('');
		});
		ScrollTrigger.refresh();
	};
	build();
	matchMedia('(max-width: 768px)').addEventListener('change', build);

	gsap.set('.marquee-left .marquee-svg-item:nth-child(2) path', { strokeDashoffset: 1000 });
	gsap.timeline({ scrollTrigger: { trigger: '.Double-marquee', start: 'top 70%', toggleActions: 'play none none reverse' } })
		.to('.marquee-underline', { scaleX: 1, opacity: 1, duration: 1, ease: 'power2.out' })
		.to('.marquee-left .marquee-svg-item:nth-child(1)', { scale: 1, opacity: 1, rotation: -10, duration: 0.6, ease: 'back.out(1.7)' }, '-=0.5')
		.to('.marquee-left .marquee-svg-item:nth-child(2) path', { strokeDashoffset: 0, duration: 1.5, ease: 'power2.out' }, '-=0.3');
}

/* ─── 9. Footer: map draw, credits pop, stickers pop + push, wiggles ─────── */
function initFooter() {
	const footer = $('.main-footer');
	if (!footer) return;

	const map = $('.footer-map-link');
	if (map) {
		const paths = $$('.draw-btn__svg path', map);
		paths.forEach((p) => gsap.set(p, { strokeDasharray: p.getTotalLength(), strokeDashoffset: 0 }));
		map.addEventListener('mouseenter', () => gsap.fromTo(paths, { strokeDashoffset: (i, el) => el.getTotalLength() }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1, overwrite: true }));
		map.addEventListener('mouseleave', () => gsap.to(paths, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out', overwrite: true }));
	}

	const credits = $('.footer-credits-wrapper');
	if (credits) {
		const box = $('.credits-box', credits), items = $$('.credits-item', box), btn = $('.footer-credits', credits);
		const content = $('.credits-content', box);
		// measure the content on every open: web fonts may load after init and widen the text
		const measure = () => ({ W: content.offsetWidth + 6, H: content.offsetHeight + 6 });
		let { W, H } = measure();
		const startY = btn.offsetHeight + 15;
		gsap.set(box, { visibility: 'hidden', width: 0, height: 0, opacity: 0, y: startY });
		gsap.set(items, { y: H });
		let creditsOpen = false;
		if (!canHover) {
			btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); credits.dispatchEvent(new Event(creditsOpen ? 'mouseleave' : 'mouseenter')); });
			document.addEventListener('click', (e) => { if (creditsOpen && !e.target.closest('.footer-credits-wrapper')) credits.dispatchEvent(new Event('mouseleave')); });
		}
		credits.addEventListener('mouseleave', () => { creditsOpen = false; });
		credits.addEventListener('mouseenter', () => {
			creditsOpen = true;
			({ W, H } = measure());
			gsap.killTweensOf([box, ...items]); gsap.set(box, { visibility: 'visible' });
			gsap.to(box, { width: W, height: H, opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' });
			gsap.to(items, { y: 0, duration: 0.5, stagger: 0.04, ease: 'power3.out', delay: 0.1 });
		});
		credits.addEventListener('mouseleave', () => {
			gsap.killTweensOf([box, ...items]);
			gsap.to(box, { width: 0, height: 0, opacity: 0, y: startY, duration: 0.35, ease: 'power3.in', onComplete: () => gsap.set(box, { visibility: 'hidden' }) });
			gsap.to(items, { y: H, duration: 0.4, ease: 'power3.in', stagger: -0.03, delay: 0.1 });
		});
	}

	const stickers = $$('.footer-sticker');
	const rots = [12, -10, 8, -12, 10, -8];
	gsap.set(stickers, { scale: 0, opacity: 0, transformOrigin: 'center bottom', rotation: (i) => rots[i % rots.length] });
	gsap.to(stickers, {
		scale: 1, opacity: 1, rotation: (i) => rots[i % rots.length] * 0.7, duration: 0.7, ease: 'back.out(1.7)', stagger: 0.12,
		scrollTrigger: { trigger: '.footer-stickers', start: 'top 80%', toggleActions: 'play none none reverse' }
	});
	if (!canHover) stickers.forEach((s, i) => s.addEventListener('click', () => {
		const base = rots[i % rots.length] * 0.7;
		gsap.killTweensOf(s);
		gsap.fromTo(s, { scale: 1.25, rotation: base + (Math.random() > 0.5 ? 18 : -18), y: -20 }, { scale: 1, rotation: base, y: 0, duration: 1.1, ease: 'elastic.out(1, 0.35)' });
	}));
	if (canHover) {   // one listener for all stickers (original used one per sticker)
		const R = 180, STRENGTH = 4, MAX = 55, MIN_SPEED = 3;
		const clamp = (v) => Math.max(-MAX, Math.min(MAX, v));
		let px = 0, py = 0;
		document.addEventListener('mousemove', (e) => {
			const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
			const speed = Math.hypot(dx, dy);
			if (speed <= MIN_SPEED || e.target.closest('.credits-box')) return;
			stickers.forEach((s, i) => {
				const r = s.getBoundingClientRect();
				if (r.bottom < 0 || r.top > innerHeight) return;
				const on = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
				const dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
				if (on || dist >= R) return;
				const f = 1 - dist / R, x = clamp(dx * STRENGTH * f), y = clamp(dy * STRENGTH * f), base = rots[i % rots.length] * 0.7;
				gsap.killTweensOf(s);
				gsap.to(s, { x, y, rotation: base + x * 0.25, duration: 0.18, ease: 'power3.out' });
				gsap.to(s, { x: 0, y: 0, rotation: base, duration: 1.1, ease: 'elastic.out(1, 0.35)', delay: 0.18 });
			});
		});
	}

	const W = CONFIG.wiggle;
	[['.footer-column:first-child h3', W.jobHeading], ['.footer-map-link span', W.googleMap], ['.footer-email', W.email],
	 ['.footer-whatsapp', W.whatsapp], ['.credits-name', W.socials], ['.single-social', W.socials]]
		.forEach(([sel, n]) => $$(sel).forEach((el) => wiggle(el, n)));
}

/* ─── 10. Scribble page transition (logo click + intro) ──────────────────── */
function initScribble() {
	const logo = $('.site-logo'), svg = $('.transition-scribble'), path = $('.transition-scribble path');
	if (!logo || !svg || !path) return;
	const C = CONFIG.scribble;

	const run = (e) => {
		if (e) e.preventDefault();
		if (gsap.isTweening(path) || document.body.classList.contains('is-transitioning')) return;
		gsap.set(svg, { scale: C.scale });
		const l = path.getTotalLength() + 5;
		const color = CONFIG.palette[Math.floor(Math.random() * CONFIG.palette.length)];
		svg.style.color = color;

		let tLogo = $('.transition-logo');
		if (!tLogo) {
			tLogo = document.createElement('div');
			tLogo.className = 'transition-logo';
			tLogo.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10000;pointer-events:none;opacity:0;display:flex;justify-content:center;align-items:center;';
			const clone = logo.cloneNode(true); clone.style.width = '150px'; clone.style.height = 'auto';
			tLogo.appendChild(clone); document.body.appendChild(tLogo);
		}
		tLogo.style.color = CONFIG.lightColors.includes(color) ? '#000' : '#fff';
		const tSvg = $('svg', tLogo);

		gsap.set(path, { strokeDasharray: l, strokeDashoffset: l, strokeWidth: C.strokeWidthStart, opacity: 1 });
		gsap.set(svg, { opacity: 1, x: 0, y: 0, rotation: 0 });
		document.body.classList.add('is-transitioning');
		const bubble = $('.cursor-bubble'); if (bubble) gsap.to(bubble, { opacity: 0, duration: 0.2 });

		const tl = gsap.timeline({ onComplete: () => { document.body.classList.remove('is-transitioning'); gsap.set(path, { strokeWidth: '0%' }); gsap.set(tLogo, { autoAlpha: 0 }); } });
		tl.to(path, { strokeDashoffset: 0, duration: C.durationIn, ease: 'power1.inOut' }, 0)
		  .to(path, { strokeWidth: C.strokeWidthMax, duration: C.durationIn, ease: 'power2.inOut' }, 0)
		  .call(() => { window.__lenis ? window.__lenis.scrollTo(0, { immediate: true }) : window.scrollTo(0, 0); }, null, C.durationIn)
		  .to(path, { strokeDashoffset: -l, duration: C.durationOut, ease: 'power2.inOut' }, C.durationIn)
		  .to(path, { strokeWidth: C.strokeWidthStart, duration: C.durationOut, ease: 'power2.inOut' }, C.durationIn)
		  .set(tLogo, { autoAlpha: 0 }, 0)
		  .to(tLogo, { autoAlpha: 1, duration: C.durationIn * 0.5, ease: 'power2.out',
			onStart: () => gsap.to(tSvg, { rotation: 5, duration: 0.15, repeat: -1, yoyo: true, ease: 'steps(1)', overwrite: 'auto' }) }, C.durationIn * 0.5)
		  .set(tLogo, { autoAlpha: 0, onComplete: () => { gsap.killTweensOf(tSvg); gsap.set(tSvg, { rotation: 0 }); } }, C.durationIn + C.durationOut * 0.48);
	};
	logo.addEventListener('click', run);
	if (CONFIG.introScribbleOnLoad && !reduceMotion) setTimeout(() => run(null), 100);
}

/* ─── boot ───────────────────────────────────────────────────────────────── */
function boot() {
	[initSmoothScroll, initNavbar, initCursorBubble, initHero, initHorizontalWords,
	 initMotionCards, initExperience, initAnchors, initServiceCards, initMarquee, initFooter, initScribble].forEach((fn) => {
		try { fn(); } catch (err) { console.error(`[site] ${fn.name} failed:`, err); }
	});
	window.addEventListener('load', () => ScrollTrigger.refresh());
	if (document.fonts) document.fonts.ready.then(() => ScrollTrigger.refresh());
}
document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', boot) : boot();

window.SITE_CONFIG = CONFIG;
})();
