(() => {
  'use strict';
  const tabs = [...document.querySelectorAll('[data-country-tab]')];
  if (!tabs.length) return;
  const rows = [...document.querySelectorAll('[data-place-row]')];
  const cities = [...document.querySelectorAll('[data-city]')];
  const query = new URLSearchParams(location.search);
  let country = ['kr','jp'].includes(query.get('country')) ? query.get('country') : 'kr';
  let city = query.get('city') || 'all';
  function render(updateUrl = true) {
    if (city !== 'all' && !rows.some(row => row.dataset.city === city && row.dataset.country === country)) city = 'all';
    tabs.forEach(tab => {const active=tab.dataset.countryTab===country;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
    document.querySelectorAll('[data-country-map]').forEach(map => {map.hidden=map.dataset.countryMap!==country;});
    cities.forEach(button => {button.hidden=Boolean(button.dataset.country && button.dataset.country!==country);button.setAttribute('aria-pressed',String(button.dataset.city===city));});
    let count=0;
    rows.forEach(row => {row.hidden=row.dataset.country!==country || (city!=='all' && row.dataset.city!==city);if(!row.hidden)count++;});
    document.querySelector('[data-result-summary]').textContent=`${country==='kr'?'한국':'일본'}${city==='all'?'':` · ${cities.find(b=>b.dataset.city===city && !b.classList.contains('city-pin'))?.textContent || city}`} · ${count}개 이야기`;
    document.querySelector('[data-places-empty]').hidden=count!==0;
    document.body.dataset.placesCountry=country;
    document.dispatchEvent(new CustomEvent('matgamsa:countrychange',{detail:{country}}));
    if(updateUrl) history.replaceState(null,'',`${location.pathname}?country=${country}${city==='all'?'':`&city=${encodeURIComponent(city)}`}${location.hash}`);
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>{country=tab.dataset.countryTab;city='all';render();});
    tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight'].includes(event.key))return;event.preventDefault();const target=tabs[(index+1)%tabs.length];target.click();target.focus();});
  });
  cities.forEach(button=>button.addEventListener('click',()=>{city=button.dataset.city;render();}));
  render(false);
})();
