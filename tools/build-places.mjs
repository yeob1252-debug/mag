import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await fs.readFile(path.join(root, 'data/places.json'), 'utf8'));
const preview = process.argv.includes('--preview-drafts');
const checkOnly = process.argv.includes('--check');
const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const url = value => {if (!/^https:\/\//.test(value)) throw Error('HTTPS URL required'); return escape(value);};
const heading = value => escape(value).replace(/(\d+천\s?원)/g,'<span class="keep-word">$1</span>');
const safeId = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const exist = async relative => fs.access(path.join(root, relative)).then(() => true, () => false);
const problems = [];
const seen = new Set();
for (const place of data.places) {
  if (!safeId(place.id) || seen.has(place.id)) problems.push(`Invalid/duplicate id: ${place.id}`);
  seen.add(place.id);
  if (!['draft','published'].includes(place.status)) problems.push(`${place.id}: status`);
  if (!data.cities.some(city => city.id === place.city && city.country === place.country)) problems.push(`${place.id}: city binding`);
  for (const field of ['title','region','summary','intro','checkedAt','thumbnailAlt']) if (!place[field]) problems.push(`${place.id}: ${field}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(place.checkedAt)) problems.push(`${place.id}: checkedAt format`);
  if (place.status === 'published' && (!place.thumbnail || !/^assets\/places\/[a-z0-9/_.-]+\.(webp|png|jpe?g)$/.test(place.thumbnail) || !(await exist(place.thumbnail)))) problems.push(`${place.id}: real thumbnail required`);
  for (const target of [place.store?.mapUrl,place.parking?.mapUrl,...place.nearby.map(item => item.mapUrl),...place.sources.map(item => item.url),...(place.snsUrl ? [place.snsUrl] : [])]) url(target);
}
if (problems.length) throw Error(problems.join('\n'));
if (checkOnly) { console.log(JSON.stringify({valid:true,records:data.places.length,published:data.places.filter(p=>p.status==='published').length})); process.exit(0); }

const mapFile = path.join(root,'assets/places/country-outlines.json');
if (process.argv.includes('--refresh-maps')) {
  const source = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
  const response = await fetch(source);
  if (!response.ok) throw Error(`Natural Earth ${response.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  const all = JSON.parse(bytes);
  const features = all.features.filter(f => ['KOR','JPN'].includes(f.properties.ADM0_A3));
  if (features.length !== 2) throw Error('Country geometry binding failed');
  await fs.mkdir(path.dirname(mapFile),{recursive:true});
  await fs.writeFile(mapFile,JSON.stringify({source,sourceSha256:createHash('sha256').update(bytes).digest('hex'),license:'Natural Earth public domain',scale:'1:50m',features:features.map(f=>({id:f.properties.ADM0_A3==='KOR'?'kr':'jp',geometry:f.geometry}))}));
}
const maps = JSON.parse(await fs.readFile(mapFile,'utf8'));
const published = data.places.filter(p=>p.status==='published').sort((a,b)=>a.sort-b.sort || a.id.localeCompare(b.id));
const out = path.join(root,preview ? 'outputs/video-places/draft' : 'places');
await fs.mkdir(out,{recursive:true});
const icon = name => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><use href="/assets/icons/video-controls.svg#${name}"></use></svg>`;
const external = (target,label) => `<a class="place-link" href="${url(target)}" target="_blank" rel="noopener noreferrer">${escape(label)}${icon('arrow')}</a>`;
const course = `<section class="places-course"><div><span>나의 첫 맛집 콘텐츠</span><h2>이런 맛집 콘텐츠,<br>나도 만들어보고 싶다면?</h2><p>휴대폰으로 기획·촬영·편집·첫 업로드까지 직접 해보는 대구 원데이 실습 과정입니다.</p><small>유료 오프라인 교육 · 식사·활동·수익은 조건에 따라 달라지며 보장되지 않습니다.</small></div><a class="place-button" href="/creator-course.html">나도 맛집채널 시작하기${icon('arrow')}</a></section>`;
function page(title,description,canonical,content,image='/assets/og/matgamsa-share-20260906-v4.png',noindex=false) {
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>${escape(title)} | 맛집감별사</title><meta name="description" content="${escape(description)}"><meta name="robots" content="${noindex?'noindex,nofollow':'index,follow,max-image-preview:large'}"><link rel="canonical" href="https://www.matgamsa.com${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="https://www.matgamsa.com${canonical}"><meta property="og:image" content="https://www.matgamsa.com${escape(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="https://www.matgamsa.com${escape(image)}"><link rel="icon" href="/assets/images/favicon.svg"><link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.css"><link rel="stylesheet" href="/css/places.css?v=20260911-v1"><link rel="stylesheet" href="/css/video-places.css?v=20260911-v1"></head><body class="places-page"><a class="places-skip" href="#places-main">본문 바로가기</a><header class="places-header"><a href="/" class="places-brand">맛집감별사</a><nav aria-label="주요 메뉴"><a href="/places/">맛집정보</a><a href="/creator-course.html">맛간다챌린지</a></nav></header><main id="places-main">${content}</main><footer class="places-footer"><a href="/">맛집감별사</a><a href="/privacy.html">개인정보처리방침</a><p>한국·일본의 한 끼를, 나의 콘텐츠로.</p></footer><script src="/js/video-places.js?v=20260911-v1" defer></script><script src="/js/places.js?v=20260911-v1" defer></script></body></html>`;
}
function projection(country) {
  const geometry = maps.features.find(f=>f.id===country).geometry;
  const polys = geometry.type==='Polygon' ? [geometry.coordinates] : geometry.coordinates;
  const points = polys.flat(2);
  const raw = ([lon,lat]) => [lon * Math.cos(36*Math.PI/180), -lat];
  const projected=points.map(raw), xs=projected.map(p=>p[0]),ys=projected.map(p=>p[1]);
  const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const scale=Math.min(320/(maxX-minX),350/(maxY-minY));
  const project = p => {const [x,y]=raw(p);return [40+(320-(maxX-minX)*scale)/2+(x-minX)*scale,25+(350-(maxY-minY)*scale)/2+(y-minY)*scale];};
  return {project,d:polys.map(poly=>poly.map(ring=>'M'+ring.map(p=>project(p).map(n=>n.toFixed(2)).join(',')).join('L')+'Z').join('')).join('')};
}
function map(country) {
  const {project,d}=projection(country.id);
  const cities=data.cities.filter(c=>c.country===country.id && published.some(p=>p.city===c.id));
  return `<div class="country-map" data-country-map="${country.id}" ${country.id==='kr'?'':'hidden'}><svg viewBox="0 0 400 400" aria-label="${country.name} 국가 윤곽" role="img"><path d="${d}" fill-rule="evenodd"/></svg>${cities.map(c=>{const [x,y]=project(c.coordinates);return `<button type="button" class="city-pin" data-city="${c.id}" data-country="${country.id}" style="left:${x/4}%;top:${y/4}%" aria-label="${c.name} ${published.filter(p=>p.city===c.id).length}개 자료 보기"><i></i><span>${c.name} <b>${published.filter(p=>p.city===c.id).length}</b></span></button>`;}).join('')}<span class="map-caption">${country.name} · Natural Earth 1:50m</span></div>`;
}
const row = p => `<article class="place-row" data-place-row data-country="${p.country}" data-city="${p.city}"><a href="/places/${p.id}" class="place-row-image"><img src="/${escape(p.thumbnail)}" alt="${escape(p.thumbnailAlt)}" loading="lazy"></a><div><span class="place-region">${escape(p.region)}</span><h3><a href="/places/${p.id}">${heading(p.title)}</a></h3><p>${escape(p.summary)}</p><a class="place-link" href="/places/${p.id}">위치·주차·주변 먹거리${icon('arrow')}</a></div></article>`;
const list=`<section class="places-hero"><div class="places-hero-media" data-channel-media><img src="/assets/generated/matgamsa-category-korean.webp" alt="한식 메뉴와 함께 시작하는 맛집 이야기" data-video-slot="places-channel"></div><div class="places-hero-copy"><span>한국에서 일본까지, 맛있는 발견</span><h1>맛집감별사의<br>한국·일본 맛집정보</h1><p>영상에서 만난 한 끼.<br>찾아가는 길과 주변 이야기까지.</p><a href="#places-explore" class="place-button">영상 속 맛집 찾아보기${icon('arrow')}</a></div></section><section class="places-explore" id="places-explore"><header><span>어디로 떠나볼까요?</span><h2>지역으로 찾는 맛집 이야기</h2></header><div class="country-tabs" role="tablist" aria-label="국가 선택">${data.countries.map((c,i)=>`<button type="button" id="country-${c.id}" role="tab" data-country-tab="${c.id}" aria-selected="${i===0}" aria-controls="places-country-content">${c.name}</button>`).join('')}</div><div class="places-explore-grid" id="places-country-content"><aside class="map-region" aria-label="등록된 도시 지도">${data.countries.map(map).join('')}<div class="city-list"><button type="button" data-city="all" aria-pressed="true">전체</button>${data.cities.filter(c=>published.some(p=>p.city===c.id)).map(c=>`<button type="button" data-country="${c.country}" data-city="${c.id}" aria-pressed="false">${c.name}</button>`).join('')}</div></aside><div class="places-results"><p class="result-summary" aria-live="polite" data-result-summary>한국 · ${published.filter(p=>p.country==='kr').length}개 이야기</p>${published.map(row).join('')}<div class="places-empty" data-places-empty ${published.some(p=>p.country==='kr')?'hidden':''}><span>아직 등록된 이야기가 없습니다.</span><p>확인한 맛집정보를 차근차근 담겠습니다.</p></div></div></div></section>${course}`;
await fs.writeFile(path.join(out,'index.html'),page('맛집감별사의 한국·일본 맛집정보','영상 속 맛집의 위치, 주차와 주변 먹거리. 한국·일본 맛집정보를 지역별로 만나보세요.','/places/',list,undefined,preview));
function detail(p) {
  const fields = item => `<dl class="place-facts"><div><dt>주소</dt><dd>${escape(item.address)}</dd></div>${item.menu?`<div><dt>메뉴</dt><dd>${escape(item.menu)}</dd></div>`:''}${item.features?`<div><dt>방문 특징</dt><dd>${escape(item.features)}</dd></div>`:''}${item.phone?`<div><dt>전화</dt><dd><a href="tel:${escape(item.phone.replaceAll('-',''))}">${escape(item.phone)}</a></dd></div>`:''}</dl>`;
  const thumbnail=(p.thumbnail?`<img src="/${escape(p.thumbnail)}" alt="${escape(p.thumbnailAlt)}" class="detail-thumbnail">`:'<p class="draft-warning">승인된 SNS 썸네일 확보 전 비공개 초안입니다.</p>')+(p.photos?.length?`<div class="detail-photos">${p.photos.map(photo=>`<figure><img src="/${escape(photo.src)}" alt="${escape(photo.alt)}" loading="lazy"><figcaption>${escape(photo.alt)}</figcaption></figure>`).join('')}</div>`:'');
  return `<article class="place-detail"><a class="detail-back" href="/places/?country=${p.country}&city=${p.city}">${icon('back')}맛집정보 목록</a><header><span class="place-region">${escape(p.region)}</span><h1>${heading(p.title)}</h1><p>${escape(p.summary)}</p></header>${thumbnail}<p class="detail-intro">${escape(p.intro)}</p>${p.snsUrl?external(p.snsUrl,'원본 영상 보기'):''}<section><span class="detail-number">01 / 이번 한 끼</span><h2>${escape(p.store.name)}</h2>${fields(p.store)}${external(p.store.mapUrl,'매장정보·길찾기')}</section><section><span class="detail-number">02 / 찾아오는 길</span><h2>식당 위치부터 확인하세요</h2><p>${escape(p.location.transit)}</p><p>${escape(p.location.note)}</p><dl class="place-facts"><div><dt>시장 주소</dt><dd>${escape(p.location.marketAddress)}</dd></div></dl>${external(p.location.sourceUrl,'한국관광공사 시장 안내')}</section><section><span class="detail-number">03 / 주차</span><h2>${escape(p.parking.name)}</h2>${fields(p.parking)}<p>${escape(p.parking.hours)}</p><p class="parking-price">${escape(p.parking.fees)}</p><p class="place-note">${escape(p.parking.note)}</p>${external(p.parking.mapUrl,'주차장 위치·요금 확인')}</section><section><span class="detail-number">04 / 주변 먹거리</span><h2>함께 살펴볼 주변 3곳</h2><p class="place-note">${escape(p.nearbyNotice)}</p>${p.nearby.map((n,i)=>`<article class="nearby-place"><span>0${i+1}</span><div><h3>${escape(n.name)}</h3><strong>${escape(n.hook)}</strong><p>${escape(n.description)}</p>${fields(n)}<p class="place-note">${escape(n.note)}</p>${external(n.mapUrl,'매장정보 확인')}</div></article>`).join('')}<p>${escape(p.suggestion)}</p></section><section class="detail-sources"><h2>방문 전 확인해 주세요</h2><p>${escape(p.notice)}</p><p>방문일: 미확인 · 정보 확인일: <time datetime="${p.checkedAt}">${p.checkedAt}</time></p><ul>${p.sources.map(s=>`<li>${external(s.url,s.label)}</li>`).join('')}</ul><small>주변 업소 안내는 직접 방문·시식 후기가 아닙니다.</small></section></article>${course}`;
}
for (const place of (preview?data.places:published)) {
  await fs.writeFile(path.join(out,`${place.id}.html`),page(place.title,place.summary,`/places/${place.id}`,detail(place),place.thumbnail?`/${place.thumbnail}`:undefined,preview));
}
// Only generated detail files for records explicitly marked draft are removed from the public output.
if (!preview) for (const p of data.places.filter(p=>p.status==='draft')) await fs.rm(path.join(out,`${p.id}.html`),{force:true});
if (!preview) await fs.writeFile(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${['/','/creator-course.html','/places/',...published.map(p=>`/places/${p.id}`)].map(route=>`<url><loc>https://www.matgamsa.com${route}</loc></url>`).join('')}</urlset>`);
console.log(JSON.stringify({output:out,published:published.length,draft:data.places.length-published.length,preview}));
