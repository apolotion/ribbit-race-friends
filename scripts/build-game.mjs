import { readFileSync, readdirSync, writeFileSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { pathToFileURL } from 'node:url';
import { minify } from 'terser';
import { cleanRelease } from './clean-release.mjs';

/** Readable modules are authoritative. Production output is rebuilt atomically. */
export class GameBundleBuilder {
  constructor(projectRoot=process.cwd()) {
    this.projectRoot=projectRoot;
    this.sourceDirectory=resolve(projectRoot,'client/game');
    this.outputPath=resolve(projectRoot,'public/scripts/game.bundle.js');
  }
  discoverModules(){
    return readdirSync(this.sourceDirectory).filter(n=>/^\d+-.+\.js$/i.test(n))
      .sort((a,b)=>parseInt(a,10)-parseInt(b,10)||a.localeCompare(b)).map(n=>`client/game/${n}`);
  }
  readAndValidate(path){
    const code=readFileSync(resolve(this.projectRoot,path),'utf8');
    new vm.Script(code,{filename:path});return code;
  }
  async build(){
    cleanRelease(this.projectRoot);
    const modules=this.discoverModules();
    const body=modules.map(path=>`/* ${path} */\n${this.readAndValidate(path)}`).join('\n');
    const source=`"use strict";\nfunction startRibbitRaceGame(){\n${body}\n}\n`;
    new vm.Script(source,{filename:'unminified-game.js'});
    // Compatibility hooks resolve functions by name. Do not mangle identifiers,
    // rewrite expressions or strip line-looking text out of template literals.
    const result=await minify(source,{compress:false,mangle:false,keep_fnames:true,keep_classnames:true,
      format:{comments:/^!|@license|@preserve/,preamble:'/* Generated from client/game. Edit source modules, then npm run build. */'}});
    if(!result.code)throw new Error('Minifier produced no game code');
    new vm.Script(result.code,{filename:'game.bundle.js'});
    writeFileSync(this.outputPath+'.tmp',result.code+'\n');renameSync(this.outputPath+'.tmp',this.outputPath);
    console.log(`Built ${modules.length} source modules: ${Buffer.byteLength(source)} -> ${Buffer.byteLength(result.code)} bytes.`);
  }
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await new GameBundleBuilder().build();
