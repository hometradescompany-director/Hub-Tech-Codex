// Navigation is local intent. A browser-supplied object cannot prove admission.
export function resolveEntry(descriptor){
 const refuse=code=>({ok:false,code,grantsAuthority:false});
 if(!descriptor||descriptor.contract!=='environment-entry/v0'||typeof descriptor.id!=='string'||!descriptor.id||descriptor.id.length>200||!['projection','sandbox'].includes(descriptor.mode))return refuse('invalid_entry');
 const value=descriptor.destination;if(typeof value!=='string'||value.length>2048||/[\\\s\x00-\x1f]/.test(value))return refuse('invalid_destination');
 try{const url=new URL(value,'https://local.invalid');const local=value.startsWith('/')&&!value.startsWith('//');if(!local&&!value.startsWith('https://'))return refuse('invalid_destination');if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||(!local&&url.hostname==='local.invalid'))return refuse('invalid_destination');if(descriptor.mode==='sandbox')return refuse('admission_required');return {ok:true,destination:local?url.pathname:url.href,grantsAuthority:false,mode:'projection'};}catch{return refuse('invalid_destination');}
}
