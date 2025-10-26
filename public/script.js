/****************  FIREBASE  ****************/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, setDoc, doc, getDoc, getDocs,
  deleteDoc, query, orderBy, limit, where, serverTimestamp, onSnapshot
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
const appLoader     = document.getElementById("appLoader");

const loginSection  = document.getElementById("login-section");
const formSection   = document.getElementById("form-section");
const adminSection  = document.getElementById("admin-section");

const usuarioSel    = document.getElementById("usuario");
const legajoInput   = document.getElementById("legajo");
const btnLogin      = document.getElementById("btnLogin");
const errorLogin    = document.getElementById("errorLogin");
const msgNoUsers    = document.getElementById("msgNoUsers");

const btnSalir      = document.getElementById("btnSalir");
const btnSalirAdmin = document.getElementById("btnSalirAdmin");

const userActive    = document.getElementById("userActive");
const fechaInput    = document.getElementById("fecha");
const internoSel    = document.getElementById("interno");
const finalInput    = document.getElementById("final");
const cargoSel      = document.getElementById("cargoCombustible");
const datosComb     = document.getElementById("datosCombustible");
const datosComb2    = document.getElementById("datosCombustible2");
const litrosInput   = document.getElementById("litros");
const kmCarga       = document.getElementById("kmCarga");
const novedades     = document.getElementById("novedades");
const btnGuardar    = document.getElementById("btnGuardar");
const msgGuardado   = document.getElementById("msgGuardado");
const chipEstado    = document.getElementById("estadoServiceChip");

const ultimoParteBox = document.getElementById("ultimoParte");
const uFecha  = document.getElementById("uFecha");
const uFinal  = document.getElementById("uFinal");
const uComb   = document.getElementById("uCombustible");
const uNove   = document.getElementById("uNovedades");

const tabBtns        = document.querySelectorAll(".tab-btn");
const tablaUltimos   = document.getElementById("tablaUltimos");
const tablaUsuarios  = document.getElementById("tablaUsuarios");
const tablaInternos  = document.getElementById("tablaInternos");
const tablaPartes    = document.getElementById("tablaPartes");
const tablaService   = document.getElementById("tablaService");
const listaSinPartes = document.getElementById("listaSinPartes");
const listaSinPartes2= document.getElementById("listaSinPartes2");
const sidebar        = document.getElementById("sidebar");
const topbar         = document.getElementById("topbar");

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
const ENABLE_SEEDS = false; // dejalo en false en producción
async function ensureSeeds(){
  if(!ENABLE_SEEDS) return;

  const cu = await getDocs(collection(db,"usuarios"));
  if (cu.empty){
    await addDoc(collection(db,"usuarios"), {nombre:"admin",              legajo:"000", rol:"admin"});
    await addDoc(collection(db,"usuarios"), {nombre:"Operario Demo",      legajo:"123", rol:"operario"});
  }
  const ci = await getDocs(collection(db,"internos"));
  if (ci.empty){
    const base = today();
    await setDoc(doc(db,"internos","TR-512"),{tipo:"horas", proximoCada:250,   ultimoServiceValor:300,    ultimoServiceFecha:base, filtros:{aceite:"F-AC-001", aire:"F-AI-100", combustible:"F-CO-200"}, rm:"RM-TR512"});
    await setDoc(doc(db,"internos","C-185"), {tipo:"km",    proximoCada:10000, ultimoServiceValor:84000,  ultimoServiceFecha:base, filtros:{aceite:"F-AC-011", aire:"F-AI-101", combustible:"F-CO-210"}, rm:"RM-C185"});
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

//****************  LOGIN CON ROLES (oculta secciones según rol) ****************/
btnLogin.addEventListener("click", async () => {
  errorLogin.textContent = "";
  if (!usuarioSel.value || !legajoInput.value) {
    errorLogin.textContent = "Elegí un usuario y cargá el legajo.";
    return;
  }

  const u = JSON.parse(usuarioSel.value);
  if (u.legajo !== legajoInput.value) {
    errorLogin.textContent = "Legajo incorrecto.";
    return;
  }

  usuarioActivo = u;
  localStorage.setItem("usuarioActivo", JSON.stringify(u));

  // Limpio interfaz base
  sidebar.classList.add("hidden");
  topbar.classList.add("hidden");
  formSection.classList.add("hidden");
  adminSection.classList.add("hidden");
  loginSection.classList.add("hidden");

  const rol = (u.rol || "").toLowerCase();
  userActive.textContent = u.nombre;


  if (rol === "admin" || rol === "administrativo") {
    // 🧭 ADMINISTRATIVO: acceso total
    document.body.classList.add("admin-active");
    sidebar.classList.remove("hidden");
    topbar.classList.remove("hidden");
    adminSection.classList.remove("hidden");
    await initAdmin();

  } else if (rol === "logistica") {
  // 🚛 LOGÍSTICA: acceso a todo excepto Usuarios y Service
  document.body.classList.add("admin-active");
  sidebar.classList.remove("hidden");
  topbar.classList.remove("hidden");
  adminSection.classList.remove("hidden");
  await initAdmin();

  // Esperar un instante para asegurar que el DOM esté renderizado
  setTimeout(() => {
    // Ocultar pestañas y secciones no permitidas
    const btnUsuarios = document.querySelector('[data-tab="usuarios"]');
    const tabUsuarios = document.getElementById("tab-usuarios");
    const btnService  = document.querySelector('[data-tab="service"]');
    const tabService  = document.getElementById("tab-service");

    if (btnUsuarios) btnUsuarios.remove();
    if (tabUsuarios) tabUsuarios.remove();
    if (btnService) btnService.remove();
    if (tabService) tabService.remove();

    // Bloquea el acceso por función
    const originalShowTab = window.showTab;
    window.showTab = (tabId) => {
      if (["usuarios", "service"].includes(tabId)) {
        alert("No tenés permiso para acceder a esta sección.");
        return;
      }
      if (typeof originalShowTab === "function") originalShowTab(tabId);
    };
  }, 200);


  } else {
    // 👷 OPERARIO: solo parte diario
    document.body.classList.remove("admin-active");
    sidebar.classList.add("hidden");
    topbar.classList.add("hidden");
    formSection.classList.remove("hidden");
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
    if (b.dataset.tab === "dashboard") renderDashboardMetrics(); // mantiene compatibilidad
  });
});
// === ACTIVAR INICIALIZACIÓN DEL MÓDULO DE COMBUSTIBLE ===
tabBtns?.forEach(b=>{
  b.addEventListener("click", async ()=>{
    if (b.dataset.tab === "combustible") {
      if (!window._combustibleIniciado) {
        await initCombustible();
        window._combustibleIniciado = true; // solo la primera vez
        console.log("✅ Módulo Combustible inicializado");
      }
    }
  });
});


/****************  ADMIN INIT  ****************/
async function initAdmin() {
  showLoader();
  try {
    await cargarInternosCombo();
    await renderUsuarios();
    await renderInternos();
    await renderUltimos();
    await renderPartes();
    await renderServiceTabla();
    await renderSinPartes();
    await liveDashboardMetrics();

    // 🔹 Ocultar todas las tabs
    document.querySelectorAll(".subtab").forEach(t => t.classList.add("hidden"));
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));

    // 🔹 Mostrar solo el panel neutro
    const neutral = document.getElementById("tab-neutral");
    if (neutral) neutral.classList.remove("hidden");

    // 🔹 Asegurar que Combustible quede oculto
    const comb = document.getElementById("tab-combustible");
    if (comb) comb.classList.add("hidden");

    // Mostrar barra superior y sidebar
    document.getElementById("topbar")?.classList.remove("hidden");
    document.getElementById("sidebar")?.classList.remove("hidden");

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
    await renderInternos(); await cargarInternosCombo(); await renderDashboardMetrics();
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
      await renderInternos(); await cargarInternosCombo(); await renderDashboardMetrics();
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
      await renderPartes(); await renderUltimos(); await renderSinPartes(); await renderDashboardMetrics();
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

    await renderServiceTabla(); await renderInternos(); await renderPartes(); await renderUltimos(); await renderDashboardMetrics();
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
async function renderServiceTabla() {
  if (!tablaService) return;
  tablaService.innerHTML = "";
  const qs = query(collection(db, "services"), orderBy("timestamp", "desc"), limit(80));
  const s = await getDocs(qs);

  s.forEach(d => {
    const x = d.data();
    const id = d.id;

    const aceiteTxt = (x.aceite && (x.aceite.tipo || x.aceite.litros))
      ? `${x.aceite.tipo || ""}${x.aceite.tipo && x.aceite.litros ? " – " : ""}${x.aceite.litros ? (x.aceite.litros + " L") : ""}`
      : "-";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${x.fecha}</td>
      <td>${x.interno}</td>
      <td>${x.valorService}</td>
      <td>${x.tipo}</td>
      <td>${resumenFiltros(x.filtros)}</td>
      <td>${aceiteTxt}</td>
      <td>${x.rm || x.notas || "-"}</td>
      <td><button class="btn tiny danger" data-del="${id}"><i class="fa-solid fa-trash"></i></button></td>
    `;
    tablaService.appendChild(tr);
  });

  tablaService.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar este service?")) return;
      const id = btn.dataset.del;
      await deleteDoc(doc(db, "services", id));
      await renderServiceTabla();
      await renderInternos(); await renderDashboardMetrics();
    });
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
    const qs = query(collection(db,"partes"), where("interno","==", interno));
    const s = await getDocs(qs);
    if (s.empty){
      targets.forEach(ul=> ul.insertAdjacentHTML("beforeend", `<li class="chip">${interno} — <span class="muted">sin partes recientes</span></li>`));
      continue;
    }
    // elegir el último en memoria (evita índice compuesto)
    const last = s.docs
      .map(d=> d.data())
      .sort((a,b)=> (b.timestamp?.toMillis?.() || Date.parse(b.fecha||0)) - (a.timestamp?.toMillis?.() || Date.parse(a.fecha||0)))[0];

    const ts = last?.timestamp?.toMillis?.() || Date.parse(last?.fecha||"");
    if (!ts || (now - ts) >= cinco){
      const days = Math.floor((now - ts)/(24*60*60*1000));
      targets.forEach(ul=> ul.insertAdjacentHTML("beforeend", `<li class="chip">${interno} — <span class="muted">sin partes hace ${days} días</span></li>`));
    }
  }
}

/***************  ADMIN: Dashboard en vivo ****************/
/***************  ADMIN: Dashboard en vivo ****************/
// Versión final con todos los datos de service y estado
async function liveDashboardMetrics() {
  const mActivos  = document.getElementById("mActivos");
  const mProx     = document.getElementById("mProx");
  const mVencidos = document.getElementById("mVencidos");
  const grid      = document.getElementById("dashboardCards");
  if (!grid) return;

  grid.innerHTML = `<div class="dash-card none">Cargando estado...</div>`;

  try {
    const internosSnap = await getDocs(collection(db, "internos"));
    if (internosSnap.empty) {
      grid.innerHTML = `<div class="dash-card none">No hay internos cargados</div>`;
      if (mActivos) mActivos.textContent = "0";
      if (mProx) mProx.textContent = "0";
      if (mVencidos) mVencidos.textContent = "0";
      return;
    }

    grid.innerHTML = "";
    let proximos = 0, vencidos = 0;

    const tasks = internosSnap.docs.map(async (docSnap)=>{
      const I = docSnap.data();
      const interno = docSnap.id;

      // Último parte registrado
      let pUlt = null;
      try {
        const partsSnap = await getDocs(query(collection(db, "partes"), where("interno","==", interno)));
        if (!partsSnap.empty) {
          pUlt = partsSnap.docs
            .map(d=> d.data())
            .sort((a,b)=> (b.timestamp?.toMillis?.() || Date.parse(b.fecha||0)) - (a.timestamp?.toMillis?.() || Date.parse(a.fecha||0)))[0];
        }
      } catch {}

      // Variables base
      let estado = "none";
      let texto  = "Sin parte";
      let info1  = "";
      let info2  = "";
      let info3  = "";

      // Si no hay registro de service, avisamos directamente
      if (!I?.ultimoServiceValor || !I?.ultimoServiceFecha) {
        estado = "none";
        texto = "Sin service registrado";
        const card = document.createElement("div");
        card.className = `dash-card ${estado}`;
        card.innerHTML = `
          <h4>${interno}</h4>
          <div>${texto}</div>
          <div class="muted small">—</div>
        `;
        grid.appendChild(card);
        return;
      }

      // Si tiene datos de service
      const tipo = I.tipo || "horas";
      const cada = Number(I.proximoCada || (tipo === "km" ? 10000 : 250));
      const ultValor = Number(I.ultimoServiceValor || 0);
      const proxValor = ultValor + cada;
      const unidad = tipo === "km" ? "km" : "hs";

      if (pUlt) {
        const actual = Number(pUlt.final);
        const dif = actual - ultValor;
        const rest = Math.max(0, proxValor - actual);

        info1 = `${tipo === "km" ? "Km actuales" : "Horas actuales"}: ${actual}`;
        info2 = `Próximo service: ${proxValor} ${unidad}`;
        info3 = `Último service: ${I.ultimoServiceFecha}`;

        if (dif >= cada) {
          estado = "danger";
          texto = `VENCIDO hace ${dif - cada} ${unidad}`;
          vencidos++;
        } else if (dif >= Math.floor(cada * 0.9)) {
          estado = "warn";
          texto = `PRÓXIMO — faltan ${rest} ${unidad}`;
          proximos++;
        } else {
          estado = "ok";
          texto = `OK — faltan ${rest} ${unidad}`;
        }
      } else {
        texto = "Sin parte cargado aún";
        info1 = `Próximo service: ${proxValor} ${unidad}`;
        info3 = `Último service: ${I.ultimoServiceFecha}`;
      }

      const card = document.createElement("div");
      card.className = `dash-card ${estado}`;
      card.innerHTML = `
        <h4>${interno}</h4>
        <div>${texto}</div>
        <div class="muted small">${info1}</div>
        <div class="muted small">${info2}</div>
        <div class="muted small">${info3}</div>
      `;
      grid.appendChild(card);
    });

    await Promise.all(tasks);

    if (mActivos)  mActivos.textContent  = internosSnap.size;
    if (mProx)     mProx.textContent     = proximos;
    if (mVencidos) mVencidos.textContent = vencidos;

    grid.style.display = "grid";
  } catch (e) {
    console.error("Dashboard error:", e);
    grid.innerHTML = `<div class="dash-card danger">Error al cargar el dashboard</div>`;
  }
}



// Wrapper para compatibilidad con llamadas existentes
function renderDashboardMetrics(){ liveDashboardMetrics(); }

/****************  BOOT + SALIR  ****************/
function cerrarSesion() {
  localStorage.removeItem("usuarioActivo");
  usuarioActivo = null;
  formSection.classList.add("hidden");
  adminSection.classList.add("hidden");
  sidebar.classList.add("hidden");
  topbar.classList.add("hidden");
  loginSection.classList.remove("hidden");
  legajoInput.value = "";
  usuarioSel.value = "";
}
btnSalir?.addEventListener("click", cerrarSesion);
btnSalirAdmin?.addEventListener("click", cerrarSesion);

(async function boot(){
  showLoader();
  try{
    await ensureSeeds();
    await cargarUsuariosCombo();

    const saved = localStorage.getItem("usuarioActivo");
    if (saved){
      const u = JSON.parse(saved);
      usuarioSel && (usuarioSel.value = JSON.stringify(u));
      legajoInput && (legajoInput.value = u.legajo);
      btnLogin?.click();
    }
  } finally {
    hideLoader();
  }
})();

// Ocultar loader con retardo suave
window.addEventListener("load", () => {
  const loader = document.getElementById("appLoader");
  if (loader) {
    setTimeout(() => {
      loader.style.opacity = "0";
      loader.style.pointerEvents = "none";
      setTimeout(() => loader.classList.add("hidden"), 300);
    }, 800);
  }
});
/* ========================= COMBUSTIBLE (v1.2.3) ========================= */
let ccInterno, ccFecha, ccChofer, ccKm, ccLitros, ccTipo, ccOrigen, ccObs, ccMsg, ccTablaBody;
let gridInterno, gridChofer, btnCombustibleRefresh;

function qs(id) { return document.getElementById(id); }

function initCombustibleUIRefs() {
  ccInterno = qs("cc-interno");
  ccFecha   = qs("cc-fecha");
  ccChofer  = qs("cc-chofer");
  ccKm      = qs("cc-km");
  ccLitros  = qs("cc-litros");
  ccTipo    = qs("cc-tipo");
  ccOrigen  = qs("cc-origen");
  ccObs     = qs("cc-obs");
  ccMsg     = qs("cc-msg");
  ccTablaBody = qs("cc-tabla")?.querySelector("tbody");
  gridInterno = qs("grid-interno");
  gridChofer  = qs("grid-chofer");
  btnCombustibleRefresh = qs("btnCombustibleRefresh");
}

/* ===== COMBOS ===== */
async function cargarInternosEnCombustible() {
  if (!ccInterno) return;
  ccInterno.innerHTML = `<option value="">-- Seleccioná un interno --</option>`;
  const snap = await getDocs(collection(db, "internos"));
  snap.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = d.id;
    ccInterno.appendChild(opt);
  });
}

async function cargarChoferesEnCombustible() {
  if (!ccChofer) return;

  // Limpia el combo y agrega una opción inicial
  ccChofer.innerHTML = `<option value="">-- Seleccioná un chofer --</option>`;

  try {
    const snap = await getDocs(collection(db, "usuarios"));

    if (snap.empty) {
      const opt = document.createElement("option");
      opt.textContent = "⚠️ No hay usuarios cargados";
      opt.disabled = true;
      ccChofer.appendChild(opt);
      return;
    }

    // Cargar todos los nombres (sin mostrar rol)
    snap.forEach((d) => {
      const u = d.data();
      const opt = document.createElement("option");
      opt.value = u.nombre;
      opt.textContent = u.nombre;
      ccChofer.appendChild(opt);
    });
  } catch (error) {
    console.error("Error al cargar choferes:", error);
  }
}


/* ===== AGREGAR CARGA ===== */
async function addCargaCombustible() {
  if (!ccInterno.value || !ccFecha.value || !ccLitros.value) {
    ccMsg.textContent = "Completá Interno, Fecha y Litros.";
    ccMsg.style.color = "red";
    return;
  }
  const payload = {
    interno: ccInterno.value,
    fecha: ccFecha.value,
    chofer: ccChofer.value,
    km: Number(ccKm.value || 0),
    litros: Number(ccLitros.value || 0),
    tipo: ccTipo.value,
    origen: ccOrigen.value,
    obs: ccObs.value,
    timestamp: serverTimestamp(),
  };
  await addDoc(collection(db, "cargasCombustible"), payload);
  ccMsg.textContent = "Carga guardada correctamente ✅";
  ccMsg.style.color = "green";
  renderTablaCargas();
  loadConsumoInterno("mes");
  loadConsumoChofer("mes");
}

/* ===== TABLA ===== */
async function renderTablaCargas() {
  if (!ccTablaBody) return;
  ccTablaBody.innerHTML = "";

  const q = query(collection(db, "cargasCombustible"), orderBy("timestamp", "desc"), limit(50));
  const snap = await getDocs(q);

  snap.forEach(d => {
    const c = d.data();
    const id = d.id; // 🔹 Importante: necesitamos el ID del documento
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${c.fecha}</td>
      <td>${c.interno}</td>
      <td>${c.chofer}</td>
      <td>${c.km}</td>
      <td>${c.litros}</td>
      <td>${c.tipo}</td>
      <td>${c.origen}</td>
      <td>${c.obs || "-"}</td>
      <td>
        <button class="btn tiny edit" data-id="${id}">✏️</button>
        <button class="btn tiny danger" data-del="${id}">🗑️</button>
      </td>
    `;

    ccTablaBody.appendChild(tr);
  });

  // 🟢 BOTÓN ELIMINAR
  ccTablaBody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar esta carga de combustible?")) return;
      await deleteDoc(doc(db, "cargasCombustible", btn.dataset.del));
      renderTablaCargas(); // refrescar tabla
      ccMsg.textContent = "Carga eliminada correctamente ✅";
      ccMsg.style.color = "green";
    });
  });

  // 🟢 BOTÓN EDITAR
  ccTablaBody.querySelectorAll("[data-id]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const docRef = doc(db, "cargasCombustible", id);
      const dSnap = await getDoc(docRef);
      if (!dSnap.exists()) return;

      const c = dSnap.data();

      // Llenamos el formulario con los valores actuales
      ccInterno.value = c.interno || "";
      ccFecha.value   = c.fecha || "";
      ccChofer.value  = c.chofer || "";
      ccKm.value      = c.km || "";
      ccLitros.value  = c.litros || "";
      ccTipo.value    = c.tipo || "";
      ccOrigen.value  = c.origen || "";
      ccObs.value     = c.obs || "";

      ccMsg.textContent = "Editando registro. Guardá para actualizar.";
      ccMsg.style.color = "orange";

      // Cambiamos el comportamiento del botón guardar
      const btnGuardar = document.getElementById("btnGuardarCarga");
      btnGuardar.textContent = "Actualizar carga";
      btnGuardar.onclick = async () => {
        const payload = {
          interno: ccInterno.value,
          fecha: ccFecha.value,
          chofer: ccChofer.value,
          km: Number(ccKm.value || 0),
          litros: Number(ccLitros.value || 0),
          tipo: ccTipo.value,
          origen: ccOrigen.value,
          obs: ccObs.value,
          timestamp: serverTimestamp(),
        };
        await setDoc(docRef, payload);
        ccMsg.textContent = "Carga actualizada ✅";
        ccMsg.style.color = "green";
        btnGuardar.textContent = "Guardar carga";
        btnGuardar.onclick = addCargaCombustible; // restauramos acción original
        renderTablaCargas();
      };
    });
  });
}


/* ===== FUNCIONES AUXILIARES ===== */
function groupBy(arr, key) {
  const map = new Map();
  arr.forEach(it => {
    const k = it[key] || "";
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(it);
  });
  return map;
}
function sum(arr, key) { return arr.reduce((a, b) => a + Number(b[key] || 0), 0); }

let currentRangeInterno = "mes";
let currentRangeChofer = "mes";

function rangoFechas(range) {
  const hoy = new Date();
  let desde, hasta = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59);

  range = range.toLowerCase().trim();

  if (range.includes("semana")) {
    desde = new Date(hoy);
    desde.setDate(hoy.getDate() - 7);
  } else if (range.includes("mes")) {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
  } else {
    desde = new Date(2000, 0, 1);
  }

  // Normalizamos horas para evitar errores de comparación
  desde.setHours(0, 0, 0, 0);
  hasta.setHours(23, 59, 59, 999);
  return { desde, hasta };
}


/* ===== CONSUMO POR INTERNO ===== */
async function loadConsumoInterno(range) {
  currentRangeInterno = range;
  gridInterno.innerHTML = "";
  const { desde, hasta } = rangoFechas(range);
  const snap = await getDocs(collection(db, "cargasCombustible"));
  const registros = [];
  snap.forEach(d => {
    const c = d.data();
    const f = new Date(c.fecha);
    if (range === "total" || (f >= desde && f <= hasta)) registros.push(c);
  });

  const byInt = groupBy(registros, "interno");

  byInt.forEach((items, interno) => {
    // solo válidas
    const cargas = items.filter(i => i.km > 0 && i.litros > 0);
    if (cargas.length < 2) return;

    // ordenar por KM ascendente
    cargas.sort((a, b) => a.km - b.km);

    const ultima = cargas[cargas.length - 1];
    const penultima = cargas[cargas.length - 2];

    const kmRecorridos = ultima.km - penultima.km;
    const litrosConsumidos = ultima.litros;
    const prom = kmRecorridos > 0 ? (litrosConsumidos / kmRecorridos) * 100 : null;

    const litrosTot = sum(cargas, "litros");

    const card = document.createElement("div");
    card.className = "dash-card";
    card.innerHTML = `
      <h4>${interno}</h4>
      <small>Última carga: ${ultima?.fecha || "-"}</small>
      <div>Promedio: ${prom ? prom.toFixed(2) + " L/100 km" : "—"}</div>
      <div>Total cargado: ${litrosTot.toFixed(0)} L</div>
    `;
    gridInterno.appendChild(card);
  });
}

/* ===== CONSUMO POR CHOFER ===== */
async function loadConsumoChofer(range) {
  currentRangeChofer = range;
  gridChofer.innerHTML = "";
  const { desde, hasta } = rangoFechas(range);
  const snap = await getDocs(collection(db, "cargasCombustible"));
  const registros = [];
  snap.forEach(d => {
    const c = d.data();
    const f = new Date(c.fecha);
    if (range === "total" || (f >= desde && f <= hasta)) registros.push(c);
  });

  const byCh = groupBy(registros, "chofer");
  for (const [chofer, items] of byCh.entries()) {
    const cargas = items.filter(i => i.km > 0 && i.litros > 0);
    if (cargas.length < 2) continue;
    cargas.sort((a, b) => a.km - b.km);

    const ultima = cargas[cargas.length - 1];
    const penultima = cargas[cargas.length - 2];
    const kmRecorridos = ultima.km - penultima.km;
    const litrosConsumidos = ultima.litros;
    const prom = kmRecorridos > 0 ? (litrosConsumidos / kmRecorridos) * 100 : null;
    const litrosTot = sum(cargas, "litros");

    const card = document.createElement("div");
    card.className = "dash-card";
    card.innerHTML = `
      <h4>${chofer || "(sin chofer)"}</h4>
      <small>Última carga: ${ultima?.fecha || "-"}</small>
      <div>Promedio: ${prom ? prom.toFixed(2) + " L/100 km" : "—"}</div>
      <div>Total cargado: ${litrosTot.toFixed(0)} L</div>
    `;
    gridChofer.appendChild(card);
  }
}

/* ===== INIT ===== */
async function initCombustible() {
  initCombustibleUIRefs();
  await cargarInternosEnCombustible();
  await cargarChoferesEnCombustible();
  document.getElementById("btnGuardarCarga")?.addEventListener("click", addCargaCombustible);
  btnCombustibleRefresh?.addEventListener("click", () => {
    renderTablaCargas();
    loadConsumoInterno(currentRangeInterno);
    loadConsumoChofer(currentRangeChofer);
  });
  renderTablaCargas();
  loadConsumoInterno("mes");
  loadConsumoChofer("mes");
    initCombustibleTabs();

}

/* ===== SUBTABS (Solapas de Combustible) ===== */
function bindCombustibleSubtabs() {
  const buttons = document.querySelectorAll(".subtab-btn");
  const contents = document.querySelectorAll(".subtab-content");
  if (!buttons.length || !contents.length) return;

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Quitar estado activo de todos los botones
      buttons.forEach((b) => b.classList.remove("active"));
      // Ocultar todos los contenidos
      contents.forEach((c) => c.classList.add("hidden"));
      // Activar el botón actual
      btn.classList.add("active");
      // Mostrar la vista correspondiente
      const targetId = btn.dataset.subtab;
      const targetEl = document.getElementById("subtab-" + targetId);
      if (targetEl) targetEl.classList.remove("hidden");
    });
  });
}

// Ejecutar al iniciar el módulo
function initCombustibleTabs() {
  bindCombustibleSubtabs();
  // Asegura que la primera pestaña se vea al inicio
  const firstBtn = document.querySelector(".subtab-btn");
  if (firstBtn) firstBtn.click();
}

/* ======== NAVEGACIÓN ENTRE SUBTABS DE COMBUSTIBLE ======== */
document.querySelectorAll(".subtab-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    // Quitar clase "active" de todos los botones
    document.querySelectorAll(".subtab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Ocultar todos los contenidos de subtabs
    document.querySelectorAll(".subtab-content").forEach(c => c.classList.add("hidden"));

    // Mostrar el contenido correspondiente
    const targetId = "subtab-" + btn.dataset.subtab;
    const targetEl = document.getElementById(targetId);
    if (targetEl) targetEl.classList.remove("hidden");

    // Si cambian a las secciones de resumen, actualizar datos
    if (btn.dataset.subtab === "interno") await loadConsumoInterno(currentRangeInterno);
    if (btn.dataset.subtab === "chofer") await loadConsumoChofer(currentRangeChofer);
  });
});

/* ======== FILTROS DE RANGO ======== */
document.querySelectorAll(".filter-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    const range = btn.dataset.range;
    const parent = btn.closest(".filters-buttons");
    if (!parent) return;

    // Quitar "active" de todos los botones del grupo
    parent.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Ver qué sección estamos viendo (interno o chofer)
    const section = btn.closest(".subtab-content");
    if (section && section.id === "subtab-interno") await loadConsumoInterno(range);
    if (section && section.id === "subtab-chofer") await loadConsumoChofer(range);
  });
});



console.log("✅ Módulo Combustible actualizado (v1.2.3)");
