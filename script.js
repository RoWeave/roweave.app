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

  // The theme follows the system until the button is pressed; the choice is not saved (privacy policy).
  const themeButton = document.querySelector('.theme-toggle');
  const themeText = themeButton.querySelector('[data-theme-text]');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : systemDark.matches);
  function updateTheme() {
    const dark = isDark();
    themeButton.setAttribute('aria-label', dark ? themeButton.dataset.labelLight : themeButton.dataset.labelDark);
    themeText.textContent = dark ? themeButton.dataset.textLight : themeButton.dataset.textDark;
    const canvas = getComputedStyle(root).getPropertyValue('--bg').trim();
    if (canvas) document.querySelector('meta[name="theme-color"]').content = canvas;
  }
  themeButton.hidden = false;
  themeButton.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    updateTheme();
  });
  systemDark.addEventListener('change', updateTheme);
  updateTheme();

  // Below 1080 px (styles.css, compact header) the navigation is a panel opened by the menu button.
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  function setMenu(open) {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? menuButton.dataset.labelClose : menuButton.dataset.labelOpen);
    navigation.classList.toggle('is-open', open);
  }
  menuButton.hidden = false;
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    setMenu(open);
    if (open) navigation.querySelector('a')?.focus();
  });
  navigation.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
  });
  // Crossing the breakpoint closes the panel; focus on a header link that becomes hidden moves to the menu button.
  const compactHeader = window.matchMedia('(max-width: 1080px)');
  compactHeader.addEventListener('change', () => {
    const focusInNavigation = navigation.contains(document.activeElement);
    setMenu(false);
    if (compactHeader.matches && focusInNavigation) menuButton.focus();
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
      const target = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 }[event.key];
      if (target === undefined) return;
      event.preventDefault();
      selectTab(tabs[(target + tabs.length) % tabs.length], true);
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
