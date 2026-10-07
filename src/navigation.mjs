export function createNavigation(initial={}) {return {current:{selected:null,lens:'constellation',query:'',kind:'all',...initial},history:[]};}
export function navigate(state,patch) {const next={...state.current,...patch};if(JSON.stringify(next)===JSON.stringify(state.current))return state;return {current:next,history:[...state.history,state.current].slice(-100)};}
export function goBack(state) {if(!state.history.length)return state;return {current:state.history.at(-1),history:state.history.slice(0,-1)};}
