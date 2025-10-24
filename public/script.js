/****************  FIREBASE  ****************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, setDoc, doc, getDoc, getDocs,
  deleteDoc, query, orderBy, limit, where, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB7eE1ZOWzcVXQTQ9y5suJ5FSkFWMZrTuE",
  authDomain: "control-partes-v2.firebaseapp.com",
  projectId: "control-partes-v2",
  storageBucket: "control-partes-v2.firebasestorage.app",
  messagingSenderId: "947187978310",
  appId: "1:947187978310:web:6b5507c430b5f221173a47"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

/****************  UI REFS  ****************/
const appLoader = document.getElementById("appLoader");

const loginSection = document.getElementById("login-section");
const formSection  = document.getElementById("form-section");
const adminSection = document.getElementById("admin-section");

const usuarioSel  = document.getElementById("usuario");
const legajoInput = document.getElementById("legajo");
const btnLogin    = document.getElementById("btnLogin");
const errorLogin  = document.getElementById("errorLogin");
const msgNoUsers  = document.getElementById("msgNoUsers");

const btnSalir      = document.getElementById("btnSalir");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");

const userActive  = document.getElementById("userActive");
const fechaInput  = document.getElementById("fecha");
const internoSel  = document.getElementById("interno");
const finalInput  = document.getElementById("final");
const cargoSel    = document.getElementById("cargoCombustible");
const datosComb   = document.getElementById("datosCombustible");
const datosComb2  = document.getElementById("datosCombustible2");
const litrosInput = document.getElementById("litros");
const kmCarga     = document.getElementById("kmCarga");
const novedades   = document.getElementById("novedades");
const btnGuardar  = document.getElementById("btnGuardar");
const msgGuardado = document.getElementById("msgGuardado");
const chipEstado  = document.getElementById("estadoServiceChip");

const ultimoParteBox = document.getElementById("ultimoParte");
const uFecha = document.getElementById("uFecha");
const uFinal = document.getElementById("uFinal");
const uComb  = document.getElementById("uCombustible");
const uNove  = document.getElementById("uNovedades");

const tabBtns       = document.querySelectorAll(".tab-btn");
const tablaUltimos  = document.getElementById("tablaUltimos");
const tablaUsuarios = document.getElementById("tablaUsuarios");
const tablaInternos = document.getElementById("tablaInternos");
const tablaPartes   = document.getElementById("tablaPartes");
const tablaService  = document.getElementById("tablaService");
const listaSinPartes= document.getElementById("listaSinPartes");
const listaSinPartes2= document.getElementById("listaSinPartes2");

/* Usuarios */
const nuNombre      = document.getElementById("nu-nombre");
const nuLegajo      = document.getElementById("nu-legajo");
const nuRol         = document.getElementById("nu-rol");
const btnAddUsuario = document.getElementById("btnAddUsuario");

/* Internos */
const niCodigo  = document.getElementById("ni-codigo");
const niTipo    = document.getElementById("ni-tipo");
const niCada    = document.getElementById("ni-cada");
const niUltVal  = document.getElementById("ni-ultvalor");
const niUltFec  = document.getElementById("ni-ultfecha");
const niFAceite = document.getElementById("ni-f-aceite");
const niFAire   = document.getElementById("ni-f-aire");
const niFComb   = document.getElementById("ni-f-comb");
const niRM      = document.getElementById("ni-rm");
const btnAddInterno = document.getElementById("btnAddInterno");

/* Service (dinámico) */
const svInterno = document.getElementById("sv-interno");
const svFecha   = document.getElementById("sv-fecha");
const svValor   = document.getElementById("sv-valor");
const btnAddService = document.getElementById("btnAddService");
const svAceiteTipo   = document.getElementById("sv-aceite-tipo");
const svAceiteLitros = document.getElementById("sv-aceite-litros");
const svRM           = document.getElementById("sv-rm");

const SVC = {
  aceite: { list: document.getElementById("sv-list-aceite"), add: document.getElementById("sv-add-aceite") },
  airep:  { list: document.getElementById("sv-list-airep"),  add: document.getElementById("sv-add-airep") },
  aires:  { list: document.getElementById("sv-list-aires"),  add: document.getElementById("sv-add-aires") },
  comb:   { list: document.getElementById("sv-list-comb"),   add: document.getElementById("sv-add-comb") },
  hab:    { list: document.getElementById("sv-list-hab"),    add: document.getElementById("sv-add-hab") },
  hid:    { list: document.getElementById("sv-list-hid"),    add: document.getElementById("sv-add-hid") },
};

/****************  STATE & HELPERS  ****************/
let usuarioActivo = null; // {id, nombre, legajo, rol}
const today = () => new Date().toISOString().slice(0,10);

const showLoader = ()=> appLoader?.classList.remove("hidden");
const hideLoader = ()=> appLoader?.classList.add("hidden");

function badgeEstado(dif, cada, tipo) {
  const unidad = (tipo === "km") ? "km" : "hs";
  const rest = Math.max(0, cada - dif);
  if (dif >= cada)  return `<span class="badge danger">VENCIDO hace ${dif-cada} ${unidad}</span>`;
  if (dif >= Math.floor(cada * 0.9)) return `<span class="badge warn">PRÓXIMO — faltan ${rest} ${unidad}</span>`;
  return `<span class="badge ok">OK — faltan ${rest} ${unidad}</span>`;
}
const chip = (el, type, text)=>{ if(!el) return; el.className = "badge " + (type||""); el.textContent = text; };
const toast = (el, type, text)=>{ if(!el) return; el.className="msg " + (type||""); el.textContent=text; setTimeout(()=>{el.className="msg"; el.textContent=""}, 3500); };

/****************  SEEDS OPCIONALES  ****************/
const ENABLE_SEEDS = true;
async function ensureSeeds(){
  if(!ENABLE_SEEDS) return;

  const cu = await getDocs(collection(db,"usuarios"));
  if (cu.empty){
    await addDoc(collection(db,"usuarios"), {nombre:"admin",              legajo:"000", rol:"admin"});
    await addDoc(collection(db,"usuarios"), {nombre:"Rodriguez Rodrigo",  legajo:"127", rol:"operario"});
    await addDoc(collection(db,"usuarios"), {nombre:"Rodriguez Gabriel",  legajo:"125", rol:"operario"});
    await addDoc(collection(db,"usuarios"), {nombre:"Acevedo Nelson",     legajo:"123", rol:"operario"});
    await addDoc(collection(db,"usuarios"), {nombre:"Arias Federico",     legajo:"124", rol:"operario"});
  }
  const ci = await getDocs(collection(db,"internos"));
  if (ci.empty){
    const base = today();
    await setDoc(doc(db,"internos","TR-512"),{tipo:"horas", proximoCada:250,   ultimoServiceValor:300,    ultimoServiceFecha:base, filtros:{aceite:"F-AC-001", aire:"F-AI-100", combustible:"F-CO-200"}, rm:"RM-TR512"});
    await setDoc(doc(db,"internos","C-185"), {tipo:"km",    proximoCada:10000, ultimoServiceValor:84000,  ultimoServiceFecha:base, filtros:{aceite:"F-AC-011", aire:"F-AI-101", combustible:"F-CO-210"}, rm:"RM-C185"});
    await setDoc(doc(db,"internos","T-434"), {tipo:"km",    proximoCada:10000, ultimoServiceValor:100000, ultimoServiceFecha:base, filtros:{aceite:"F-AC-019", aire:"F-AI-115", combustible:"F-CO-240"}, rm:"RM-T434"});
    await setDoc(doc(db,"internos","C-111"), {tipo:"horas", proximoCada:250,   ultimoServiceValor:1200,   ultimoServiceFecha:base, filtros:{aceite:"F-AC-050", aire:"F-AI-120", combustible:"F-CO-260"}, rm:"RM-C111"});
  }
}

/****************  CARGA DE COMBOS  ****************/
async function cargarUsuariosCombo(){
  if (!usuarioSel) return;
  usuarioSel.innerHTML = `<option value="">-- Elegí tu nombre --</option>`;
  const snap = await getDocs(collection(db,"usuarios"));
  if (snap.empty) { msgNoUsers && (msgNoUsers.hidden = false); return; }
  msgNoUsers && (msgNoUsers.hidden = true);
  snap.forEach(d=>{
    const u = d.data();
    const opt = document.createElement("option");
    opt.value = JSON.stringify({id:d.id, ...u});
    opt.textContent = u.nombre;
    usuarioSel.appendChild(opt);
  });
}

async function cargarInternosCombo(){
  if (internoSel) internoSel.innerHTML = `<option value="">-- Seleccioná un interno --</option>`;
  if (svInterno)  svInterno.innerHTML  = `<option value="">-- Seleccioná un interno --</option>`;
  const snap = await getDocs(collection(db,"internos"));
  snap.forEach(d=>{
    if (internoSel){
      const opt = document.createElement("option");
      opt.value = d.id; opt.textContent = d.id;
      internoSel.appendChild(opt);
    }
    if (svInterno){
      const opt2 = document.createElement("option");
      opt2.value = d.id; opt2.textContent = d.id;
      svInterno.appendChild(opt2);
    }
  });
}

/****************  LOGIN  ****************/
const sidebar = document.getElementById("sidebar");

btnLogin.addEventListener("click", async () => {
  errorLogin.textContent = "";
  if(!usuarioSel.value || !legajoInput.value){
    errorLogin.textContent = "Elegí un usuario y cargá el legajo."; 
    return;
  }

  const u = JSON.parse(usuarioSel.value);
  if (u.legajo !== legajoInput.value){
    errorLogin.textContent = "Legajo incorrecto.";
    return;
  }

  usuarioActivo = u;
  localStorage.setItem("usuarioActivo", JSON.stringify(u));

  // 🔹 Mostrar/Ocultar secciones según rol
  if (u.rol === "admin") {
    document.body.classList.add("admin-active");

    sidebar.classList.remove("hidden");
    adminSection.classList.remove("hidden");
    formSection.classList.add("hidden");
    loginSection.classList.add("hidden");
    await initAdmin();
  } else {
    document.body.classList.remove("admin-active");

    sidebar.classList.add("hidden");
    formSection.classList.remove("hidden");
    loginSection.classList.add("hidden");
    userActive.textContent = `Usuario: ${u.nombre}`;
    fechaInput.value = today();
    await cargarInternosCombo();
  }
});


/****************  OPERARIO  ****************/
cargoSel?.addEventListener("change", ()=>{
  const show = cargoSel.value === "si";
  datosComb?.classList.toggle("hidden", !show);
  datosComb2?.classList.toggle("hidden", !show);
});

internoSel?.addEventListener("change", async ()=>{
  if (!internoSel) return;
  const interno = internoSel.value;
  chip(chipEstado,"","");
  if(!interno){ ultimoParteBox?.classList.add("hidden"); return; }

  const qs = query(collection(db,"partes"),
    where("interno","==", interno),
    orderBy("timestamp","desc"), limit(1));
  const s = await getDocs(qs);
  if (s.empty){
    ultimoParteBox?.classList.remove("hidden");
    uFecha.textContent="-"; uFinal.textContent="-"; uComb.textContent="-"; uNove.textContent="-";
    chip(chipEstado, "", "Sin historial aún");
    return;
  }
  const p = s.docs[0].data();
  ultimoParteBox?.classList.remove("hidden");
  uFecha.textContent = p.fecha;
  uFinal.textContent = p.final;
  uComb.textContent  = p.combustible||"-";
  uNove.textContent  = p.novedades||"-";

  const I = (await getDoc(doc(db,"internos", interno))).data();
  const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
  const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
  const unidad = (I?.tipo==="km") ? "km" : "hs";

  if (dif >= cada) chip(chipEstado,"danger",`VENCIDO hace ${dif - cada} ${unidad}`);
  else if (dif >= Math.floor(cada*0.9)) chip(chipEstado,"warn",`PRÓXIMO — faltan ${cada-dif} ${unidad}`);
  else chip(chipEstado,"ok",`OK — faltan ${cada-dif} ${unidad}`);
});

btnGuardar?.addEventListener("click", async ()=>{
  try{
    showLoader();
    if(!usuarioActivo){ toast(msgGuardado,"err","Iniciá sesión primero."); return; }
    if(!fechaInput?.value || !internoSel?.value || !finalInput?.value){
      toast(msgGuardado,"err","Completá fecha, interno y final."); return;
    }

    const internoId = internoSel.value;
    const Idoc = await getDoc(doc(db,"internos", internoId));
    if(!Idoc.exists()){ toast(msgGuardado,"err","Interno no encontrado."); return; }
    const I = Idoc.data();

    const finalNum = Number(finalInput.value);
    const dif  = finalNum - Number(I.ultimoServiceValor || 0);
    const cada = Number(I.proximoCada || (I.tipo==="horas"?250:10000));

    let estadoService = "OK", cls = "ok";
    if (dif >= cada){ estadoService = "VENCIDO"; cls="err"; }
    else if (dif >= Math.floor(cada*0.9)){ estadoService = "PRÓXIMO"; cls="warn"; }

    await addDoc(collection(db,"partes"),{
      fecha: fechaInput.value,
      usuario: usuarioActivo.nombre,
      interno: internoId,
      final: finalNum,
      combustible: cargoSel.value==="si" ? `${litrosInput.value||0} L — ${kmCarga.value||0} km` : "No cargó combustible",
      novedades: novedades.value || "",
      estadoService, avanceDesdeService: dif, tipo: I.tipo,
      timestamp: serverTimestamp()
    });

    const unidad = (I.tipo==="km")? "km" : "hs";
    toast(msgGuardado, cls, `Parte guardado — Service: ${estadoService} (${dif}/${cada} ${unidad})`);

    finalInput.value=""; novedades.value=""; litrosInput.value=""; kmCarga.value="";
    cargoSel.value="no"; datosComb.classList.add("hidden"); datosComb2.classList.add("hidden");
  } finally {
    hideLoader();
  }
});

/****************  ADMIN: Navegación de Tabs  ****************/
tabBtns?.forEach(b=>{
  b.addEventListener("click", ()=>{
    tabBtns.forEach(x=>x.classList.remove("active"));
    b.classList.add("active");
    document.querySelectorAll(".subtab").forEach(t=>t.classList.add("hidden"));
    const target = document.getElementById(`tab-${b.dataset.tab}`);
    target?.classList.remove("hidden");
    if (b.dataset.tab === "service") initServiceLists();
  });
});

/****************  ADMIN INIT  ****************/
async function initAdmin(){
  showLoader();
  try{
    await cargarInternosCombo();
    await renderUsuarios();
    await renderInternos();
    await renderUltimos();
    await renderPartes();
    await renderServiceTabla();
    await renderSinPartes();
    await renderDashboardMetrics();
  } finally {
    hideLoader();
  }
}

/***************  ADMIN: Usuarios  ****************/
btnAddUsuario?.addEventListener("click", async ()=>{
  try{
    showLoader();
    const n = nuNombre?.value.trim(), l = nuLegajo?.value.trim(), r = nuRol?.value || "operario";
    if(!n || !l){ alert("Completá nombre y legajo."); return; }
    await addDoc(collection(db,"usuarios"), {nombre:n, legajo:l, rol:r});
    nuNombre.value=""; nuLegajo.value="";
    await renderUsuarios(); await cargarUsuariosCombo();
  } finally { hideLoader(); }
});

async function renderUsuarios(){
  if(!tablaUsuarios) return;
  tablaUsuarios.innerHTML = "";
  const s = await getDocs(collection(db,"usuarios"));
  s.forEach(d=>{
    const u = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.nombre}</td>
      <td>${u.legajo}</td>
      <td>${u.rol}</td>
      <td><button class="btn tiny danger" data-del="${d.id}"><i class="fa-solid fa-trash"></i></button></td>`;
    tablaUsuarios.appendChild(tr);
  });
  tablaUsuarios.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("¿Eliminar usuario?")) return;
      await deleteDoc(doc(db,"usuarios", b.dataset.del));
      await renderUsuarios(); await cargarUsuariosCombo();
    });
  });
}

/***************  ADMIN: Internos  ****************/
btnAddInterno?.addEventListener("click", async ()=>{
  try{
    showLoader();
    const cod = niCodigo?.value.trim();
    if(!cod){ alert("Ingresá código de interno"); return; }
    const data = {
      tipo: niTipo?.value || "horas",
      proximoCada: Number(niCada?.value || (niTipo?.value==="km"?10000:250)),
      ultimoServiceValor: Number(niUltVal?.value || 0),
      ultimoServiceFecha: niUltFec?.value || today(),
      filtros:{ aceite: niFAceite?.value || "", aire: niFAire?.value || "", combustible: niFComb?.value || "" },
      rm: niRM?.value || ""
    };
    await setDoc(doc(db,"internos", cod), data);
    niCodigo.value=""; niCada.value=""; niUltVal.value=""; niUltFec.value="";
    niFAceite.value=""; niFAire.value=""; niFComb.value=""; niRM.value="";
    await renderInternos(); await cargarInternosCombo();
  } finally { hideLoader(); }
});

async function renderInternos(){
  if(!tablaInternos) return;
  tablaInternos.innerHTML = "";
  const s = await getDocs(collection(db,"internos"));
  const mActivos = document.getElementById("mActivos");
  mActivos && (mActivos.textContent = s.size);
  s.forEach(d=>{
    const i = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${d.id}</b></td>
      <td>${i.tipo}</td>
      <td>${i.proximoCada}</td>
      <td>${i.ultimoServiceValor} (${i.ultimoServiceFecha})</td>
      <td>Aceite: ${i.filtros?.aceite||"-"} · Aire: ${i.filtros?.aire||"-"} · Comb.: ${i.filtros?.combustible||"-"}</td>
      <td>${i.rm||"-"}</td>
      <td><button class="btn tiny danger" data-del="${d.id}"><i class="fa-solid fa-trash"></i></button></td>`;
    tablaInternos.appendChild(tr);
  });
  tablaInternos.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("¿Eliminar interno? (No borra partes)")) return;
      await deleteDoc(doc(db,"internos", b.dataset.del));
      await renderInternos(); await cargarInternosCombo();
    });
  });
}

/***************  ADMIN: Partes  ****************/
async function renderUltimos(){
  if(!tablaUltimos) return;
  tablaUltimos.innerHTML="";
  const qs = query(collection(db,"partes"), orderBy("timestamp","desc"), limit(5));
  const s = await getDocs(qs);
  for (const d of s.docs){
    const p = d.data();
    const I = (await getDoc(doc(db,"internos", p.interno))).data();
    const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
    const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
    const tipo = I?.tipo || "horas";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.fecha}</td><td>${p.usuario}</td><td>${p.interno}</td><td>${p.final}</td><td>${badgeEstado(dif,cada,tipo)}</td>`;
    tablaUltimos.appendChild(tr);
  }
  if (document.getElementById("mUltimo") && s.size>0) document.getElementById("mUltimo").textContent = s.docs[0].data().fecha;
}

async function renderPartes(){
  if(!tablaPartes) return;
  tablaPartes.innerHTML="";
  const qs = query(collection(db,"partes"), orderBy("timestamp","desc"));
  const s = await getDocs(qs);
  for(const d of s.docs){
    const p = d.data();
    const I = (await getDoc(doc(db,"internos", p.interno))).data();
    const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
    const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
    const tipo = I?.tipo || "horas";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.fecha}</td><td>${p.usuario}</td><td>${p.interno}</td><td>${p.final}</td>
      <td>${p.combustible||"-"}</td><td>${p.novedades||"-"}</td>
      <td>${badgeEstado(dif,cada,tipo)}</td>
      <td><button class="btn tiny danger" data-del="${d.id}"><i class="fa-solid fa-trash"></i></button></td>`;
    tablaPartes.appendChild(tr);
  }
  tablaPartes.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", async ()=>{
      if(!confirm("¿Eliminar parte?")) return;
      await deleteDoc(doc(db,"partes", b.dataset.del));
      await renderPartes(); await renderUltimos(); await renderSinPartes();
    });
  });
}

/***************  ADMIN: Services  ****************/
function createFilterRow(){
  const row = document.createElement("div");
  row.className = "filter-row";
  row.innerHTML = `
    <input class="input" type="text" placeholder="Tipo (opc.)">
    <input class="input" type="text" placeholder="Código">
    <button type="button" class="btn-icon" title="Quitar">×</button>`;
  row.querySelector(".btn-icon").addEventListener("click",()=> row.remove());
  return row;
}
function ensureOneRow(listEl){ if (listEl && listEl.querySelectorAll(".filter-row").length===0) listEl.appendChild(createFilterRow()); }
function collectRows(listEl){
  if (!listEl) return [];
  return [...listEl.querySelectorAll(".filter-row")].map(r=>{
    const [tipo,codigo]= r.querySelectorAll("input");
    return {tipo:(tipo?.value||"").trim(), codigo:(codigo?.value||"").trim()};
  }).filter(x=>x.tipo || x.codigo);
}
function clearList(listEl){ if(!listEl) return; listEl.innerHTML=""; ensureOneRow(listEl); }
function initServiceLists(){ Object.values(SVC).forEach(g=> ensureOneRow(g.list)); }
Object.values(SVC).forEach(g=> g.add?.addEventListener("click", ()=> g.list.appendChild(createFilterRow())));

btnAddService?.addEventListener("click", async ()=>{
  try{
    showLoader();
    if(!svInterno?.value || !svFecha?.value || !svValor?.value){
      alert("Completá interno, fecha y valor."); return;
    }
    const internoId = svInterno.value;
    const val       = Number(svValor.value);
    const I         = (await getDoc(doc(db,"internos", internoId))).data() || {};

    const filtros = {
      aceite:       collectRows(SVC.aceite.list),
      airePrimario: collectRows(SVC.airep.list),
      aireSecundario: collectRows(SVC.aires.list),
      combustible:  collectRows(SVC.comb.list),
      habitaculo:   collectRows(SVC.hab.list),
      hidraulico:   collectRows(SVC.hid.list),
    };
    const aceiteUsado = { tipo:(svAceiteTipo?.value||"").trim(), litros:Number(svAceiteLitros?.value||0) };
    const rmTxt = (svRM?.value||"").trim();

    await addDoc(collection(db,"services"),{
      interno: internoId, fecha: svFecha.value, valorService: val, tipo: I?.tipo || "horas",
      filtros, aceite: aceiteUsado, rm: rmTxt, notas: "Service registrado", timestamp: serverTimestamp()
    });

    await setDoc(doc(db,"internos", internoId), { ...I, ultimoServiceValor: val, ultimoServiceFecha: svFecha.value, ...(rmTxt?{rm:rmTxt}:{}) });

    svValor.value=""; svAceiteTipo.value=""; svAceiteLitros.value=""; svRM.value="";
    Object.values(SVC).forEach(g=> clearList(g.list));

    await renderServiceTabla(); await renderInternos(); await renderPartes(); await renderUltimos();
  } finally { hideLoader(); }
});

function resumenFiltros(f){
  if(!f) return "-";
  const pick = (x)=> x && (x.tipo || x.codigo) ? `${x.tipo||""}${x.tipo&&x.codigo?" – ":""}${x.codigo||""}` : "";
  const items = [
    ...(f.aceite||[]).map(x=>"Aceite: "+pick(x)),
    ...(f.airePrimario||[]).map(x=>"Aire P: "+pick(x)),
    ...(f.aireSecundario||[]).map(x=>"Aire S: "+pick(x)),
    ...(f.combustible||[]).map(x=>"Comb.: "+pick(x)),
    ...(f.habitaculo||[]).map(x=>"Habit.: "+pick(x)),
    ...(f.hidraulico||[]).map(x=>"Hidr.: "+pick(x)),
  ].filter(Boolean);
  return items.length ? items.join(" · ") : "-";
}
async function renderServiceTabla(){
  if(!tablaService) return;
  tablaService.innerHTML="";
  const qs = query(collection(db,"services"), orderBy("timestamp","desc"), limit(80));
  const s = await getDocs(qs);
  s.forEach(d=>{
    const x = d.data();
    const aceiteTxt = (x.aceite && (x.aceite.tipo || x.aceite.litros))
      ? `${x.aceite.tipo||""}${x.aceite.tipo && x.aceite.litros ? " – " : ""}${x.aceite.litros? (x.aceite.litros+" L"):""}`
      : "-";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${x.fecha}</td><td>${x.interno}</td><td>${x.valorService}</td><td>${x.tipo}</td><td>${resumenFiltros(x.filtros)}</td><td>${aceiteTxt}</td><td>${x.rm||x.notas||"-"}</td>`;
    tablaService.appendChild(tr);
  });
}

/***************  ADMIN: Sin Partes  ****************/
async function renderSinPartes(){
  const targets = [listaSinPartes, listaSinPartes2].filter(Boolean);
  for (const ul of targets) ul.innerHTML="";
  const ints = await getDocs(collection(db,"internos"));
  const cinco = 5*24*60*60*1000, now = Date.now();

  for(const i of ints.docs){
    const interno = i.id;
    const qs = query(collection(db,"partes"), where("interno","==", interno), orderBy("timestamp","desc"), limit(1));
    const s = await getDocs(qs);
    if (s.empty){
      targets.forEach(ul=> ul.insertAdjacentHTML("beforeend", `<li class="chip">${interno} — <span class="muted">sin partes recientes</span></li>`));
      continue;
    }
    const ts = s.docs[0].data().timestamp?.toMillis?.() || Date.parse(s.docs[0].data().fecha);
    if (!ts || (now - ts) >= cinco){
      const days = Math.floor((now - ts)/(24*60*60*1000));
      targets.forEach(ul=> ul.insertAdjacentHTML("beforeend", `<li class="chip">${interno} — <span class="muted">sin partes hace ${days} días</span></li>`));
    }
  }
}

/***************  ADMIN: Métricas  ****************/
async function renderDashboardMetrics(){
  const mProx = document.getElementById("mProx");
  const mMant = document.getElementById("mMant");
  const ints = await getDocs(collection(db,"internos"));
  let proximos = 0;
  for(const i of ints.docs){
    const I = i.data();
    const qs = query(collection(db,"partes"), where("interno","==", i.id), orderBy("timestamp","desc"), limit(1));
    const s = await getDocs(qs);
    if (s.empty) continue;
    const p = s.docs[0].data();
    const dif  = Number(p.final) - Number(I?.ultimoServiceValor || 0);
    const cada = Number(I?.proximoCada || (I?.tipo==="horas"?250:10000));
    if (dif >= Math.floor(cada*0.9)) proximos++;
  }
  mProx && (mProx.textContent = proximos);
  mMant && (mMant.textContent = "—");
}

/****************  BOOT  ****************/
(async function boot(){
  showLoader();
  try{
    await ensureSeeds();
    await cargarUsuariosCombo();
    fechaInput && (fechaInput.value = today());

    const saved = localStorage.getItem("usuarioActivo");
    if (saved){
      const u = JSON.parse(saved);
      usuarioSel && (usuarioSel.value = JSON.stringify(u));
      legajoInput && (legajoInput.value = u.legajo);
      btnLogin?.click();
    }
  } finally {
    hideLoader();
  /****************  BOTONES DE SALIR  ****************/
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  usuarioActivo = null;
  // Ocultar todo y volver al login
  formSection.classList.add("hidden");
  adminSection.classList.add("hidden");
  sidebar.classList.add("hidden");
  topbar.classList.add("hidden");
  loginSection.classList.remove("hidden");
  // Limpiar campos
  legajoInput.value = "";
  usuarioSel.value = "";
}

btnSalir?.addEventListener("click", cerrarSesion);
btnSalirAdmin?.addEventListener("click", cerrarSesion);

  }
})();

// ⏳ Ocultar loader automáticamente si tarda más de 2 segundos
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = "0";
      loader.style.pointerEvents = "none";
      setTimeout(() => loader.style.display = "none", 300);
    }, 1200); // 1.2 segundos
  }
});
