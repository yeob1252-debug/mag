import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
const require=createRequire(import.meta.url);
const sharp=require('sharp');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source='C:/Users/USER/YB-business/docs/website-video-upgrade/20260911';
await fs.mkdir(path.join(root,'assets/video-places'),{recursive:true});
for(const id of ['m01-meal-v1','m02-filming-v1','m03-editing-v1','m04-japan-v1']){
  await sharp(path.join(source,id+'.png')).resize({width:1280,withoutEnlargement:true}).webp({quality:88}).toFile(path.join(root,'assets/video-places',id+'.webp'));
  if(process.argv.includes('--video'))execFileSync(path.join(source,'media-tools/node_modules/ffmpeg-static/ffmpeg.exe'),['-hide_banner','-loglevel','error','-y',...(id==='m02-filming-v1'?['-ss','0.5']:[]),'-i',path.join(source,id+'.mp4'),...(id==='m02-filming-v1'?['-t','3.8']:[]),'-vf',`scale=${id==='m04-japan-v1'?1280:720}:-2`,'-c:v','libx264','-crf','20','-preset','medium','-pix_fmt','yuv420p','-an','-movflags','+faststart',path.join(root,'assets/video-places',id+'.mp4')],{stdio:'inherit'});
}
await fs.mkdir(path.join(root,'assets/places/daemyeong'),{recursive:true});
for(const [suffix,name] of [['','exterior'],['_02','buffet-01'],['_03','buffet-02'],['_04','buffet-03']]){
  await sharp(path.join(source,'daemyeong-sources',`KakaoTalk_20260911_120510330${suffix}.png`)).resize({width:1000,withoutEnlargement:true}).webp({quality:88}).toFile(path.join(root,'assets/places/daemyeong',name+'.webp'));
}
console.log('Approved stills resized/encoded without crop; original files unchanged.');
