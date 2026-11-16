"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  /* ---------- 13. Footer year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 4. Light / dark theme toggle ---------- */
  const root = document.documentElement;
  const themeBtn = $("#themeBtn");
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");

  const readSaved = () => { try { return localStorage.getItem("theme"); } catch { return null; } };
  const save = (v) => { try { localStorage.setItem("theme", v); } catch { /* storage unavailable */ } };

  const applyTheme = (theme) => {
    root.setAttribute("data-theme", theme);
    themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
    themeBtn.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} theme`);
  };

  applyTheme(readSaved() || (systemDark.matches ? "dark" : "light"));
  themeBtn.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    save(next);
  });

  /* ---------- 3. Mobile menu ---------- */
  const menuBtn = $("#menuBtn");
  const nav = $("#mainNav");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
  };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- 1, 2, 12. Scroll-spy, progress bar, back-to-top ---------- */
  const links = $$("[data-spy]");
  const sections = links.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  const progress = $("#progress");
  const toTop = $("#toTop");

  const onScroll = () => {
    const doc = document.documentElement;
    const scrollable = doc.scrollHeight - doc.clientHeight;
    progress.style.width = scrollable > 0 ? `${(window.scrollY / scrollable) * 100}%` : "0";

    toTop.hidden = window.scrollY < 600;

    const marker = window.scrollY + 120;
    let current = sections[0];
    sections.forEach((s) => { if (s.offsetTop <= marker) current = s; });
    if (window.innerHeight + window.scrollY >= doc.scrollHeight - 4) current = sections[sections.length - 1];
    links.forEach((a) => {
      const active = a.getAttribute("href") === `#${current.id}`;
      a.classList.toggle("is-active", active);
      if (active) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  toTop.addEventListener("click", () => window.scrollTo({ top: 0 }));

  /* ---------- 5. About "Show more / Show less" ---------- */
  const aboutText = $("#aboutText");
  const aboutToggle = $("#aboutToggle");
  aboutToggle.addEventListener("click", () => {
    const open = aboutText.classList.toggle("is-open");
    aboutToggle.textContent = open ? "Show less" : "Show more";
    aboutToggle.setAttribute("aria-expanded", String(open));
  });

  /* ---------- 6. Experience "Show details / Hide details" ---------- */
  $$("[data-toggle-details]").forEach((btn) => {
    const list = btn.previousElementSibling;
    btn.addEventListener("click", () => {
      const open = list.hidden;
      list.hidden = !open;
      btn.textContent = open ? "Hide details" : "Show details";
      btn.setAttribute("aria-expanded", String(open));
    });
  });

  /* ---------- 7. Skill bars fill when scrolled into view ---------- */
  const bars = $$(".bar span[data-level]");
  const fillBars = () => bars.forEach((b) => { b.style.width = `${b.dataset.level}%`; });
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { fillBars(); obs.disconnect(); }
      });
    }, { threshold: 0.3 });
    io.observe($("#skills"));
  } else {
    fillBars();
  }

  /* ---------- 8. Project filter ---------- */
  const chips = $$(".chip[data-filter]");
  const projects = $$(".project");
  const noProjects = $("#noProjects");
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      const filter = chip.dataset.filter;
      chips.forEach((c) => {
        const on = c === chip;
        c.classList.toggle("is-active", on);
        c.setAttribute("aria-pressed", String(on));
      });
      let shown = 0;
      projects.forEach((p) => {
        const match = filter === "all" || p.dataset.category === filter;
        p.hidden = !match;
        if (match) shown++;
      });
      noProjects.hidden = shown > 0;
    });
  });

  /* ---------- 11. Copy email ---------- */
  const copyBtn = $("#copyEmail");
  const copyToast = $("#copyToast");
  let toastTimer;
  const showCopyToast = (msg) => {
    copyToast.textContent = msg;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { copyToast.textContent = ""; }, 2500);
  };
  copyBtn.addEventListener("click", async () => {
    const email = copyBtn.dataset.email;
    try {
      await navigator.clipboard.writeText(email);
      showCopyToast("Email copied to clipboard.");
    } catch {
      showCopyToast(`Copy failed. My email is ${email}`);
    }
  });

  /* ---------- 9, 10. Contact form: counter + validation ---------- */
  const form = $("#contactForm");
  const nameEl = $("#cName");
  const emailEl = $("#cEmail");
  const msgEl = $("#cMsg");
  const count = $("#cCount");
  const status = $("#formStatus");
  const MAX = 500;

  msgEl.setAttribute("maxlength", MAX);
  msgEl.addEventListener("input", () => { count.textContent = msgEl.value.length; });

  const setError = (input, errId, message) => {
    $(errId).textContent = message;
    input.classList.toggle("is-invalid", Boolean(message));
    if (message) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    return !message;
  };

  const validators = {
    name: () => setError(nameEl, "#cNameErr",
      nameEl.value.trim().length < 2 ? "Enter your name (at least 2 characters)." : ""),
    email: () => setError(emailEl, "#cEmailErr",
      /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailEl.value.trim()) ? "" : "Enter a valid email, like name@example.com."),
    message: () => setError(msgEl, "#cMsgErr",
      msgEl.value.trim().length < 10 ? "Write a message of at least 10 characters." : ""),
  };

  // Re-check a field as the person fixes it, once it has shown an error
  [[nameEl, "name"], [emailEl, "email"], [msgEl, "message"]].forEach(([el, key]) => {
    el.addEventListener("blur", validators[key]);
    el.addEventListener("input", () => { if (el.classList.contains("is-invalid")) validators[key](); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";
    const results = [validators.name(), validators.email(), validators.message()];
    if (results.includes(false)) {
      const firstBad = [nameEl, emailEl, msgEl].find((el) => el.classList.contains("is-invalid"));
      firstBad.focus();
      return;
    }

    // No backend is connected yet. Opening the visitor's mail app is the simplest
    // way to deliver the message. Replace this with fetch() to a form service if preferred.
    const to = copyBtn.dataset.email;
    const subject = encodeURIComponent(`Portfolio message from ${nameEl.value.trim()}`);
    const body = encodeURIComponent(`${msgEl.value.trim()}\n\nFrom: ${nameEl.value.trim()} (${emailEl.value.trim()})`);
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;

    status.textContent = "Thanks! Your email app should open with the message ready to send.";
    form.reset();
    count.textContent = "0";
  });
});
