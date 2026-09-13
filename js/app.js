(function () {
  const cfg = window.KARTONA_CONFIG || {};
  const params = new URLSearchParams(window.location.search);

  function utmPayload() {
    const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'utm_adset', 'utm_ad', 'fbclid'];
    const out = {};
    keys.forEach((k) => { if (params.get(k)) out[k] = params.get(k); });
    out.landing_page = window.location.pathname;
    return out;
  }

  function initPixel() {
    const id = (cfg.META_PIXEL_ID || '').trim();
    if (!id) return;
    !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
    n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
    (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', id);
    window.fbq('track', 'PageView', utmPayload());
  }

  function track(eventName, payload, standard) {
    const data = Object.assign({}, utmPayload(), payload || {});
    if (window.fbq) window.fbq(standard ? 'track' : 'trackCustom', eventName, data);
  }

  function buildWaUrl(kind) {
    const num = (cfg.WA_NUMBER || '').replace(/\D/g, '');
    const payload = utmPayload();
    const label = kind === 'custom' ? 'custom packaging' : 'packaging untuk bisnis makanan';
    const baseMessage = kind === 'custom'
      ? 'Halo Kartona, saya mau konsultasi custom packaging.\n\nProduk saya: \nKebutuhan saya: \n\nBoleh dibantu cek opsi packaging yang tersedia?'
      : 'Halo Kartona, saya mau tanya packaging untuk bisnis makanan. Boleh dibantu rekomendasikan yang cocok?';
    const attrib = Object.keys(payload).length
      ? '\n\nSumber: ' + Object.entries(payload).map(([k, v]) => `${k}=${v}`).join(' | ')
      : '';
    if (!num) return '#wa-belum-diisi';
    return `https://wa.me/${num}?text=${encodeURIComponent(baseMessage + attrib)}`;
  }

  function wireButtons() {
    document.querySelectorAll('[data-wa]').forEach((btn) => {
      const kind = btn.getAttribute('data-wa');
      btn.setAttribute('href', buildWaUrl(kind));
      btn.addEventListener('click', (e) => {
        if (!(cfg.WA_NUMBER || '').trim()) {
          e.preventDefault();
          alert('Nomor WhatsApp Kartona belum diisi di js/config.js.');
          return;
        }
        track('WhatsAppClick', { funnel: kind, cta_text: btn.textContent.trim() });
      });
    });
  }

  function observeContent() {
    const target = document.querySelector('[data-viewcontent]');
    if (!target || !('IntersectionObserver' in window)) return;
    let fired = false;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!fired && entry.isIntersecting) {
          fired = true;
          track('ViewContent', { section: target.getAttribute('data-viewcontent') || 'products' }, true);
          io.disconnect();
        }
      });
    }, { threshold: 0.35 });
    io.observe(target);
  }

  function stickyCta() {
    const sticky = document.querySelector('.sticky-cta');
    const hero = document.querySelector('.hero');
    const final = document.querySelector('.final-cta');
    if (!sticky || !hero || !('IntersectionObserver' in window)) return;
    let heroGone = false;
    let finalVisible = false;
    const update = () => sticky.classList.toggle('show', heroGone && !finalVisible);
    new IntersectionObserver(([entry]) => { heroGone = !entry.isIntersecting; update(); }, { threshold: 0.05 }).observe(hero);
    if (final) new IntersectionObserver(([entry]) => { finalVisible = entry.isIntersecting; update(); }, { threshold: 0.2 }).observe(final);
  }

  initPixel();
  wireButtons();
  observeContent();
  stickyCta();
})();
