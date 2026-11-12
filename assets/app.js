/* VR Clean demo. Vanilla JavaScript, no external runtime dependencies.
   Nothing here sends personal data or requests to a company server. */
(() => {
  'use strict';
  const conf = window.VR_CLEAN_CONFIG;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const ICONS = {
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
    x:'<path d="M5 5 19 19M19 5 5 19"/>',
  };
  const svg = (name, size = 16) => `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
  const state = {service:'apartment', object:'Квартира', area:'', extra:new Set(), comment:''};
  const extraNames = {windows:'Мойка окон',upholstery:'Химчистка мебели',kitchen:'Дополнительная уборка кухни',other:'Другие задачи'};
  const formatData = [
    {title:'Поддерживающая', tag:'Для привычного порядка', description:'Вариант для помещений, где важна регулярная чистота без большого объёма сложных загрязнений.', points:['Для повседневного порядка','Удобна при регулярном графике','Объём работ согласовывается'], art:'apartment'},
    {title:'Генеральная',tag:'Для основательного обновления',description:'Когда обычной уборки недостаточно и нужно уделить больше внимания деталям и труднодоступным местам.',points:['Более глубокая проработка','Индивидуальный перечень задач','Предварительное уточнение объёма'],art:'deep'},
    {title:'После ремонта',tag:'Для нового этапа',description:'Для помещений после строительных и отделочных работ, где остаются пыль и специфические загрязнения.',points:['Работы после отделки','Оценка характера загрязнений','Согласование сложных задач'],art:'renovation'},
  ];
  const menuButton = $('#mobile-menu-button');
  const menu = $('#mobile-menu');
  const backdrop = $('#menu-backdrop');
  const setMenu = (isOpen) => {
    menu.classList.toggle('drawer-open', isOpen);
    menu.setAttribute('aria-hidden', String(!isOpen));
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    menuButton.innerHTML = svg(isOpen ? 'x' : 'menu',26);
    backdrop.hidden = !isOpen;
    document.body.classList.toggle('menu-open', isOpen);
    $$('a',menu).forEach(a => a.tabIndex = isOpen ? 0 : -1);
  };
  menuButton.addEventListener('click',() => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  backdrop.addEventListener('click',() => setMenu(false));
  $$('a',menu).forEach(link => link.addEventListener('click',() => setMenu(false)));
  document.addEventListener('keydown', e => {if (e.key === 'Escape') setMenu(false);});
  window.addEventListener('resize',() => { if (innerWidth > 760) setMenu(false); });
  window.addEventListener('scroll',() => $('.site-header').classList.toggle('header-scrolled',scrollY > 15),{passive:true});

  // Disclosure tabs: changing these descriptions changes no company assertions.
  const tabs = $$('[data-format]');
  const panel = $('#format-panel');
  function renderFormat(index) {
    const value = formatData[index];
    tabs.forEach((t,i) => {
      t.classList.toggle('active',i===index);
      t.setAttribute('aria-selected',String(index === i));
      t.tabIndex = index === i ? 0 : -1;
    });
    panel.setAttribute('aria-labelledby',`tab-${index}`);
    panel.innerHTML = `<div class="format-pane-top"><span class="tiny-label">${value.tag}</span><h3>${value.title}</h3><p>${value.description}</p></div><div class="format-lower"><ul>${value.points.map(p=>`<li>${svg('check',18)}${p}</li>`).join('')}</ul><img class="vector-art" src="./assets/svg/${value.art}.svg" loading="eager" alt="" aria-hidden="true"></div>`;
    panel.style.animation = 'none';
    void panel.offsetHeight;
    panel.style.animation = '';
  }
  tabs.forEach((t,i) => {
    t.addEventListener('click',() => renderFormat(i));
    t.addEventListener('keydown',(e) => {
      if (!['ArrowRight','ArrowLeft','Home','End'].includes(e.key)) return;
      e.preventDefault();
      const idx = e.key === 'Home'?0:e.key==='End'?tabs.length-1:e.key==='ArrowRight'?(i+1)%tabs.length:(i-1+tabs.length)%tabs.length;
      renderFormat(idx); tabs[idx].focus();
    });
  });
  renderFormat(0);

  // Configurator: no fake formula, all price labels refer to unconfirmed directory offerings.
  const serviceButtons = $$('[data-service]');
  const objectButtons = $$('#object-picker button');
  const extraButtons = $$('[data-extra]');
  const areaInput = $('#area');
  const areaHint = $('#area-hint');
  const commentInput = $('#comment');
  const priceSummary = $('#price-summary');
  const priceSubtitle = $('#price-subtitle');
  const previewText = $('#preview-text');
  const copyButton = $('#copy-request');
  const previewToggle = $('#preview-toggle');
  const previewLabel = $('#preview-label');
  const copyLabel = $('#copy-label');
  let clearFeedbackTimer;
  const validArea = () => !state.area || (/^\d{1,6}$/.test(state.area) && Number(state.area)>=1 && Number(state.area)<=100000);
  const message = () => {
    const lines = [
      'Здравствуйте! Хотелось бы уточнить стоимость услуги VR Clean.',
      'Услуга: ' + conf.serviceOffers[state.service].title + '.',
      'Объект: ' + state.object.toLowerCase() + '.',
    ];
    if(state.area && validArea())lines.push('Площадь: '+state.area+' м².');
    if(state.extra.size) lines.push('Дополнительно: '+[...state.extra].map(x=>extraNames[x]).join(', ')+'.');
    if(state.comment.trim()) lines.push('Комментарий: '+state.comment.trim().replace(/[.\s]+$/,'')+'.');
    lines.push('Подскажите, пожалуйста, итоговую стоимость и возможные даты.');
    return lines.join('\n');
  };
  function refreshPreview(){
    if (previewText.hidden) return;
    // textContent prevents HTML injection through comment input.
    previewText.textContent = '';
    const p = document.createElement('p'); p.textContent = message();
    const hint = document.createElement('span'); hint.textContent = 'Если копирование недоступно, выделите и скопируйте этот текст вручную.';
    previewText.append(p,hint);
  }
  function refreshSummary(){
    const offer = conf.serviceOffers[state.service];
    priceSummary.textContent = offer.price || 'По запросу';
    priceSubtitle.textContent = offer.price ? `Публиковалось в каталоге: ${offer.label.toLowerCase()}. Не итоговая цена.` : 'Для выбранной услуги нет подтверждённой стоимости.';
    areaInput.setAttribute('aria-invalid',String(!validArea()));
    areaHint.classList.toggle('field-error',!validArea());
    areaHint.classList.toggle('field-help',validArea());
    areaHint.textContent = validArea()?'Площадь уточняет запрос, но не умножает неподтверждённый тариф.':'Укажите площадь от 1 до 100 000 м² или оставьте поле пустым.';
    copyButton.disabled = !validArea();
    refreshPreview();
  }
  function setService(id, scroll = false){
    if(!conf.serviceOffers[id])return;
    state.service = id;
    if(id === 'windows') state.extra.delete('windows');
    if(id === 'sofa') state.extra.delete('upholstery');
    serviceButtons.forEach(btn => {
      const active = btn.dataset.service === id;
      btn.classList.toggle('selected',active);btn.setAttribute('aria-pressed',String(active));
      btn.innerHTML = (active?svg('check',16)+' ':'') + conf.serviceOffers[btn.dataset.service].title;
    });
    extraButtons.forEach(btn => {
      const hide = (id === 'windows' && btn.dataset.extra === 'windows') || (id === 'sofa' && btn.dataset.extra === 'upholstery');
      btn.hidden = hide;
      renderExtra(btn);
    });
    refreshSummary();
    if(scroll)document.getElementById('request').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  serviceButtons.forEach(btn => btn.addEventListener('click',() => setService(btn.dataset.service)));
  $$('[data-select]').forEach(btn => btn.addEventListener('click',() => setService(btn.dataset.select,true)));
  objectButtons.forEach(btn => btn.addEventListener('click',() => {
    state.object = btn.textContent.trim();
    objectButtons.forEach(b=>{const active=b===btn;b.classList.toggle('object-active',active);b.setAttribute('aria-pressed',String(active));});
    refreshPreview();
  }));
  function renderExtra(btn){
    const selected = state.extra.has(btn.dataset.extra);
    btn.classList.toggle('on',selected);btn.setAttribute('aria-pressed',String(selected));
    $('.extra-state',btn).innerHTML = svg(selected?'check':'plus',16);
  }
  extraButtons.forEach(btn => btn.addEventListener('click',() => {
    const id = btn.dataset.extra;
    if(state.extra.has(id))state.extra.delete(id);else state.extra.add(id);
    renderExtra(btn);refreshPreview();
  }));
  areaInput.addEventListener('input',() => {
    // Only digits. Do not silently turn 001 into a different number or allow NaN/Infinity.
    areaInput.value = areaInput.value.replace(/\D/g,'').slice(0,6);
    state.area = areaInput.value;refreshSummary();
  });
  commentInput.addEventListener('input',() => { state.comment=commentInput.value.slice(0,500);refreshPreview(); });
  $('#reset-form').addEventListener('click',() => {
    state.object='Квартира';state.area='';state.comment='';state.extra.clear();
    areaInput.value='';commentInput.value='';
    objectButtons.forEach((b,i)=>{b.classList.toggle('object-active',i===0);b.setAttribute('aria-pressed',String(i===0));});
    setService('apartment');
    previewText.hidden=true;previewToggle.setAttribute('aria-expanded','false');previewLabel.textContent='Посмотреть текст запроса';$('.icon',previewToggle).classList.remove('turn');
    copyLabel.textContent='Скопировать запрос';
  });
  function togglePreview(show) {
    previewText.hidden=!show;
    previewToggle.setAttribute('aria-expanded',String(show));
    previewLabel.textContent=show?'Скрыть текст запроса':'Посмотреть текст запроса';
    $('.icon',previewToggle).classList.toggle('turn',show);
    if(show)refreshPreview();
  }
  previewToggle.addEventListener('click',() => togglePreview(previewText.hidden));
  async function copyToClipboard(content){
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(content);return true;}}catch(_e){}
    // Legacy fallback for local/non-secure previews.
    const tmp = document.createElement('textarea');tmp.value=content;tmp.style.position='fixed';tmp.style.opacity='0';
    document.body.appendChild(tmp);tmp.focus();tmp.select();
    let ok=false;try{ok=document.execCommand('copy')}catch(_e){}tmp.remove();
    return ok;
  }
  copyButton.addEventListener('click',async () => {
    if(!validArea())return;
    const copied=await copyToClipboard(message());
    togglePreview(true);
    clearTimeout(clearFeedbackTimer);
    copyLabel.textContent=copied?'Запрос скопирован':'Выделите текст ниже';
    clearFeedbackTimer=setTimeout(()=>{copyLabel.textContent='Скопировать запрос'},3100);
  });
  refreshSummary();

  const faqItems = $$('.faq-item');
  faqItems.forEach(item => {
    const btn=$('button',item); const symbol=$('.faq-toggle',item);
    btn.addEventListener('click',() => {
      const nowOpen=!item.classList.contains('faq-open');
      faqItems.forEach(other => {
        const yes=other===item && nowOpen;
        other.classList.toggle('faq-open',yes);
        $('button',other).setAttribute('aria-expanded',String(yes));
        $('.faq-toggle',other).innerHTML=svg(yes?'minus':'plus',18);
      });
    });
  });

  $('#copy-phone').addEventListener('click',async e => {
    const btn=e.currentTarget; const done=await copyToClipboard(conf.phone);
    if(!done)return;
    const original=btn.innerHTML;
    btn.innerHTML=svg('check',17)+' Номер скопирован';
    setTimeout(()=>btn.innerHTML=original,2000);
  });

  // Animate only when JS and IntersectionObserver support it.
  if('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches){
    const sections=$$('[data-reveal]');
    const observer=new IntersectionObserver(entries=>{
      for(const entry of entries)if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target)}
    },{threshold:.08,rootMargin:'0px 0px -35px 0px'});
    sections.forEach(el=>{el.classList.add('can-reveal');observer.observe(el)});
  }
})();
