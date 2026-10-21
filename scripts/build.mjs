import {spawnSync} from 'node:child_process';
import {mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','app.js','domain.js','rfq.js','scenarios.js','workspace.js','styles.css','README.md','DEMO_SCRIPT.md']){
 try{await copyFile(file,`dist/${file}`);}catch(error){if(file!=='DEMO_SCRIPT.md')throw error;}
}
await mkdir('dist/validation',{recursive:true});
for(const file of ['fixtures.json','benchmark-results.json','benchmark-report.html','MEASUREMENT.md','manual-baseline.xlsx','HUMAN_TEST.md'])await copyFile(`validation/${file}`,`dist/validation/${file}`);
// Keep the standalone report reproducible while serving its styles under the app CSP.
const report=await readFile('dist/validation/benchmark-report.html','utf8');
const reportStyle=report.match(/<style>([\s\S]*?)<\/style>/);
if(!reportStyle)throw new Error('Benchmark report stylesheet is missing.');
await writeFile('dist/validation/benchmark-report.css',reportStyle[1]);
await writeFile('dist/validation/benchmark-report.html',report.replace(reportStyle[0],'<link rel="stylesheet" href="benchmark-report.css">'));
await writeFile('dist/_headers',`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: SAMEORIGIN\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'\n`);
console.log('Static app built in dist/.');

const bundle=spawnSync('python3',['scripts/package_source.py'],{stdio:'inherit'});if(bundle.status!==0)process.exit(bundle.status??1);
