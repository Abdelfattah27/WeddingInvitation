/* Abdelfattah ❤ Hoda — invitation interactions */
(() => {
  "use strict";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const html = document.documentElement;
  const cfg = JSON.parse($("#wedding-config").textContent);
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lang = () => (html.lang === "en" ? "en" : "ar");
  const locale = () => (lang() === "ar" ? "ar-EG" : "en-GB");

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode */ } },
  };

  const STRINGS = {
    ar: {
      fillBoth: "من فضلك اكتب اسمك ورسالتك 🙏",
      fillName: "اكتب اسمك الأول 🙏",
      slowDown: "على مهلك شوية 😄 جرّب كمان دقيقة",
      network: "في مشكلة في الاتصال… جرّب تاني",
      closed: "الاستقبال اتقفل، شكرًا لمحبتك ❤️",
      pending: "شكرًا! رسالتك هتظهر قريب ❤️",
      sent: "وصلت! شكرًا على كلامك الحلو ❤️",
      right: "صح! 🎉",
      wrong: "لأ 😅",
      seeScore: "شوف النتيجة ✨",
      next: "اللي بعده ←",
      scratchHere: "✨ امسح هنا ✨",
      audioError: "مش قادرين نشغّل الأغنية دلوقتي 🎵",
      calendarTitle: "فرح عبدالفتاح وهدى 💍",
      score: [
        [1, "إنت تعرفنا أكتر من نفسنا! 🏆"],
        [0.6, "برافو! إنت أكيد من العيلة ❤️"],
        [0.2, "مش بطال… تعالى الفرح وتعرفنا أكتر 😄"],
        [0, "إنت لسه عارفنا النهارده؟ 😂"],
      ],
    },
    en: {
      fillBoth: "Please add your name and a message 🙏",
      fillName: "Please type your name first 🙏",
      slowDown: "Easy there 😄 try again in a minute",
      network: "Connection hiccup — please try again",
      closed: "This is closed now — thank you for the love ❤️",
      pending: "Thank you! Your message will appear soon ❤️",
      sent: "Received! Thank you for the kind words ❤️",
      right: "Correct! 🎉",
      wrong: "Nope 😅",
      seeScore: "See my score ✨",
      next: "Next →",
      scratchHere: "✨ Scratch here ✨",
      audioError: "Couldn't play the song right now 🎵",
      calendarTitle: "Abdelfattah & Hoda's Wedding 💍",
      score: [
        [1, "You know us better than we know ourselves! 🏆"],
        [0.6, "Impressive! You're definitely family ❤️"],
        [0.2, "Not bad — come to the wedding and get to know us more 😄"],
        [0, "Did we just meet? 😂"],
      ],
    },
  };
  const t = (key) => STRINGS[lang()][key];
  const langListeners = [];

  /* ── Easter egg #2: console ─────────────────────────────────────────── */
  console.log(
    "%cHey Developer 👀\n\n%cCongratulations Abdelfattah & Hoda ❤️\n\n%c17.10.2026",
    "font: 600 18px/1.6 Georgia, serif; color: #b8955a;",
    "font: 15px/1.6 Georgia, serif; color: #8a7560;",
    "font: 13px/1.6 monospace; color: #b8955a; letter-spacing: 3px;"
  );

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 3200);
  }

  function burst(x, y, chars = ["❤️", "✨", "🤍", "💛"], count = 18) {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "particle";
      p.textContent = chars[i % chars.length];
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
      const dist = 70 + Math.random() * 110;
      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--x", Math.cos(angle) * dist + "px");
      p.style.setProperty("--y", Math.sin(angle) * dist - 40 + "px");
      p.style.setProperty("--r", (Math.random() * 120 - 60) + "deg");
      p.style.setProperty("--s", 12 + Math.random() * 12 + "px");
      p.style.setProperty("--t", 1.1 + Math.random() * 0.8 + "s");
      document.body.appendChild(p);
      p.addEventListener("animationend", () => p.remove());
    }
  }
  const centerOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  function csrfToken() {
    const m = document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : "";
  }
  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken() },
      body: JSON.stringify(data),
      credentials: "same-origin",
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, ...body };
  }
  function errorText(r) {
    if (r.error === "missing") return null;
    if (r.error === "slow_down") return t("slowDown");
    if (r.error === "closed") return t("closed");
    return t("network");
  }

  /* ── Language ───────────────────────────────────────────────────────── */
  function applyPlaceholders() {
    $$("[data-ph-ar]").forEach((el) => { el.placeholder = el.dataset["ph" + (lang() === "ar" ? "Ar" : "En")]; });
  }
  function setLang(l) {
    html.lang = l;
    html.dir = l === "ar" ? "rtl" : "ltr";
    store.set("wedding-lang", l);
    applyPlaceholders();
    langListeners.forEach((fn) => fn(l));
  }
  $("#lang-toggle").addEventListener("click", () => {
    const next = lang() === "ar" ? "en" : "ar";
    const targets = [$("#site"), $(".intro-content")].filter((el) => el && el.offsetParent !== null);
    if (reducedMotion || !targets.length || !targets[0].animate) return setLang(next);
    const opts = { duration: 220, easing: "ease-out", fill: "forwards" };
    Promise.all(targets.map((el) => el.animate([{ opacity: 1 }, { opacity: 0, filter: "blur(4px)" }], opts).finished))
      .then(() => {
        setLang(next);
        targets.forEach((el) => el.animate([{ opacity: 0, filter: "blur(4px)" }, { opacity: 1, filter: "blur(0)" }], { ...opts, duration: 380 })
          .finished.then((a) => a && el.getAnimations().forEach((x) => x.cancel())));
      });
  });

  /* ── Theme ──────────────────────────────────────────────────────────── */
  const themeMeta = $("#meta-theme");
  function setTheme(theme) {
    html.dataset.theme = theme;
    store.set("wedding-theme", theme);
    themeMeta.content = theme === "night" ? "#16100c" : "#fbf7f0";
  }
  setTheme(html.dataset.theme);
  $("#theme-toggle").addEventListener("click", (e) => {
    const next = html.dataset.theme === "night" ? "day" : "night";
    if (document.startViewTransition && !reducedMotion) {
      const [x, y] = centerOf(e.currentTarget);
      const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      document.startViewTransition(() => setTheme(next)).ready.then(() => {
        html.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
          { duration: 900, easing: "cubic-bezier(.22,1,.36,1)", pseudoElement: "::view-transition-new(root)" }
        );
      });
    } else {
      html.classList.add("theme-anim");
      setTheme(next);
      setTimeout(() => html.classList.remove("theme-anim"), 800);
    }
  });

  /* ── Opening ────────────────────────────────────────────────────────── */
  const intro = $("#intro");
  $("#open-btn").addEventListener("click", (e) => {
    const [x, y] = centerOf(e.currentTarget);
    burst(x, y, ["✨", "✦", "🤍", "💛"], 22);
    window.scrollTo(0, 0);
    intro.classList.add("opening");
    document.body.classList.add("opened");
    setTimeout(() => {
      intro.hidden = true;
      document.body.classList.remove("is-locked");
    }, reducedMotion ? 50 : 1900);
  });

  /* ── Reveal on scroll & progress bar ────────────────────────────────── */
  $$(".stagger").forEach((list) => [...list.children].forEach((c, i) => c.style.setProperty("--i", i)));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach((el) => io.observe(el));

  const bar = $(".scroll-progress span");
  let ticking = false;
  addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
      ticking = false;
    });
  }, { passive: true });

  /* ── Dates ──────────────────────────────────────────────────────────── */
  const weddingDate = new Date(cfg.weddingDate);
  function formatDates() {
    const tz = "Africa/Cairo";
    $$('[data-fmt="date"]').forEach((el) => {
      el.textContent = new Intl.DateTimeFormat(locale(), { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: tz }).format(weddingDate);
    });
    $$('[data-fmt="time"]').forEach((el) => {
      el.textContent = new Intl.DateTimeFormat(lang() === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: tz }).format(weddingDate);
    });
    $$("[data-time]").forEach((el) => {
      const [h, m] = el.dataset.time.split(":").map(Number);
      const d = new Date(Date.UTC(2026, 0, 1, h, m));
      el.textContent = new Intl.DateTimeFormat(lang() === "ar" ? "ar-EG" : "en-US", { hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(d);
    });
  }
  langListeners.push(formatDates);

  /* ── Countdown ──────────────────────────────────────────────────────── */
  const cdCells = Object.fromEntries($$(".cd-num").map((el) => [el.dataset.unit, el]));
  let cdTimer, celebrated = false;
  function renderCountdown(force) {
    const diff = weddingDate - Date.now();
    if (diff <= 0) {
      clearInterval(cdTimer);
      $("#countdown-grid").hidden = true;
      $("#today-msg").hidden = false;
      if (!celebrated && document.body.classList.contains("opened")) {
        celebrated = true;
        const [x, y] = centerOf($("#today-msg"));
        burst(x, y, ["❤️", "💍", "✨", "🎉"], 26);
      }
      return;
    }
    const s = Math.floor(diff / 1000);
    const values = { days: Math.floor(s / 86400), hours: Math.floor(s / 3600) % 24, minutes: Math.floor(s / 60) % 60, seconds: s % 60 };
    const nf = new Intl.NumberFormat(lang() === "ar" ? "ar-EG" : "en", { minimumIntegerDigits: 2, useGrouping: false });
    for (const [unit, el] of Object.entries(cdCells)) {
      const text = nf.format(values[unit]);
      if (el.textContent !== text) {
        el.textContent = text;
        if (!force && !reducedMotion) { el.classList.remove("tick"); void el.offsetWidth; el.classList.add("tick"); }
      }
    }
  }
  langListeners.push(() => renderCountdown(true));

  /* ── Add to calendar (.ics) ─────────────────────────────────────────── */
  // const icsDate = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  // $("#add-calendar").addEventListener("click", () => {
  //   const end = new Date(weddingDate.getTime() + 5 * 3600 * 1000);
  //   const venue = document.querySelector(".venue [data-l='" + lang() + "']").textContent;
  //   const ics = [
  //     "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AH Wedding//EN", "BEGIN:VEVENT",
  //     "UID:ah-wedding-20261017@invite", "DTSTAMP:" + icsDate(new Date()),
  //     "DTSTART:" + icsDate(weddingDate), "DTEND:" + icsDate(end),
  //     "SUMMARY:" + t("calendarTitle"), "LOCATION:" + venue,
  //     "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:" + t("calendarTitle"), "END:VALARM",
  //     "END:VEVENT", "END:VCALENDAR",
  //   ].join("\r\n");
  //   const a = document.createElement("a");
  //   a.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  //   a.download = "abdelfattah-hoda-wedding.ics";
  //   document.body.appendChild(a);
  //   a.click();
  //   setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  // });

  /* ── QR lightbox ────────────────────────────────────────────────────── */
  const lightbox = $("#lightbox");
  const qr = $("#qr-zoom");
  if (qr) {
    qr.addEventListener("click", () => {
      const inner = $(".lightbox-inner", lightbox);
      inner.replaceChildren(qr.querySelector("img").cloneNode());
      lightbox.hidden = false;
    });
  }
  lightbox.addEventListener("click", () => { lightbox.hidden = true; });

  /* ── Music ──────────────────────────────────────────────────────────── */
  const audio = $("#song");
  if (audio) {
    const btn = $("#music-btn"), mini = $("#mini-player"), vinyl = $("#vinyl");
    const toggle = () => {
      if (audio.paused) {
        audio.play().catch(() => toast(t("audioError")));
      } else {
        audio.pause();
      }
    };
    const sync = () => {
      const playing = !audio.paused;
      btn.classList.toggle("playing", playing);
      btn.setAttribute("aria-pressed", String(playing));
      vinyl.classList.toggle("playing", playing);
      mini.classList.toggle("paused", !playing);
      if (playing) mini.hidden = false;
    };
    btn.addEventListener("click", toggle);
    mini.addEventListener("click", toggle);
    audio.addEventListener("play", sync);
    audio.addEventListener("pause", sync);
    audio.addEventListener("error", () => toast(t("audioError")));
  }

  /* ── Guestbook ──────────────────────────────────────────────────────── */
  const gbList = $("#gb-list");
  const gbMore = $("#gb-more");
  const PAGE = 6;
  function paginateWishes() {
    const cards = $$(".wish", gbList);
    cards.forEach((c, i) => c.classList.toggle("is-extra", i >= PAGE && !c.dataset.shown));
    gbMore.hidden = !cards.some((c) => c.classList.contains("is-extra"));
    $("#gb-empty").hidden = cards.length > 0;
  }
  gbMore.addEventListener("click", () => {
    $$(".wish.is-extra", gbList).slice(0, PAGE).forEach((c) => {
      c.dataset.shown = "1";
      c.classList.remove("is-extra");
      c.classList.add("new");
    });
    gbMore.hidden = !$(".wish.is-extra", gbList);
  });
  function wishCard(entry, isNew) {
    const card = document.createElement("article");
    card.className = "card wish" + (isNew ? " new" : "");
    card.dataset.id = entry.id;
    card.dataset.shown = "1";
    const h = document.createElement("h4");
    h.dir = "auto";
    h.textContent = "❤️ " + entry.name;
    const p = document.createElement("p");
    p.dir = "auto";
    p.style.whiteSpace = "pre-line";
    p.textContent = entry.message;
    card.append(h, p);
    return card;
  }
  paginateWishes();

  const gbForm = $("#gb-form");
  if (gbForm) {
    const note = $("#gb-note");
    const count = $("#gb-count");
    gbForm.message.addEventListener("input", () => { count.textContent = gbForm.message.value.length; });
    gbForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = gbForm.name.value.trim();
      const message = gbForm.message.value.trim();
      note.classList.remove("error");
      if (!name || !message) {
        note.textContent = t("fillBoth");
        note.classList.add("error");
        (name ? gbForm.message : gbForm.name).focus();
        return;
      }
      const submit = gbForm.querySelector("button[type=submit]");
      submit.disabled = true;
      try {
        const r = await postJSON("/api/guestbook/new/", { name, message, website: gbForm.website.value });
        if (!r.ok) throw r;
        gbForm.reset();
        count.textContent = "0";
        if (r.pending) {
          note.textContent = t("pending");
        } else {
          note.textContent = t("sent");
          if (r.entry && !gbList.querySelector(`[data-id="${r.entry.id}"]`)) {
            gbList.prepend(wishCard(r.entry, true));
            paginateWishes();
          }
        }
        const [x, y] = centerOf(submit);
        burst(x, y);
      } catch (err) {
        note.textContent = errorText(err || {}) || t("fillBoth");
        note.classList.add("error");
      } finally {
        submit.disabled = false;
      }
    });
  }

  // Quietly pull in new wishes from other guests while the page is open.
  async function pollWishes() {
    if (document.hidden) return;
    const ids = $$(".wish", gbList).map((c) => Number(c.dataset.id) || 0);
    const after = ids.length ? Math.max(...ids) : 0;
    try {
      const res = await fetch(`/api/guestbook/?after=${after}`);
      const { entries = [] } = await res.json();
      entries.reverse().forEach((entry) => {
        if (!gbList.querySelector(`[data-id="${entry.id}"]`)) gbList.prepend(wishCard(entry, true));
      });
      if (entries.length) paginateWishes();
    } catch (e) { /* offline — try again later */ }
  }
  setInterval(pollWishes, 45000);

  /* ── RSVP ───────────────────────────────────────────────────────────── */
  const rsvpCard = $("#rsvp-card");
  if (rsvpCard) {
    const form = $("#rsvp-form");
    const note = $("#rsvp-note");
    const go = (step) => { rsvpCard.dataset.step = step; };
    const showYes = (name) => {
      $(".rsvp-name", rsvpCard).textContent = name;
      go("yes");
    };
    const saved = store.get("wedding-rsvp");
    if (saved) showYes(saved);

    rsvpCard.addEventListener("click", (e) => {
      const action = e.target.closest("[data-rsvp]")?.dataset.rsvp;
      if (!action) return;
      if (action === "yes") { go("name"); setTimeout(() => form.name.focus({ preventScroll: true }), 350); }
      if (action === "no") {
        go("no");
        const [x, y] = centerOf(rsvpCard);
        burst(x, y, ["🤍", "✨"], 10);
      }
      if (action === "back") go("ask");
      if (action === "reset") { form.reset(); note.textContent = ""; go("name"); }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim();
      note.classList.remove("error");
      if (!name) {
        note.textContent = t("fillName");
        note.classList.add("error");
        form.name.focus();
        return;
      }
      const submit = form.querySelector("button[type=submit]");
      submit.disabled = true;
      try {
        const r = await postJSON("/api/rsvp/", { name, website: form.website.value });
        if (!r.ok) throw r;
        store.set("wedding-rsvp", name);
        note.textContent = "";
        showYes(name);
        requestAnimationFrame(() => {
          const [x, y] = centerOf(rsvpCard);
          burst(x, y, ["❤️", "💖", "✨", "🥳", "💍"], 28);
        });
      } catch (err) {
        note.textContent = errorText(err || {}) || t("fillName");
        note.classList.add("error");
      } finally {
        submit.disabled = false;
      }
    });
  }

  /* ── Mini game ──────────────────────────────────────────────────────── */
  const quiz = cfg.quiz || [];
  const game = $("#game-card");
  if (!quiz.length) {
    $("#game").hidden = true;
  } else {
    const views = Object.fromEntries($$("[data-g]", game).map((el) => [el.dataset.g, el]));
    const qEl = $("#g-question"), revealEl = $("#g-reveal"), nextBtn = $("#g-next"), progress = $("#g-progress");
    const opts = $$(".g-opt", game);
    const state = { i: 0, score: 0, answered: null, finished: false };

    const show = (name) => Object.entries(views).forEach(([k, el]) => { el.hidden = k !== name; });
    const current = () => quiz[state.i];

    function renderText() {
      if (state.finished) return renderScoreText();
      const q = current();
      qEl.textContent = q["q_" + lang()];
      if (state.answered !== null) {
        const extra = q["reveal_" + lang()];
        revealEl.textContent = (state.answered ? t("right") : t("wrong")) + (extra ? " " + extra : "");
      }
      nextBtn.querySelector(`[data-l="${lang()}"]`).textContent = state.i === quiz.length - 1 ? t("seeScore") : t("next");
    }
    function renderQuestion() {
      state.answered = null;
      progress.replaceChildren(...quiz.map((_, i) => {
        const dot = document.createElement("i");
        if (i < state.i) dot.className = "done";
        if (i === state.i) dot.className = "now";
        return dot;
      }));
      opts.forEach((o) => { o.disabled = false; o.classList.remove("correct", "wrong"); });
      revealEl.textContent = "";
      nextBtn.hidden = true;
      qEl.classList.remove("swap"); void qEl.offsetWidth; qEl.classList.add("swap");
      renderText();
    }
    function pick(choice, btn) {
      if (state.answered !== null) return;
      const correct = choice === current().answer;
      state.answered = correct;
      if (correct) state.score++;
      opts.forEach((o) => {
        o.disabled = true;
        if (o.dataset.pick === current().answer) o.classList.add("correct");
      });
      if (!correct) btn.classList.add("wrong");
      else { const [x, y] = centerOf(btn); burst(x, y, ["❤️", "✨"], 10); }
      renderText();
      nextBtn.hidden = false;
    }
    function renderScoreText() {
      const ratio = state.score / quiz.length;
      const msg = t("score").find(([min]) => ratio >= min);
      $("#score-msg").textContent = msg[1];
    }
    function finish() {
      state.finished = true;
      show("end");
      $("#score-total").textContent = quiz.length;
      const num = $("#score-num");
      const barEl = $("#score-bar");
      barEl.style.strokeDashoffset = 326.7;
      renderScoreText();
      let n = 0;
      num.textContent = "0";
      const step = () => {
        if (n < state.score) { n++; num.textContent = n; setTimeout(step, 260); }
      };
      setTimeout(step, 300);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        barEl.style.strokeDashoffset = 326.7 * (1 - state.score / quiz.length);
      }));
      if (state.score / quiz.length >= 0.6) {
        setTimeout(() => { const [x, y] = centerOf($(".score-ring")); burst(x, y, ["❤️", "🎉", "✨", "🏆"], 30); }, 900);
      }
    }
    function start() {
      Object.assign(state, { i: 0, score: 0, answered: null, finished: false });
      show("play");
      renderQuestion();
    }

    $("#game-start").addEventListener("click", start);
    $("#game-again").addEventListener("click", start);
    opts.forEach((o) => o.addEventListener("click", () => pick(o.dataset.pick, o)));
    nextBtn.addEventListener("click", () => {
      if (state.i < quiz.length - 1) { state.i++; renderQuestion(); } else finish();
    });
    langListeners.push(() => { if (!views.start.hidden) return; renderText(); });
  }

  /* ── Scratch card ───────────────────────────────────────────────────── */
  (function scratchCard() {
    const wrap = $("#scratch");
    const canvas = $("#scratch-canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const prize = cfg.scratch[Math.floor(Math.random() * cfg.scratch.length)];
    const text = $("#scratch-text");
    let drawing = false, last = null, touched = false, done = false, moves = 0, width = 0;

    const setText = () => { text.textContent = prize[lang()]; };
    setText();

    function paint() {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height;
      ctx.globalCompositeOperation = "source-over";

      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, "#c9a86a");
      g.addColorStop(0.3, "#ecd9ad");
      g.addColorStop(0.5, "#b8955a");
      g.addColorStop(0.72, "#e6cf9c");
      g.addColorStop(1, "#a9844a");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // foil speckle
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`;
        ctx.fillRect(Math.random() * w, Math.random() * h, 1.4, 1.4);
      }
      // diamond lattice
      ctx.strokeStyle = "rgba(255,255,255,.18)";
      ctx.lineWidth = 1;
      for (let x = -h; x < w + h; x += 22) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + h, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(x + h, 0); ctx.lineTo(x, h); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,.6)";
      ctx.strokeRect(10.5, 10.5, w - 21, h - 21);

      ctx.fillStyle = "rgba(59,42,32,.82)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = lang() === "ar" ? `700 ${Math.round(w / 14)}px Amiri, serif` : `600 ${Math.round(w / 13)}px "Cormorant Garamond", serif`;
      ctx.direction = lang() === "ar" ? "rtl" : "ltr";
      ctx.fillText(t("scratchHere"), w / 2, h / 2);
    }

    function point(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    function scratchTo(p) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineCap = ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(34, width / 9);
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x + 0.01, p.y);
      ctx.stroke();
      last = p;
    }
    function clearedRatio() {
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      let clear = 0, total = 0;
      for (let i = 3; i < data.length; i += 4 * 24) { total++; if (data[i] === 0) clear++; }
      return clear / total;
    }
    function check() {
      if (done || clearedRatio() < 0.5) return;
      done = true;
      wrap.classList.add("done");
      const [x, y] = centerOf(wrap);
      burst(x, y, ["🎉", "✨", "💃", "🕺", "❤️", "📸"], 30);
    }

    canvas.addEventListener("pointerdown", (e) => {
      if (done) return;
      drawing = true; touched = true;
      canvas.setPointerCapture(e.pointerId);
      last = point(e);
      scratchTo(last);
    });
    canvas.addEventListener("pointermove", (e) => {
      if (!drawing) return;
      scratchTo(point(e));
      if (++moves % 8 === 0) check();
    });
    const stop = () => { if (drawing) { drawing = false; check(); } };
    canvas.addEventListener("pointerup", stop);
    canvas.addEventListener("pointercancel", stop);

    // Repaint only when the width really changes (mobile address bars fire resize on scroll).
    new ResizeObserver(() => {
      const w = canvas.getBoundingClientRect().width;
      if (!done && Math.abs(w - width) > 1) { touched = false; paint(); }
    }).observe(canvas);

    langListeners.push(() => { setText(); if (!touched && !done) paint(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!touched) paint(); });
  })();

  /* ── Easter egg #1: tap the groom's name 5× ─────────────────────────── */
  const terminal = $("#terminal");
  const termBody = $("#term-body");
  let taps = 0, tapTimer, runId = 0;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  async function runTerminal() {
    const id = ++runId;
    const alive = () => id === runId && !terminal.hidden;
    terminal.hidden = false;
    termBody.textContent = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    const out = document.createTextNode("");
    termBody.append(out, cursor);
    const write = (s) => { out.textContent += s; };

    const cmd = "> sudo wedding --start";
    for (const ch of cmd) { if (!alive()) return; write(ch); await wait(55); }
    await wait(500); if (!alive()) return;
    write("\n\nInitializing...");
    await wait(900); if (!alive()) return;
    write(`\n\nBride: ${cfg.bride.en} ❤️`); await wait(450); if (!alive()) return;
    write(`\nGroom: ${cfg.groom.en}`); await wait(600); if (!alive()) return;
    write("\n\nWedding Status: READY 💍\n\n"); await wait(500);
    const base = out.textContent;
    for (let i = 0; i <= 12; i++) {
      if (!alive()) return;
      out.textContent = base + "[" + "█".repeat(i) + "░".repeat(12 - i) + "] " + Math.round((i / 12) * 100) + "%";
      await wait(110);
    }
    await wait(500); if (!alive()) return;
    write("\n\nLet's Celebrate! 🎉");
    const [x, y] = centerOf(termBody);
    burst(x, y, ["🎉", "💍", "❤️", "✨"], 24);
  }
  function closeTerminal() { terminal.hidden = true; runId++; }
  $$(".groom-name").forEach((el) => el.addEventListener("click", () => {
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { taps = 0; }, 1500);
    if (++taps >= 5) { taps = 0; runTerminal(); }
  }));
  $(".term-close").addEventListener("click", closeTerminal);
  terminal.addEventListener("click", (e) => { if (e.target === terminal) closeTerminal(); });
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!terminal.hidden) closeTerminal();
    if (!lightbox.hidden) lightbox.hidden = true;
  });

  /* ── Boot ───────────────────────────────────────────────────────────── */
  applyPlaceholders();
  formatDates();
  renderCountdown(true);
  cdTimer = setInterval(() => renderCountdown(false), 1000);
})();
