import {spawnSync} from 'node:child_process';
import {mkdir,copyFile,readFile,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','app.js','domain.js','rfq.js','scenarios.js','styles.css','README.md','DEMO_SCRIPT.md']){
 try{await copyFile(file,`dist/${file}`);}catch(error){if(file!=='DEMO_SCRIPT.md')throw error;}
}
await writeFile('dist/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'\n`);
console.log('Static app built in dist/.');

const bundle=spawnSync('python3',['scripts/package_source.py'],{stdio:'inherit'});if(bundle.status!==0)process.exit(bundle.status??1);
