/**
 * VR Clean — CONFIGURATION ONLY. Edit confirmed details here after company approval.
 * Observed prices are catalogue offers, NOT confirmed rates per square metre/item.
 * No outgoing lead collection, CRM, API, cookies or analytics in this demo.
 */
window.VR_CLEAN_CONFIG = Object.freeze({
  name: 'VR Clean',
  city: 'Казань',
  phone: '+7 (953) 480-26-21',
  address: 'Казань, ул. Бондаренко, 26',
  mapUrl: 'https://yandex.com/maps/org/vr_clean/180965201312/',
  demoMode: true,
  enableRealLeads: false,
  serviceOffers: {
    apartment: { title:'Уборка квартир', label:'Уборка помещений', price:'2 500 ₽' },
    house: { title:'Уборка домов', label:'Уборка помещений', price:null },
    deep: { title:'Генеральная уборка', label:'Уборка помещений', price:null },
    renovation: { title:'Уборка после ремонта', label:'Уборка помещений', price:null },
    sofa: { title:'Химчистка мебели', label:'Химчистка мягкой мебели', price:'1 500 ₽' },
    windows: { title:'Мойка окон', label:'Мойка окон', price:'500 ₽' }
  }
});
