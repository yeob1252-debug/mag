import {createRequire} from 'node:module';
import {writeFile,mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),icons=require('lucide-react');
const names={pause:'Pause',play:'Play',replay:'RotateCcw',skip:'SkipForward',arrow:'ArrowUpRight',back:'ArrowLeft'};
const symbols=Object.entries(names).map(([id,name])=>{const svg=renderToStaticMarkup(React.createElement(icons[name],{size:24}));return `<symbol id="${id}" viewBox="0 0 24 24">${svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'')}</symbol>`;}).join('');
await mkdir(new URL('../assets/icons/',import.meta.url),{recursive:true});
await writeFile(new URL('../assets/icons/video-controls.svg',import.meta.url),`<svg xmlns="http://www.w3.org/2000/svg">${symbols}</svg>`);
console.log('Existing Lucide icons exported.');
