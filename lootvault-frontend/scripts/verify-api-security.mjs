import assert from "node:assert/strict";
globalThis.window=new EventTarget();
const {api}=await import("../src/api/client.js");
let token=1,writes=0,tokenReads=0,invalid=false,unauthorized=false,network=false,expired=0;
window.addEventListener("lootvault:session-expired",()=>expired++);
globalThis.fetch=async(path,options={})=>{
 if(path==="/api/auth/csrf"){tokenReads++;return new Response(JSON.stringify({token:String(token),headerName:"X-CSRF-TOKEN"}));}
 if(network)throw new Error("Network interrupted");
 if(options.method==="POST"){writes++;assert.equal(options.headers["X-CSRF-TOKEN"],String(token));}
 if(invalid){invalid=false;token++;return new Response(JSON.stringify({code:"CSRF_INVALID",error:"Refresh"}),{status:403});}
 if(unauthorized)return new Response(JSON.stringify({error:"Expired"}),{status:401});
 return new Response(JSON.stringify({ok:true}));
};
await api.post("/api/earn/daily/claim");assert.equal(tokenReads,1);
invalid=true;await api.post("/api/earn/daily/claim");assert.equal(tokenReads,2);assert.equal(writes,3);
network=true;await assert.rejects(api.post("/api/shop/offers/1/buy"),/Network/);assert.equal(writes,3);network=false;
unauthorized=true;await assert.rejects(api.get("/api/earn"),/Expired/);assert.equal(expired,1);unauthorized=false;
await api.post("/api/auth/logout");await api.post("/api/auth/login",{username:"test",password:"test"});assert.equal(tokenReads,3);
console.log("API security checks passed: token headers, one pre-controller retry, no blind write retry, session expiry, token reset.");
