const STORAGE = "nexoDataV2";
const EMPLOYEE = { email: "empleado@nexo.com", password: "nexo1234", role: "employee" };
let db = loadDB();
let session = null;

function loadDB(){
  try{
    const saved = JSON.parse(localStorage.getItem(STORAGE));
    if(saved && saved.users && saved.requests && saved.loans && saved.payments){ saved.users=saved.users.map(u=>({...u,employment:u.employment||"No informado",seniority:Number(u.seniority)||0,proof:u.proof||"no"})); return saved; }
  }catch(e){}
  return {users:[], requests:[], loans:[], payments:[]};
}
function saveDB(){localStorage.setItem(STORAGE, JSON.stringify(db));}
function $(id){return document.getElementById(id)}
function money(v){return new Intl.NumberFormat("es-AR",{style:"currency",currency:"ARS",minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(v)||0)}
function dateText(v){return new Date(v).toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit"})}
function toast(msg){const t=$("toast");t.textContent=msg;t.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>t.classList.remove("show"),2400)}
function user(){return db.users.find(u=>u.id===session?.userId)}
function uid(prefix){return prefix+"-"+Date.now().toString(36).toUpperCase()+"-"+Math.random().toString(36).slice(2,5).toUpperCase()}

function showClientAuth(){
  $("clientAuth").classList.remove("hidden");$("employeeAuth").classList.add("hidden");
  document.querySelectorAll(".auth-tab").forEach(b=>b.classList.toggle("active",b.dataset.auth==="client"));
}
function showEmployeeAuth(){
  $("clientAuth").classList.add("hidden");$("employeeAuth").classList.remove("hidden");
  document.querySelectorAll(".auth-tab").forEach(b=>b.classList.toggle("active",b.dataset.auth==="employee"));
}
document.querySelectorAll(".auth-tab").forEach(b=>b.addEventListener("click",()=>b.dataset.auth==="employee"?showEmployeeAuth():showClientAuth()));

$("showRegister").onclick=()=>{ $("registerForm").classList.remove("hidden");$("loginForm").classList.add("hidden");$("showRegister").classList.add("active");$("showLogin").classList.remove("active");$("authTitle").textContent="Crear cuenta";$("authDescription").textContent="Registrate para administrar tus préstamos y pagos." };
$("showLogin").onclick=()=>{ $("registerForm").classList.add("hidden");$("loginForm").classList.remove("hidden");$("showLogin").classList.add("active");$("showRegister").classList.remove("active");$("authTitle").textContent="Iniciar sesión";$("authDescription").textContent="Accedé únicamente a los datos de tu propia cuenta." };

$("registerForm").onsubmit=e=>{
 e.preventDefault();
 const email=$("regEmail").value.trim().toLowerCase();
 if(db.users.some(u=>u.email===email)){toast("Ese correo ya está registrado.");return}
 if($("regPassword").value!==$("regPassword2").value){toast("Las contraseñas no coinciden.");return}
 const dni=$("regDni").value.trim();
 const income=Number($("regIncome").value);
 const seniority=Number($("regSeniority").value);
 const employment=$("regEmployment").value;
 const proof=$("regProof").value;
 if(!/^\d{7,8}$/.test(dni)){toast("El DNI debe tener 7 u 8 números.");return}
 if(income<=0){toast("Ingresá un ingreso mensual válido.");return}
 if(seniority<0 || seniority>60){toast("La antigüedad laboral no es válida.");return}
 if(db.users.some(u=>u.dni===dni)){toast("Ese DNI ya está registrado.");return}
 const u={id:uid("USR"),name:$("regName").value.trim(),dni,email,income,employment,seniority,proof,password:$("regPassword").value};
 db.users.push(u);saveDB();session={role:"client",userId:u.id};enterClient();toast("Cuenta creada correctamente.");
};
$("loginForm").onsubmit=e=>{
 e.preventDefault();const email=$("loginEmail").value.trim().toLowerCase(),pass=$("loginPassword").value;
 const u=db.users.find(x=>x.email===email&&x.password===pass);
 if(!u){toast("Correo o contraseña incorrectos.");return}
 session={role:"client",userId:u.id};enterClient();
};
$("demoClient").onclick=()=>{
 let u=db.users.find(x=>x.email==="demo@nexo.com");
 if(!u){u={id:"USR-DEMO",name:"Cliente Demo",dni:"00000000",email:"demo@nexo.com",income:750000,employment:"Empleado en relación de dependencia",seniority:2,proof:"si",password:"demo1234"};db.users.push(u);saveDB()}
 session={role:"client",userId:u.id};enterClient();toast("Cliente de demostración iniciado.");
};
$("employeeLoginForm").onsubmit=e=>{
 e.preventDefault();
 if($("employeeEmail").value.trim().toLowerCase()===EMPLOYEE.email&&$("employeePassword").value===EMPLOYEE.password){session={role:"employee"};enterEmployee()}
 else toast("Datos de empleado incorrectos.");
};

function enterClient(){
 $("authView").classList.add("hidden");$("employeeApp").classList.add("hidden");$("clientApp").classList.remove("hidden");
 $("welcomeName").textContent=user().name.split(" ")[0];$("desktopClientName").textContent=user().name;renderAll();go("home");
}
function enterEmployee(){
 $("authView").classList.add("hidden");$("clientApp").classList.add("hidden");$("employeeApp").classList.remove("hidden");renderEmployee();
}
function logout(){session=null;$("clientApp").classList.add("hidden");$("employeeApp").classList.add("hidden");$("authView").classList.remove("hidden")}
$("logoutClient").onclick=logout;$("logoutClientDesktop").onclick=logout;$("logoutEmployee").onclick=logout;$("settingsBtn").onclick=()=>toast("NEXO · versión escolar sin base de datos.");

function go(section){
 const id=section==="home"?"homeSection":section+"Section";
 document.querySelectorAll("#clientApp .page").forEach(p=>p.classList.remove("active"));
 $(id)?.classList.add("active");
 document.querySelectorAll("#clientApp [data-section]").forEach(b=>b.classList.toggle("active",b.dataset.section===section));
 if(section==="requests")renderRequests();if(section==="payments")renderPayments();if(section==="home")renderHome();
 window.scrollTo({top:0,behavior:"smooth"});
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-section]");if(b)go(b.dataset.section);const a=e.target.closest("[data-approve]");if(a)decide(a.dataset.approve,"Aprobada");const r=e.target.closest("[data-reject]");if(r)decide(r.dataset.reject,"Rechazada");const p=e.target.closest("[data-pay-installment]");if(p)payInstallment(p.dataset.payInstallment);const c=e.target.closest("[data-pay-cash]");if(c)payCash(c.dataset.payCash)});

$("loanForm").onsubmit=e=>{
 e.preventDefault();const u=user(),amount=Number($("loanAmount").value),term=Number($("loanTerm").value);
 const ratio=amount/Math.max(u.income,1);
 if(u.employment==="Desempleado"){toast("Para solicitar un préstamo necesitás registrar una situación laboral activa.");return}
 const score=Math.round(Math.max(500,850-ratio*55+(u.seniority>=2?35:0)+(u.proof==="si"?25:0)));
 const purpose=$("loanPurpose").value.trim(); if(amount<10000){toast("El monto mínimo es $10.000.");return} if(amount>u.income*6){toast("El monto solicitado supera el límite escolar de 6 ingresos mensuales.");return} if(!purpose){toast("Indicá el destino del préstamo.");return} const req={id:uid("SOL"),userId:u.id,type:$("loanType").value,amount,term,purpose,date:new Date().toISOString(),status:"Pendiente",evaluation:{score,risk:score>=750?"Bajo":score>=650?"Medio":"Alto",recommendation:score>=650?"Recomendada":"No recomendada"}};
 db.requests.unshift(req);saveDB();$("loanForm").reset();toast(req.id+" enviada a evaluación.");setTimeout(()=>go("requests"),250);
};

function decide(id,decision){
 const req=db.requests.find(r=>r.id===id);if(!req)return;
 req.status=decision;
 if(decision==="Aprobada"){
   const rate=.55/12,n=req.term,a=req.amount,installment=Math.round(a*(rate*Math.pow(1+rate,n))/(Math.pow(1+rate,n)-1));
   db.loans.unshift({id:uid("PRE"),requestId:id,userId:req.userId,type:req.type,amount:a,term:n,installment,paid:0,status:"Activa",created:new Date().toISOString()});
   toast("Solicitud aprobada y préstamo otorgado.");
 }else toast("Solicitud rechazada.");
 saveDB();renderEmployee();renderAll();
}

function payInstallment(id){
 const loan=db.loans.find(l=>l.id===id);if(!loan||loan.status!=="Activa")return;
 const remaining=loan.term-loan.paid;if(remaining<=0)return;
 loan.paid++;
 db.payments.unshift({id:uid("PAG"),loanId:id,userId:loan.userId,type:"Cuota",installment:loan.paid,amount:loan.installment,date:new Date().toISOString()});
 if(loan.paid>=loan.term)loan.status="Cancelado";
 saveDB();toast("Cuota pagada y confirmada por el sistema bancario central.");renderAll();
}
function payCash(id){
 const loan=db.loans.find(l=>l.id===id);if(!loan||loan.status!=="Activa")return;
 const remaining=loan.term-loan.paid, total=remaining*loan.installment;
 if(!confirm("¿Confirmar pago de contado por "+money(total)+" para cancelar el préstamo?"))return;
 loan.paid=loan.term;loan.status="Cancelado";
 db.payments.unshift({id:uid("PAG"),loanId:id,userId:loan.userId,type:"Cancelación de contado",installment:remaining,amount:total,date:new Date().toISOString()});
 saveDB();toast("Préstamo cancelado de contado.");renderAll();
}

function renderHome(){
 const u=user(), loans=db.loans.filter(l=>l.userId===u.id&&l.status==="Activa"), debt=loans.reduce((s,l)=>s+(l.term-l.paid)*l.installment,0);
 $("totalDebt").textContent=money(debt);
 const active=loans[0];$("nextDue").textContent=active?dateText(Date.now()+30*86400000):"--/--";
 const ps=db.payments.filter(p=>p.userId===u.id).slice(0,4),list=$("historyList");
 list.innerHTML=ps.length?ps.map(p=>`<div class="history-item"><span>${dateText(p.date)}</span><span>${p.type} · ${money(p.amount)}</span></div>`).join(""):`<div class="history-empty">Todavía no hay pagos registrados.</div>`;
}
function renderRequests(){
 const u=user(),list=$("requestsList"),rs=db.requests.filter(r=>r.userId===u.id);
 list.innerHTML=rs.length?rs.map(r=>`<article class="request-card"><div class="card-head"><div><h3>${r.id} · ${r.type}</h3><span class="muted">${dateText(r.date)}</span></div><span class="status ${r.status.toLowerCase()}">${r.status}</span></div><div class="details"><div class="detail"><span>Monto</span><strong>${money(r.amount)}</strong></div><div class="detail"><span>Cuotas</span><strong>${r.term}</strong></div><div class="detail"><span>Score</span><strong>${r.evaluation.score}</strong></div><div class="detail"><span>Riesgo</span><strong>${r.evaluation.risk}</strong></div><div class="detail"><span>Recomendación</span><strong>${r.evaluation.recommendation}</strong></div><div class="detail"><span>Destino</span><strong>${r.purpose}</strong></div></div></article>`).join(""):`<div class="history-card"><div class="history-empty">No tenés solicitudes todavía.</div></div>`;
}
function renderPayments(){
 const u=user(),list=$("paymentsList"),loans=db.loans.filter(l=>l.userId===u.id);
 list.innerHTML=loans.length?loans.map(l=>{
   const rem=l.term-l.paid,total=rem*l.installment;
   return `<article class="payment-card"><div class="card-head"><div><h3>${l.id} · ${l.type}</h3><span class="muted">${l.paid}/${l.term} cuotas pagadas</span></div><span class="status ${l.status==="Activa"?"aprobada":"cancelado"}">${l.status}</span></div><div class="details"><div class="detail"><span>Cuota</span><strong>${money(l.installment)}</strong></div><div class="detail"><span>Saldo estimado</span><strong>${money(total)}</strong></div><div class="detail"><span>Pagadas</span><strong>${l.paid}</strong></div></div>${l.status==="Activa"?`<div class="payment-option"><button class="action approve" data-pay-installment="${l.id}">PAGAR CUOTA</button><button class="action cash-button" data-pay-cash="${l.id}">PAGAR CONTADO</button></div>`:""}</article>`
 }).join(""):`<div class="history-card"><div class="history-empty">Cuando tengas un préstamo aprobado aparecerá acá.</div></div>`;
}
function renderEmployee(){
 const list=$("employeeList"),pending=db.requests.filter(r=>r.status==="Pendiente");
 list.innerHTML=pending.length?pending.map(r=>{
   const u=db.users.find(x=>x.id===r.userId);
   return `<article class="request-card"><div class="card-head"><div><h3>${r.id} · ${r.type}</h3><span class="muted">Cliente: ${u?u.name:"Cuenta no disponible"} · ${u?u.email:""}</span></div><span class="status pendiente">Pendiente</span></div><div class="details"><div class="detail"><span>Monto</span><strong>${money(r.amount)}</strong></div><div class="detail"><span>Cuotas</span><strong>${r.term}</strong></div><div class="detail"><span>Score</span><strong>${r.evaluation.score}</strong></div><div class="detail"><span>Riesgo</span><strong>${r.evaluation.risk}</strong></div><div class="detail"><span>Recomendación</span><strong>${r.evaluation.recommendation}</strong></div><div class="detail"><span>Destino</span><strong>${r.purpose}</strong></div><div class="detail"><span>Situación laboral</span><strong>${u?u.employment:"No informada"}</strong></div><div class="detail"><span>Antigüedad</span><strong>${u?u.seniority:0} años</strong></div><div class="detail"><span>Ingresos</span><strong>${u?money(u.income):"-"}</strong></div></div><div class="actions"><button class="action approve" data-approve="${r.id}">APROBAR</button><button class="action reject" data-reject="${r.id}">RECHAZAR</button></div></article>`
 }).join(""):`<div class="history-card"><div class="history-empty">No hay solicitudes pendientes.</div></div>`;
}
function renderAll(){renderHome();renderRequests();renderPayments()}
