import {observeRepository} from '../src/github.mjs';
const input=process.argv[2];if(!input){console.error('Usage: npm run discover -- owner/repository');process.exitCode=1;}else{const result=await observeRepository(input);console.log(JSON.stringify(result,null,2));if(!result.ok)process.exitCode=1;}
