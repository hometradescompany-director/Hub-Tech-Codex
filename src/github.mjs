const API='https://api.github.com';
export function parseRepository(input) {
  if(typeof input!=='string'||input.length>300)throw new Error('Use owner/repository or a public GitHub repository URL');
  let value=input.trim();
  if(value.includes('://')){const u=new URL(value);if(u.protocol!=='https:'||u.hostname!=='github.com'||u.port||u.username||u.password||u.search||u.hash)throw new Error('Only credential-free GitHub repository URLs are accepted');value=u.pathname.replace(/^\//,'').replace(/\/$/,'');}
  if(!/^[a-zA-Z0-9][a-zA-Z0-9-]{0,38}\/[a-zA-Z0-9_.-]{1,100}$/.test(value)||value.split('/')[1]==='.'||value.split('/')[1]==='..')throw new Error('Use exactly owner/repository');
  return {fullName:value,owner:value.split('/')[0],repo:value.split('/')[1]};
}
async function boundedJson(response) {
  const mediaType=(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
  if(mediaType!=='application/json'&&!/^application\/[a-z0-9!#$&^_.+-]+\+json$/.test(mediaType))throw new Error('Expected JSON media type');
  if(Number(response.headers.get('content-length'))>262144)throw new Error('Response too large');
  const reader=response.body?.getReader();if(!reader)throw new Error('Missing response');
  let length=0;const chunks=[];
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>262144){await reader.cancel();throw new Error('Response too large');}chunks.push(value);}
  const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.byteLength;}return JSON.parse(new TextDecoder().decode(bytes));
}
export async function observeRepository(input,{fetchImpl=fetch,now=()=>new Date()}={}) {
  let repo;try{repo=parseRepository(input);}catch{return {ok:false,code:'invalid_repository',detail:'Use owner/repository on github.com'};}
  const path=`${API}/repos/${repo.owner}/${repo.repo}`;
  async function get(url){
    const r=await fetchImpl(url,{method:'GET',redirect:'error',headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10'},signal:AbortSignal.timeout(10000)});
    if(!r.ok){const code=(r.status===403&&r.headers.get('x-ratelimit-remaining')==='0')||r.status===429?'rate_limited':r.status===404?'not_locatable':r.status===401||r.status===403?'access_refused':'source_error';return {error:{ok:false,code,status:r.status,detail:'GitHub observation was not obtained'}};}
    try{return {body:await boundedJson(r)}}catch{return {error:{ok:false,code:'invalid_response',detail:'GitHub returned an invalid or oversized observation'}};}
  }
  try{
    const meta=await get(path);if(meta.error)return meta.error;const m=meta.body;
    if(m?.private!==false||!Number.isSafeInteger(m.id)||typeof m.full_name!=='string'||m.full_name.toLowerCase()!==repo.fullName.toLowerCase()||typeof m.default_branch!=='string'||m.default_branch.length>200) return {ok:false,code:'invalid_response',detail:'Public repository identity was not established'};
    const commit=await get(`${path}/commits/${encodeURIComponent(m.default_branch)}`);if(commit.error)return commit.error;
    if(!/^[a-f0-9]{40,64}$/.test(commit.body?.sha))return {ok:false,code:'invalid_response',detail:'Revision was not established'};
    const fullName=m.full_name,observedAt=now().toISOString(),revision=commit.body.sha;
    const licence=typeof m.license?.spdx_id==='string'&&m.license.spdx_id!=='NOASSERTION'?{standing:'declared',spdx:m.license.spdx_id.slice(0,100)}:{standing:'unknown',spdx:null};
    return {ok:true,node:{id:`github:${fullName.toLowerCase()}`,label:fullName,kind:'repository',standing:'observed',summary:typeof m.description==='string'?m.description.slice(0,4000):'No description supplied',url:`https://github.com/${fullName}`,revision,licence,archived:m.archived===true,source:{kind:'github-rest-observation',ref:path,observedAt,revision}},observation:{observedAt,revision,grantsAuthority:false,scope:'public-metadata-only'}};
  }catch{return {ok:false,code:'unreachable',detail:'GitHub observation failed; no trust or absence claim inferred'};}
}
