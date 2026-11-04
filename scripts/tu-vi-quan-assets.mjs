import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
const destination = new URL('../public/tu-vi-quan/assets/', import.meta.url);
await mkdir(destination, {recursive:true});
const entries=[];
async function download(url) {
 if (!['api.polyhaven.com','dl.polyhaven.org'].includes(new URL(url).hostname)) throw new Error('Unexpected asset origin');
 const response=await fetch(url); if (!response.ok) throw new Error(`${response.status}: ${url}`);
 return Buffer.from(await response.arrayBuffer());
}
const pad=buffer=>Buffer.concat([buffer,Buffer.alloc((4-buffer.length%4)%4)]);
for (const id of ['chinese_tea_table','ceramic_pot']) {
 const metadata=JSON.parse((await download(`https://api.polyhaven.com/files/${id}`)).toString());
 const asset=metadata.gltf['1k'].gltf;
 const gltf=JSON.parse((await download(asset.url)).toString());
 const original=await download(asset.include[gltf.buffers[0].uri].url);
 let binary=pad(original);
 delete gltf.buffers[0].uri;
 for (const image of gltf.images) {
  const source=asset.include[image.uri].url;
  const jpeg=await sharp(await download(source)).resize(512,512,{fit:'inside'}).jpeg({quality:82}).toBuffer();
  gltf.bufferViews.push({buffer:0,byteOffset:binary.length,byteLength:jpeg.length});
  image.bufferView=gltf.bufferViews.length-1; image.mimeType='image/jpeg'; delete image.uri;
  binary=Buffer.concat([binary,pad(jpeg)]);
 }
 gltf.buffers[0].byteLength=binary.length;
 let json=Buffer.from(JSON.stringify(gltf)); json=Buffer.concat([json,Buffer.alloc((4-json.length%4)%4,32)]);
 const header=Buffer.alloc(12);header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+binary.length,8);
 const chunk=(size,type)=>{const h=Buffer.alloc(8);h.writeUInt32LE(size);h.writeUInt32LE(type,4);return h;};
 const output=Buffer.concat([header,chunk(json.length,0x4e4f534a),json,chunk(binary.length,0x004e4942),binary]);
 await writeFile(new URL(`${id}.glb`,destination),output);
 entries.push({file:`${id}.glb`,source:`https://polyhaven.com/a/${id}`,sources:[asset.url,...Object.values(asset.include).map(x=>x.url)],license:'CC0-1.0',modification:'glTF repacked as self-contained GLB; PBR images resized to 512px JPEG',bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')});
}
for (const id of ['stone_floor','wood_planks']) {
 const metadata=JSON.parse((await download(`https://api.polyhaven.com/files/${id}`)).toString());
 for (const [map,key] of [['diff','Diffuse'],['normal','nor_gl'],['rough','Rough']]) {
  const asset=(metadata[key]??metadata[key.toLowerCase()])['1k'].jpg;
  const output=await sharp(await download(asset.url)).resize(512,512).jpeg({quality:82}).toBuffer();
  const file=`${id}_${map}.jpg`;await writeFile(new URL(file,destination),output);
  entries.push({file,source:`https://polyhaven.com/a/${id}`,download:asset.url,license:'CC0-1.0',modification:'Resized to 512px JPEG',bytes:output.length,sha256:createHash('sha256').update(output).digest('hex')});
 }
}
await writeFile(new URL('manifest.json',destination),JSON.stringify({license:'https://creativecommons.org/publicdomain/zero/1.0/',licenseEvidence:'https://polyhaven.com/license',retrieved:'2026-11-04',runtimeExternalRequests:false,entries},null,2)+'\n');
console.log(JSON.stringify({files:entries.length,totalBytes:entries.reduce((sum,e)=>sum+e.bytes,0)}));
