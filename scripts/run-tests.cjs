const cp=require('node:child_process'),http=require('node:http'),path=require('node:path');
const {previewPort,evidencePort}=require('./test-config.cjs');
const root=path.resolve(__dirname,'..'),servers=[];
const exists=port=>new Promise(resolve=>{const req=http.get(`http://127.0.0.1:${port}/`,r=>{r.resume();resolve(true);});req.on('error',()=>resolve(false));req.setTimeout(1000,()=>{req.destroy();resolve(false);});});
function run(script){const r=cp.spawnSync(process.execPath,[path.join(__dirname,script)],{cwd:root,stdio:'inherit',windowsHide:true});if(r.status!==0)throw new Error(`${script} failed with exit ${r.status}`);}
(async()=>{
 try{
  run('prepare-tests.cjs');
  const preview=await exists(previewPort),evidence=await exists(evidencePort);
  if(!preview||!evidence){const args=!preview&&!evidence?['--evidence']:preview?['--evidence-only']:[];const server=cp.spawn(process.execPath,[path.join(__dirname,'serve.cjs'),...args],{cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,PORT:String(previewPort),PACE_EVIDENCE_PORT:String(evidencePort)}});servers.push(server);await new Promise(r=>setTimeout(r,700));}
  run('ui-tests.cjs');run('app-tests.cjs');run('onboarding-tests.cjs');run('group-tests.cjs');run('focus-pause-tests.cjs');run('pwa-check.cjs');
 }catch(e){console.error(e.message);process.exitCode=1;}finally{for(const server of servers)server.kill();}
})();
