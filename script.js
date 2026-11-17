(() => {
  'use strict';
  const root = document.documentElement;
  const language = root.lang;
  const languageSelect = document.querySelector('#language');
  const languages = [...languageSelect.options].map(option => option.value);

  // Static pages link to index.html so they also work from file://; on a server, use clean folder URLs.
  function pageHref(href) {
    if (location.protocol === 'file:') return href;
    const clean = href.replace(/index\.html(?=$|\?)/, '');
    return !clean || clean.startsWith('?') ? `./${clean}` : clean;
  }
  if (location.protocol !== 'file:') {
    document.querySelectorAll('.language-links a').forEach(link => link.setAttribute('href', pageHref(link.getAttribute('href'))));
  }
  const hrefFor = code => pageHref(languageSelect.querySelector(`option[value="${code}"]`).dataset.href);

  function supportedLanguage(value) {
    if (!value) return null;
    const lower = value.toLowerCase();
    if (lower.startsWith('zh')) return 'zh-Hans';
    // Same rule as the app: Portuguese means Brazilian Portuguese unless another region is named.
    if (lower === 'pt' || lower.startsWith('pt-br')) return 'pt-BR';
    if (lower.startsWith('pt-')) return null;
    const base = lower.split('-')[0];
    const code = base === 'in' ? 'id' : base;
    return languages.includes(code) ? code : null;
  }

  // The root repeats the Russian page for crawlers without JavaScript; visitors go to their language's own page:
  // an explicit ?lang= from old links first, then the browser language, English otherwise.
  if (root.hasAttribute('data-home')) {
    const requested = supportedLanguage(new URLSearchParams(location.search).get('lang'));
    const preferred = requested
      || (navigator.languages || [navigator.language]).map(supportedLanguage).find(Boolean) || 'en';
    location.replace(hrefFor(preferred) + location.hash);
    return;
  }

  const themeButton = document.querySelector('.theme-toggle');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
  function updateTheme() {
    const dark = isDark();
    themeButton.setAttribute('aria-label', dark ? themeButton.dataset.labelLight : themeButton.dataset.labelDark);
    const canvas = getComputedStyle(root).getPropertyValue('--canvas').trim();
    if (canvas) document.querySelector('meta[name="theme-color"]').content = canvas;
  }
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    updateTheme();
  });
  systemDark.addEventListener('change', updateTheme);
  updateTheme();

  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const narrowScreen = window.matchMedia('(max-width: 900px)');
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? menuButton.dataset.labelClose : menuButton.dataset.labelOpen);
    navigation.dataset.collapsed = String(narrowScreen.matches && !open);
  }
  menuButton.hidden = false;
  setMenu(false);
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    setMenu(open);
    if (open) navigation.querySelector('a')?.focus();
  });
  narrowScreen.addEventListener('change', () => {
    const focusInNavigation = navigation.contains(document.activeElement);
    setMenu(false);
    if (narrowScreen.matches && focusInNavigation) menuButton.focus();
  });
  navigation.addEventListener('click', event => {
    const link = event.target.closest('a');
    if (link) {
      setMenu(false);
      if (narrowScreen.matches) document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });

  // Showcase tabs: Split, Combine, CSV to Excel. Arrow keys move between tabs.
  const tabs = [...document.querySelectorAll('[role="tab"][data-tab]')];
  function selectTab(active, focus) {
    for (const tab of tabs) {
      const selected = tab === active;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !selected;
    }
    if (focus) active.focus();
  }
  selectTab(tabs[0], false);
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => selectTab(tab, false));
    tab.addEventListener('keydown', event => {
      const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
    });
  });

  const privacy = document.querySelector('#privacy');
  const openPrivacy = () => { if (location.hash === '#privacy') privacy.open = true; };
  document.querySelectorAll('a[href="#privacy"]').forEach(link => link.addEventListener('click', () => { privacy.open = true; }));
  window.addEventListener('hashchange', openPrivacy);
  openPrivacy();

  // In-page links scroll without leaving #section in the address, so a reload starts at the top.
  // A link from outside (roweave.app/#download) still lands on its section once.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const dropHash = () => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  };
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (link && !event.defaultPrevented) setTimeout(dropHash, 0);
  });
  window.addEventListener('load', () => setTimeout(dropHash, 0));

  languageSelect.closest('.language-control').hidden = false;
  languageSelect.value = language;
  languageSelect.addEventListener('change', () => {
    if (languageSelect.value !== language) location.href = hrefFor(languageSelect.value);
  });
})();
