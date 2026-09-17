"use strict";
const URL="https://ncylczvijvdaiaamhmwk.supabase.co";
const KEY="sb_publishable_hNUwSYtyf0jU7ARbvai3gw_1xbNlyMe";
let token=localStorage.getItem("hp_access")||"",tools=[],history=[];
const $=s=>document.querySelector(s),esc=s=>String(s??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
const date=s=>s?new Date(s+"T00:00:00").toLocaleDateString("en-GB"):"—";
const today=()=>new Date().toISOString().slice(0,10);
function headers(admin=false){return {apikey:KEY,Authorization:`Bearer ${admin&&token?token:KEY}`,"Content-Type":"application/json"}}
function msg(text,type="ok"){$("#message").textContent=text;$("#message").className=type;setTimeout(()=>{$("#message").textContent=""},4500)}
async function api(path,options={}){const r=await fetch(URL+path,{...options,headers:{...headers(options.admin),...(options.headers||{})}});if(r.status===401&&options.admin){token="";localStorage.removeItem("hp_access");showAuth()}if(!r.ok){let e={};try{e=await r.json()}catch{}throw new Error(e.message||e.error_description||`Request failed (${r.status})`)}return r.status===204?null:r.json()}
async function load(){
 try{[tools,history]=await Promise.all([api("/rest/v1/tools?select=*&order=name"),api("/rest/v1/tool_history?select=*&order=assigned_on.desc,created_at.desc")]);localStorage.setItem("hp_cache",JSON.stringify({tools,history}));render()}
 catch(e){const cache=JSON.parse(localStorage.getItem("hp_cache")||"null");if(cache){tools=cache.tools;history=cache.history;render();msg("Offline: showing the last synchronized records.","error")}else msg(e.message,"error")}
}
function active(){return history.filter(h=>!h.ended_on)}
function render(){
 const allocations=active(),q=$("#search").value.toLowerCase();
 $("#total").textContent=tools.reduce((n,t)=>n+t.quantity,0);$("#out").textContent=allocations.length;$("#free").textContent=Math.max(0,tools.reduce((n,t)=>n+t.quantity,0)-allocations.length);
 $("#tools").innerHTML=tools.filter(t=>{const a=allocations.filter(x=>x.tool_id===t.id);return `${t.name} ${t.description} ${a.map(x=>x.technician+" "+x.site)}`.toLowerCase().includes(q)}).map(t=>{const a=allocations.filter(x=>x.tool_id===t.id),free=Math.max(0,t.quantity-a.length);return `<article class="tool"><h3>${esc(t.name)}</h3><small>${esc(t.description)}</small><div class="counts"><span>Total: ${t.quantity}</span><span>Free: ${free}</span><span>Out: ${a.length}</span></div>${a.map(x=>`<div class="holder"><b>${esc(x.technician)}</b><br><small>${esc(x.site)} • ${date(x.assigned_on)}</small></div>`).join("")}</article>`}).join("")||"No matching tools.";
 $("#history").innerHTML=history.map(h=>`<tr><td>${esc(h.technician)}</td><td>${esc(h.site)}</td><td>${esc(tools.find(t=>t.id===h.tool_id)?.name||"Tool")}</td><td>${date(h.assigned_on)}</td><td>${date(h.ended_on)}</td><td>${esc(h.action)}</td></tr>`).join("");
 const freeTools=tools.filter(t=>allocations.filter(a=>a.tool_id===t.id).length<t.quantity);$("#toolSelect").innerHTML=freeTools.map(t=>`<option value="${t.id}">${esc(t.name)}</option>`).join("");
 $("#active").innerHTML=allocations.map(a=>`<div class="allocation"><span><b>${esc(tools.find(t=>t.id===a.tool_id)?.name||"Tool")}</b><br>${esc(a.technician)} • ${esc(a.site)} • ${date(a.assigned_on)}</span><div class="actions"><button data-transfer="${a.id}">Transfer</button><button class="dark" data-release="${a.id}">Release</button></div></div>`).join("")||"No tools are currently allocated.";
}
function showAuth(){const logged=!!token;$("#login").hidden=logged;$("#adminPanel").hidden=!logged}
document.querySelectorAll("nav button").forEach(b=>b.onclick=()=>{document.querySelectorAll("nav button").forEach(x=>x.classList.remove("active"));b.classList.add("active");const admin=b.dataset.view==="admin";$("#publicView").hidden=admin;$("#adminView").hidden=!admin;showAuth()});
$("#refresh").onclick=load;$("#search").oninput=render;$("#assignDate").value=today();$("#transferDate").value=today();
$("#login").onsubmit=async e=>{e.preventDefault();try{const r=await api("/auth/v1/token?grant_type=password",{method:"POST",body:JSON.stringify({email:$("#email").value,password:$("#password").value})});token=r.access_token;localStorage.setItem("hp_access",token);showAuth();msg("Administrator signed in.");await load()}catch(x){msg(x.message,"error")}};
$("#logout").onclick=()=>{token="";localStorage.removeItem("hp_access");showAuth();msg("Signed out.")};
$("#addTool").onsubmit=async e=>{e.preventDefault();try{await api("/rest/v1/tools",{admin:true,method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify({name:$("#toolName").value.trim(),quantity:Number($("#quantity").value),description:$("#description").value.trim()})});e.target.reset();$("#quantity").value=1;msg("Tool added.");await load()}catch(x){msg(x.message,"error")}};
$("#assign").onsubmit=async e=>{e.preventDefault();try{await api("/rest/v1/rpc/assign_tool",{admin:true,method:"POST",body:JSON.stringify({p_tool_id:$("#toolSelect").value,p_technician:$("#technician").value.trim(),p_site:$("#site").value.trim(),p_date:$("#assignDate").value})});e.target.reset();$("#assignDate").value=today();msg("Tool assigned.");await load()}catch(x){msg(x.message,"error")}};
$("#active").onclick=async e=>{const release=e.target.dataset.release,transfer=e.target.dataset.transfer;if(release&&confirm("Release this tool?")){try{await api("/rest/v1/rpc/release_tool",{admin:true,method:"POST",body:JSON.stringify({p_history_id:release,p_date:today()})});msg("Tool released.");await load()}catch(x){msg(x.message,"error")}}if(transfer){const a=history.find(h=>h.id===transfer);$("#historyId").value=transfer;$("#transferText").textContent=`Transfer from ${a.technician} at ${a.site}`;$("#transferDate").value=today();$("#transfer").showModal()}};
$("#cancel").onclick=()=>$("#transfer").close();$("#transferForm").onsubmit=async e=>{e.preventDefault();try{await api("/rest/v1/rpc/transfer_tool",{admin:true,method:"POST",body:JSON.stringify({p_history_id:$("#historyId").value,p_technician:$("#newTechnician").value.trim(),p_site:$("#newSite").value.trim(),p_date:$("#transferDate").value})});$("#transfer").close();e.target.reset();msg("Tool transferred.");await load()}catch(x){msg(x.message,"error")}};
showAuth();load();setInterval(load,60000);
