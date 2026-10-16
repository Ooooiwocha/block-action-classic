const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,f);
const {postingCountry}=require('../lib/posting-country.ts');
const req=(country,header)=>{const r=new Request('https://test.invalid',{headers:header?{'CF-IPCountry':header}:{}});if(country!==undefined)r.cf={country};return r};
assert.equal(postingCountry(req('JP','US')),'JP');
assert.equal(postingCountry(req(undefined,'US')),'US');
for(const c of ['XX','T1','jp','<script>',null,''])assert.equal(postingCountry(req(c)),null);
assert.equal(postingCountry(req(undefined)),null);
console.log('Country source priority and unknown/invalid values passed.');
