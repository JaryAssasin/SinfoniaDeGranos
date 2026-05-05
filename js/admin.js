// ═══════════════════════════════════════════════════════════════════════════════
// ESTADO GLOBAL
// ═══════════════════════════════════════════════════════════════════════════════
let currentModule            = "inventario";
let currentEditingProductoId = null;
let currentEditingUsuarioId  = null;
let currentEditingPedidoId   = null;
let currentEditingPagoId     = null;
let esAdmin                  = false; // true si el usuario tiene rol admin

// ═══════════════════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════════════════
async function initAdmin() {
  const name = localStorage.getItem("userName") || "—";
  const role = localStorage.getItem("userRole")  || "—";
  esAdmin    = (role === "admin");

  // Pill de usuario en header
  const fotoUrl = localStorage.getItem("userFoto") || "";
  const pillAvatar = document.getElementById("pillAvatar");
  const pillNombre = document.getElementById("pillNombre");
  if (pillNombre) pillNombre.textContent = name;
  if (pillAvatar) {
    if (fotoUrl) pillAvatar.innerHTML = `<img src="${fotoUrl}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    else pillAvatar.textContent = (name || "?")[0].toUpperCase();
  }

  // Verificar sesión real con Supabase
  const { data } = await supabaseClient.auth.getSession();
  if (!data.session) { window.location.href = "index.html"; return; }

  // Obtener rol real desde la DB (no solo localStorage)
  const { data: user } = await supabaseClient
    .from("usuarios")
    .select("nombre, rol, foto_url")
    .eq("id", data.session.user.id)
    .single();

  if (user) {
    esAdmin = (user.rol === "admin");
    if (pillNombre) pillNombre.textContent = user.nombre || name;
    if (pillAvatar && user.foto_url) {
      pillAvatar.innerHTML = `<img src="${user.foto_url}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
    } else if (pillAvatar) {
      pillAvatar.textContent = (user.nombre || "?")[0].toUpperCase();
    }
    // Ocultar botón Usuarios del sidebar si no es admin
    if (!esAdmin) {
      const btnUsuarios = document.querySelector('[data-module="usuarios"]');
      if (btnUsuarios) btnUsuarios.closest('li').style.display = 'none';
    }
  }

  setupGlobalEvents();
  const saved = sessionStorage.getItem("adminModule") || "inventario";
  loadModule(saved);
}

function logoutAdmin() {
  supabaseClient.auth.signOut().then(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = "index.html";
  });
}

function irInicioPrincipal() {
  window.location.href = "principal.html";
}

// ═══════════════════════════════════════════════════════════════════════════════
// NAVEGACIÓN
// ═══════════════════════════════════════════════════════════════════════════════
function loadModule(module) {
  // Si no es admin e intenta ver usuarios, redirigir
  if (module === "usuarios" && !esAdmin) {
    alert("⚠️ No tienes permisos para ver esta sección.");
    module = "inventario";
  }

  currentModule = module;
  sessionStorage.setItem("adminModule", module);

  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
  const active = document.querySelector(`[data-module="${module}"]`);
  if (active) active.classList.add("active");

  if      (module === "inventario") loadInventario();
  else if (module === "usuarios")   loadUsuarios();
  else if (module === "pedidos")    loadPedidos();
  else if (module === "pagos")      loadPagos();
  else if (module === "reportes")   loadReportes();
  else {
    document.getElementById("moduleContent").innerHTML =
      `<div class="module-header"><h2>${module}</h2></div><p style="color:var(--text-muted)">Módulo en construcción…</p>`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EVENTOS GLOBALES
// ═══════════════════════════════════════════════════════════════════════════════
function setupGlobalEvents() {
  const content = document.getElementById("moduleContent");

  content.addEventListener("click", e => {
    const t = e.target;
    if (t.id === "btnNuevoProducto") openProductoForm();
    if (t.classList.contains("btn-edit-producto")) {
      editProducto(t.dataset.id, decodeURIComponent(t.dataset.nombre),
        decodeURIComponent(t.dataset.descripcion),
        parseInt(t.dataset.stock), parseFloat(t.dataset.precio));
    }
    if (t.classList.contains("btn-delete-producto")) deleteProducto(t.dataset.id);

    if (t.id === "btnNuevoUsuario" && esAdmin) openUsuarioForm();
    if (t.classList.contains("btn-edit-usuario") && esAdmin) {
      editUsuario(t.dataset.id, decodeURIComponent(t.dataset.nombre),
        decodeURIComponent(t.dataset.correo), t.dataset.rol);
    }
    if (t.classList.contains("btn-delete-usuario") && esAdmin) deleteUsuario(t.dataset.id);

    if (t.id === "btnNuevoPedido") openPedidoForm();
    if (t.classList.contains("btn-edit-pedido")) {
      editPedido(t.dataset.id, t.dataset.cliente, t.dataset.vendedor, t.dataset.estado);
    }
    if (t.classList.contains("btn-delete-pedido")) deletePedido(t.dataset.id);
    if (t.classList.contains("btn-ver-detalle"))   verDetallePedido(t.dataset.id);

    if (t.id === "btnNuevoPago") openPagoForm();
    if (t.classList.contains("btn-edit-pago")) {
      editPago(t.dataset.id, t.dataset.pedido, t.dataset.metodo, t.dataset.monto);
    }
    if (t.classList.contains("btn-delete-pago")) deletePago(t.dataset.id);

    if (t.id === "btnReporteVentas")    generarReporteVentas();
    if (t.id === "btnReporteProductos") generarReporteProductos();
    if (t.id === "btnReportePagos")     generarReportePagos();
  });

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.id === "btnGuardarProducto")  guardarProducto();
    if (t.id === "btnCancelarProducto") closeModal("productoModal");
    if (t.id === "productoModal")       closeModal("productoModal");
    if (t.id === "btnGuardarUsuario")   guardarUsuario();
    if (t.id === "btnCancelarUsuario")  closeModal("usuarioModal");
    if (t.id === "usuarioModal")        closeModal("usuarioModal");
    if (t.id === "btnGuardarPedido")    guardarPedido();
    if (t.id === "btnCancelarPedido")   closeModal("pedidoModal");
    if (t.id === "pedidoModal")         closeModal("pedidoModal");
    if (t.id === "btnCerrarDetalle")    closeModal("detallePedidoModal");
    if (t.id === "detallePedidoModal")  closeModal("detallePedidoModal");
    if (t.id === "btnGuardarPago")      guardarPago();
    if (t.id === "btnCancelarPago")     closeModal("pagoModal");
    if (t.id === "pagoModal")           closeModal("pagoModal");
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      ["productoModal","usuarioModal","pedidoModal","detallePedidoModal","pagoModal"]
        .forEach(id => closeModal(id));
    }
  });
}

function openModal(id)  { document.getElementById(id)?.classList.add("open"); }
function closeModal(id) { document.getElementById(id)?.classList.remove("open"); }

// ═══════════════════════════════════════════════════════════════════════════════
// VALIDACIONES DE PRODUCTO
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Valida el nombre del producto:
 * - No puede estar vacío
 * - Solo letras, espacios, guiones y caracteres acentuados (NO números puros)
 * - Puede contener palabras como "café granulado" pero NO "café 12222"
 * - Mínimo 3 caracteres
 */
function validarNombreProducto(nombre) {
  if (!nombre || nombre.trim().length < 3) {
    return "❌ El nombre debe tener al menos 3 caracteres.";
  }
  // No permite cadenas de solo números ni nombres con secuencias numéricas largas
  if (/\d{3,}/.test(nombre)) {
    return "❌ El nombre no puede contener números. Escribe un nombre descriptivo (ej: Café Granulado).";
  }
  // Solo letras (con acentos), espacios, guion, paréntesis, coma, punto
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s\-\(\)\.,/]{3,}$/.test(nombre)) {
    return "❌ El nombre contiene caracteres no permitidos.";
  }
  return null; // válido
}

function validarDescripcionProducto(desc) {
  if (desc && desc.trim().length > 0 && desc.trim().length < 10) {
    return "❌ La descripción debe tener al menos 10 caracteres o dejarse vacía.";
  }
  return null;
}

function validarStock(stock) {
  if (isNaN(stock) || stock < 0) {
    return "❌ El stock no puede ser negativo ni vacío.";
  }
  if (!Number.isInteger(stock)) {
    return "❌ El stock debe ser un número entero.";
  }
  return null;
}

function validarPrecio(precio) {
  if (isNaN(precio) || precio <= 0) {
    return "❌ El precio debe ser un número mayor a $0.";
  }
  if (precio > 99999) {
    return "❌ El precio parece demasiado alto. Verifica que sea correcto.";
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTARIO — CRUD PRODUCTOS
// ═══════════════════════════════════════════════════════════════════════════════
function loadInventario() {
  document.getElementById("moduleContent").innerHTML = `
    <div class="module-header">
      <h2>Inventario</h2>
      <button id="btnNuevoProducto" class="btn btn-primary">+ Nuevo producto</button>
    </div>
    <p style="color:var(--text-muted);font-size:13px;margin-bottom:14px">
      💡 Las imágenes de los productos se guardan en la carpeta <strong>Productos/img/</strong> de tu repositorio,
      con el nombre <strong>&lt;id_producto&gt;.jpg</strong> (ej: 1.jpg, 2.jpg…)
    </p>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>ID</th><th>Nombre</th><th>Descripción</th><th>Stock</th><th>Precio</th><th>Acciones</th>
        </tr></thead>
        <tbody id="productosTable"></tbody>
      </table>
    </div>`;
  loadProductosData();
}

async function loadProductosData() {
  const tbody = document.getElementById("productosTable");
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Cargando…</td></tr>`;

  const { data, error } = await supabaseClient.from("producto").select("*").order("id_producto");

  if (error) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Error al cargar</td></tr>`; return; }
  if (!data?.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Sin productos registrados</td></tr>`; return; }

  tbody.innerHTML = data.map(p => `
    <tr>
      <td>${p.id_producto}</td>
      <td>${esc(p.nombre)}</td>
      <td class="td-descripcion">${esc(p.descripcion ?? "—")}</td>
      <td>${p.stock}</td>
      <td>$${Number(p.precio).toFixed(2)}</td>
      <td class="td-actions">
        <button class="btn btn-edit btn-edit-producto"
          data-id="${p.id_producto}"
          data-nombre="${encodeURIComponent(p.nombre)}"
          data-descripcion="${encodeURIComponent(p.descripcion ?? '')}"
          data-stock="${p.stock}" data-precio="${p.precio}">Editar</button>
        <button class="btn btn-delete btn-delete-producto" data-id="${p.id_producto}">Eliminar</button>
      </td>
    </tr>`).join("");
}

function openProductoForm() {
  currentEditingProductoId = null;
  document.getElementById("modalProductoTitle").textContent = "Nuevo Producto";
  ["productoNombre","productoDescripcion","productoStock","productoPrecio"].forEach(id => {
    document.getElementById(id).value = "";
  });
  openModal("productoModal");
}

function editProducto(id, nombre, descripcion, stock, precio) {
  currentEditingProductoId = id;
  document.getElementById("modalProductoTitle").textContent = "Editar Producto";
  document.getElementById("productoNombre").value      = nombre;
  document.getElementById("productoDescripcion").value = descripcion;
  document.getElementById("productoStock").value       = stock;
  document.getElementById("productoPrecio").value      = precio;
  openModal("productoModal");
}

async function guardarProducto() {
  const nombre      = document.getElementById("productoNombre").value.trim();
  const descripcion = document.getElementById("productoDescripcion").value.trim();
  const stock       = parseInt(document.getElementById("productoStock").value);
  const precio      = parseFloat(document.getElementById("productoPrecio").value);

  // Validaciones detalladas
  const errNombre = validarNombreProducto(nombre);
  if (errNombre) { alert(errNombre); return; }

  const errDesc = validarDescripcionProducto(descripcion);
  if (errDesc) { alert(errDesc + "\n\nNota: la descripción aparecerá en la página que verán los compradores."); return; }

  const errStock = validarStock(stock);
  if (errStock) { alert(errStock); return; }

  const errPrecio = validarPrecio(precio);
  if (errPrecio) { alert(errPrecio); return; }

  if (currentEditingProductoId) {
    const { error } = await supabaseClient.from("producto")
      .update({ nombre, descripcion, stock, precio })
      .eq("id_producto", currentEditingProductoId);
    if (error) { console.error(error); alert("Error al actualizar: " + error.message); return; }
  } else {
    const { error } = await supabaseClient.from("producto")
      .insert([{ nombre, descripcion, stock, precio }]);
    if (error) { console.error(error); alert("Error al guardar: " + error.message); return; }
  }
  closeModal("productoModal");
  loadProductosData();
}

async function deleteProducto(id) {
  if (!confirm("¿Eliminar este producto? Esta acción es irreversible.")) return;
  const { error } = await supabaseClient.from("producto").delete().eq("id_producto", id);
  if (error) { console.error(error); alert("Error al eliminar: " + error.message); return; }
  loadProductosData();
}

// ═══════════════════════════════════════════════════════════════════════════════
// PEDIDOS — CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function loadPedidos() {
  document.getElementById("moduleContent").innerHTML = `
    <div class="module-header">
      <h2>Pedidos</h2>
      <button id="btnNuevoPedido" class="btn btn-primary">+ Nuevo pedido</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>ID</th><th>Fecha</th><th>Cliente</th><th>Vendedor</th><th>Total</th><th>Estado</th><th>Acciones</th>
        </tr></thead>
        <tbody id="pedidosTable"></tbody>
      </table>
    </div>`;
  loadPedidosData();
}

async function loadPedidosData() {
  const tbody = document.getElementById("pedidosTable");
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Cargando…</td></tr>`;

  const { data, error } = await supabaseClient
    .from("pedido")
    .select("*, usuarios!pedido_id_cliente_fkey(nombre)")
    .order("id_pedido", { ascending: false });

  if (error) {
    const { data: d2, error: e2 } = await supabaseClient.from("pedido").select("*").order("id_pedido", { ascending: false });
    if (e2 || !d2?.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Sin pedidos registrados</td></tr>`; return; }
    renderPedidosRows(tbody, d2);
    return;
  }
  if (!data?.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="7">Sin pedidos registrados</td></tr>`; return; }
  renderPedidosRows(tbody, data);
}

function renderPedidosRows(tbody, data) {
  tbody.innerHTML = data.map(p => {
    const clienteNombre = p.usuarios?.nombre ?? (p.id_cliente ? p.id_cliente.substring(0,8)+"…" : "—");
    const vendedorStr   = p.id_vendedor ? p.id_vendedor.substring(0,8)+"…" : "—";
    const fecha         = p.fecha ? new Date(p.fecha).toLocaleDateString("es-MX") : "—";
    const estado        = p.estado ?? "pendiente";
    return `
      <tr>
        <td>${p.id_pedido}</td>
        <td>${fecha}</td>
        <td>${esc(clienteNombre)}</td>
        <td class="td-uuid">${vendedorStr}</td>
        <td>$${Number(p.total ?? 0).toFixed(2)}</td>
        <td><span class="badge badge-${estado}">${estado}</span></td>
        <td class="td-actions">
          <button class="btn btn-edit btn-ver-detalle" data-id="${p.id_pedido}">Ver</button>
          <button class="btn btn-edit btn-edit-pedido"
            data-id="${p.id_pedido}"
            data-cliente="${p.id_cliente ?? ''}"
            data-vendedor="${p.id_vendedor ?? ''}"
            data-estado="${estado}">Editar</button>
          <button class="btn btn-delete btn-delete-pedido" data-id="${p.id_pedido}">Eliminar</button>
        </td>
      </tr>`; }).join("");
}

function openPedidoForm() {
  currentEditingPedidoId = null;
  document.getElementById("pedidoModalTitle").textContent = "Nuevo Pedido";
  document.getElementById("pedidoCliente").value  = "";
  document.getElementById("pedidoVendedor").value = "";
  document.getElementById("pedidoEstado").value   = "pendiente";
  openModal("pedidoModal");
}

function editPedido(id, cliente, vendedor, estado) {
  currentEditingPedidoId = id;
  document.getElementById("pedidoModalTitle").textContent = "Editar Pedido";
  document.getElementById("pedidoCliente").value  = cliente;
  document.getElementById("pedidoVendedor").value = vendedor;
  document.getElementById("pedidoEstado").value   = estado;
  openModal("pedidoModal");
}

async function guardarPedido() {
  const id_cliente  = document.getElementById("pedidoCliente").value.trim();
  const id_vendedor = document.getElementById("pedidoVendedor").value.trim() || null;
  const estado      = document.getElementById("pedidoEstado").value;

  if (!id_cliente) { alert("❌ Ingresa el UUID del cliente."); return; }

  if (currentEditingPedidoId) {
    const { error } = await supabaseClient.from("pedido")
      .update({ id_cliente, id_vendedor, estado })
      .eq("id_pedido", currentEditingPedidoId);
    if (error) { console.error(error); alert("Error al actualizar: " + error.message); return; }
  } else {
    const { error } = await supabaseClient.from("pedido")
      .insert([{ id_cliente, id_vendedor, estado, fecha: new Date().toISOString(), total: 0 }]);
    if (error) { console.error(error); alert("Error al guardar: " + error.message); return; }
  }
  closeModal("pedidoModal");
  loadPedidosData();
}

async function deletePedido(id) {
  if (!confirm("¿Eliminar pedido #" + id + " y todos sus detalles?")) return;
  const { error } = await supabaseClient.from("pedido").delete().eq("id_pedido", id);
  if (error) { console.error(error); alert("Error al eliminar: " + error.message); return; }
  loadPedidosData();
}

async function verDetallePedido(id) {
  document.getElementById("detallePedidoId").textContent = "#" + id;
  document.getElementById("detallePedidoContent").innerHTML = "<p style='color:var(--text-muted)'>Cargando…</p>";
  openModal("detallePedidoModal");

  const { data, error } = await supabaseClient
    .from("detalle_pedido")
    .select("*, producto(nombre, precio)")
    .eq("id_pedido", id);

  const contentEl = document.getElementById("detallePedidoContent");
  if (error || !data?.length) {
    contentEl.innerHTML = "<p style='color:var(--text-muted);font-style:italic'>Sin detalles registrados.</p>";
    return;
  }

  let total = 0;
  const items = data.map(d => {
    total += Number(d.subtotal);
    return `<div class="detalle-item">
      <span>${esc(d.producto?.nombre ?? "Producto")} × ${d.cantidad}</span>
      <span>$${Number(d.subtotal).toFixed(2)}</span>
    </div>`;
  }).join("");

  contentEl.innerHTML = `
    <div class="detalle-list">${items}</div>
    <div style="text-align:right;font-weight:700;color:var(--latte);font-size:15px">
      Total: $${total.toFixed(2)}
    </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGOS — CRUD
// ═══════════════════════════════════════════════════════════════════════════════
function loadPagos() {
  document.getElementById("moduleContent").innerHTML = `
    <div class="module-header">
      <h2>Pagos</h2>
      <button id="btnNuevoPago" class="btn btn-primary">+ Registrar pago</button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>ID Pago</th><th>Pedido</th><th>Método</th><th>Monto</th><th>Fecha</th><th>Acciones</th>
        </tr></thead>
        <tbody id="pagosTable"></tbody>
      </table>
    </div>`;
  loadPagosData();
}

async function loadPagosData() {
  const tbody = document.getElementById("pagosTable");
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Cargando…</td></tr>`;

  const { data, error } = await supabaseClient
    .from("pago")
    .select("*")
    .order("id_pago", { ascending: false });

  if (error) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Error al cargar</td></tr>`; return; }
  if (!data?.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="6">Sin pagos registrados</td></tr>`; return; }

  tbody.innerHTML = data.map(pg => {
    const metodo = pg.metodo ?? "—";
    const fecha  = pg.fecha_pago ? new Date(pg.fecha_pago).toLocaleDateString("es-MX") : "—";
    return `
      <tr>
        <td>${pg.id_pago}</td>
        <td>#${pg.id_pedido}</td>
        <td><span class="badge badge-${metodo.toLowerCase()}">${metodo}</span></td>
        <td>$${Number(pg.monto ?? 0).toFixed(2)}</td>
        <td>${fecha}</td>
        <td class="td-actions">
          <button class="btn btn-edit btn-edit-pago"
            data-id="${pg.id_pago}"
            data-pedido="${pg.id_pedido}"
            data-metodo="${metodo}"
            data-monto="${pg.monto}">Editar</button>
          <button class="btn btn-delete btn-delete-pago" data-id="${pg.id_pago}">Eliminar</button>
        </td>
      </tr>`; }).join("");
}

function openPagoForm() {
  currentEditingPagoId = null;
  document.getElementById("pagoModalTitle").textContent = "Registrar Pago";
  document.getElementById("pagoPedidoId").value = "";
  document.getElementById("pagoMetodo").value   = "contraentrega";
  document.getElementById("pagoMonto").value    = "";
  document.getElementById("pagoPedidoId").disabled = false;
  openModal("pagoModal");
}

function editPago(id, pedido, metodo, monto) {
  currentEditingPagoId = id;
  document.getElementById("pagoModalTitle").textContent = "Editar Pago";
  document.getElementById("pagoPedidoId").value    = pedido;
  document.getElementById("pagoPedidoId").disabled = true;
  document.getElementById("pagoMetodo").value      = metodo.toLowerCase();
  document.getElementById("pagoMonto").value       = monto;
  openModal("pagoModal");
}

async function guardarPago() {
  const id_pedido = parseInt(document.getElementById("pagoPedidoId").value);
  const metodo    = document.getElementById("pagoMetodo").value;
  const monto     = parseFloat(document.getElementById("pagoMonto").value);

  if (isNaN(id_pedido) || id_pedido <= 0) { alert("❌ Ingresa un ID de pedido válido (número positivo)."); return; }
  if (isNaN(monto) || monto <= 0) { alert("❌ El monto debe ser mayor a $0."); return; }

  if (currentEditingPagoId) {
    const { error } = await supabaseClient.from("pago")
      .update({ metodo, monto })
      .eq("id_pago", currentEditingPagoId);
    if (error) { console.error(error); alert("Error al actualizar: " + error.message); return; }
  } else {
    const { error } = await supabaseClient.from("pago")
      .insert([{ id_pedido, metodo, monto, fecha_pago: new Date().toISOString() }]);
    if (error) { console.error(error); alert("Error al guardar. Verifica que el pedido existe y no tenga pago registrado.\n" + error.message); return; }
  }
  closeModal("pagoModal");
  loadPagosData();
}

async function deletePago(id) {
  if (!confirm("¿Eliminar este pago?")) return;
  const { error } = await supabaseClient.from("pago").delete().eq("id_pago", id);
  if (error) { console.error(error); alert("Error al eliminar: " + error.message); return; }
  loadPagosData();
}

// ═══════════════════════════════════════════════════════════════════════════════
// USUARIOS — Solo admin puede crear/editar/eliminar
// ═══════════════════════════════════════════════════════════════════════════════
function loadUsuarios() {
  // Mostrar tabla — botón de crear solo para admin
  document.getElementById("moduleContent").innerHTML = `
    <div class="module-header">
      <h2>Usuarios</h2>
      ${esAdmin ? '<button id="btnNuevoUsuario" class="btn btn-primary">+ Nuevo usuario</button>' : '<span style="color:var(--text-muted);font-size:13px">Solo lectura (sin permisos de edición)</span>'}
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>ID</th><th>Nombre</th><th>Correo</th><th>Rol</th>${esAdmin ? '<th>Acciones</th>' : ''}
        </tr></thead>
        <tbody id="usuariosTable"></tbody>
      </table>
    </div>`;
  loadUsuariosData();
}

async function loadUsuariosData() {
  const tbody = document.getElementById("usuariosTable");
  if (!tbody) return;
  tbody.innerHTML = `<tr class="empty-row"><td colspan="${esAdmin ? 5 : 4}">Cargando…</td></tr>`;

  const { data, error } = await supabaseClient.from("usuarios").select("*").order("nombre");

  if (error) { tbody.innerHTML = `<tr class="empty-row"><td colspan="${esAdmin ? 5 : 4}">Error al cargar</td></tr>`; return; }
  if (!data?.length) { tbody.innerHTML = `<tr class="empty-row"><td colspan="${esAdmin ? 5 : 4}">Sin usuarios</td></tr>`; return; }

  tbody.innerHTML = data.map(u => `
    <tr>
      <td class="td-uuid" title="${u.id}">${u.id.substring(0,8)}…</td>
      <td>${esc(u.nombre ?? "—")}</td>
      <td>${esc(u.correo ?? "—")}</td>
      <td><span class="badge badge-${u.rol}">${u.rol ?? "—"}</span></td>
      ${esAdmin ? `<td class="td-actions">
        <button class="btn btn-edit btn-edit-usuario"
          data-id="${u.id}"
          data-nombre="${encodeURIComponent(u.nombre ?? '')}"
          data-correo="${encodeURIComponent(u.correo ?? '')}"
          data-rol="${u.rol ?? 'cliente'}">Editar</button>
        <button class="btn btn-delete btn-delete-usuario" data-id="${u.id}">Eliminar</button>
      </td>` : ''}
    </tr>`).join("");
}

function openUsuarioForm() {
  if (!esAdmin) { alert("⚠️ Solo los administradores pueden crear usuarios."); return; }
  currentEditingUsuarioId = null;
  document.getElementById("usuarioModalTitle").textContent = "Nuevo Usuario";
  document.getElementById("usuarioNombre").value  = "";
  document.getElementById("usuarioCorreo").value  = "";
  document.getElementById("usuarioCorreo").disabled = false;
  document.getElementById("usuarioRol").value     = "cliente";
  openModal("usuarioModal");
}

function editUsuario(id, nombre, correo, rol) {
  if (!esAdmin) { alert("⚠️ Solo los administradores pueden editar usuarios."); return; }
  currentEditingUsuarioId = id;
  document.getElementById("usuarioModalTitle").textContent = "Editar Usuario";
  document.getElementById("usuarioNombre").value  = nombre;
  document.getElementById("usuarioCorreo").value  = correo;
  document.getElementById("usuarioCorreo").disabled = true;
  document.getElementById("usuarioRol").value     = rol;
  openModal("usuarioModal");
}

async function guardarUsuario() {
  if (!esAdmin) { alert("⚠️ Sin permisos."); return; }
  const nombre = document.getElementById("usuarioNombre").value.trim();
  const correo = document.getElementById("usuarioCorreo").value.trim();
  const rol    = document.getElementById("usuarioRol").value;

  if (!nombre || nombre.length < 3) { alert("❌ El nombre debe tener al menos 3 caracteres."); return; }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]{3,}$/.test(nombre)) {
    alert("❌ El nombre solo puede contener letras y espacios."); return;
  }
  if (!currentEditingUsuarioId && !correo) { alert("❌ Ingresa un correo."); return; }

  if (currentEditingUsuarioId) {
    const { error } = await supabaseClient.from("usuarios")
      .update({ nombre, rol })
      .eq("id", currentEditingUsuarioId);
    if (error) { console.error(error); alert("Error al actualizar: " + error.message); return; }
  } else {
    const { error } = await supabaseClient.from("usuarios")
      .insert([{ nombre, correo, rol }]);
    if (error) { console.error(error); alert("Error al guardar: " + error.message); return; }
  }
  closeModal("usuarioModal");
  loadUsuariosData();
}

async function deleteUsuario(id) {
  if (!esAdmin) { alert("⚠️ Solo los administradores pueden eliminar usuarios."); return; }
  if (!confirm("¿Eliminar este usuario?")) return;
  const { error } = await supabaseClient.from("usuarios").delete().eq("id", id);
  if (error) { console.error(error); alert("Error al eliminar: " + error.message); return; }
  loadUsuariosData();
}

// ═══════════════════════════════════════════════════════════════════════════════
// REPORTES
// ═══════════════════════════════════════════════════════════════════════════════
function loadReportes() {
  const now  = new Date();
  const yyyy = now.getFullYear();
  const mm   = String(now.getMonth() + 1).padStart(2, "0");

  document.getElementById("moduleContent").innerHTML = `
    <div class="module-header"><h2>Reportes</h2></div>
    <div class="report-grid">
      <div class="report-card">
        <h3>📈 Ventas por período</h3>
        <p>Genera un reporte PDF de ventas filtrado por semana o mes.</p>
        <div class="report-filters">
          <select id="reporteTipo" class="input">
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </div>
        <div id="reporteCustomDates" style="display:none;gap:8px;flex-wrap:wrap;margin-bottom:8px">
          <input type="date" id="reporteFechaInicio" class="input" value="${yyyy}-${mm}-01" style="margin-bottom:0;flex:1">
          <input type="date" id="reporteFechaFin"    class="input" value="${yyyy}-${mm}-${String(now.getDate()).padStart(2,'0')}" style="margin-bottom:0;flex:1">
        </div>
        <button id="btnReporteVentas" class="btn btn-pdf" style="width:100%">⬇ Descargar PDF</button>
      </div>
      <div class="report-card">
        <h3>📦 Inventario actual</h3>
        <p>Exporta el estado actual del inventario.</p>
        <button id="btnReporteProductos" class="btn btn-pdf" style="width:100%">⬇ Descargar PDF</button>
      </div>
      <div class="report-card">
        <h3>💳 Reporte de Pagos</h3>
        <p>Lista todos los pagos registrados con su método y monto.</p>
        <div class="report-filters">
          <select id="reportePagoMetodo" class="input" style="margin-bottom:0">
            <option value="">Todos los métodos</option>
            <option value="transferencia">Transferencia</option>
            <option value="efectivo">Efectivo</option>
          </select>
        </div>
        <button id="btnReportePagos" class="btn btn-pdf" style="width:100%;margin-top:8px">⬇ Descargar PDF</button>
      </div>
    </div>`;

  document.getElementById("reporteTipo").addEventListener("change", e => {
    document.getElementById("reporteCustomDates").style.display =
      e.target.value === "personalizado" ? "flex" : "none";
  });
}

function weekStart(d) { const r=new Date(d); r.setDate(r.getDate()-r.getDay()); r.setHours(0,0,0,0); return r; }
function weekEnd(d)   { const r=weekStart(d); r.setDate(r.getDate()+6); r.setHours(23,59,59,999); return r; }
function fmtDate(d)   { return new Date(d).toLocaleDateString("es-MX"); }

function newPDF(title, subtitle) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFillColor(46, 27, 14);
  doc.rect(0, 0, 210, 28, "F");
  doc.setFont("helvetica","bold");
  doc.setFontSize(16); doc.setTextColor(201, 150, 90);
  doc.text("Sinfonía de Granos", 14, 12);
  doc.setFontSize(10); doc.setTextColor(163, 99, 42);
  doc.text(title, 14, 20);
  if (subtitle) { doc.setFontSize(9); doc.setTextColor(160,120,80); doc.text(subtitle, 14, 26); }
  doc.setFont("helvetica","normal"); doc.setTextColor(30, 20, 10);
  doc.setFontSize(8); doc.setTextColor(130,90,50);
  doc.text("Generado: " + new Date().toLocaleString("es-MX"), 140, 10);
  return doc;
}

async function generarReporteVentas() {
  const tipo = document.getElementById("reporteTipo")?.value ?? "mes";
  const now  = new Date();
  let desde, hasta, subtitulo;
  if (tipo === "semana") {
    desde = weekStart(now).toISOString(); hasta = weekEnd(now).toISOString();
    subtitulo = `Semana del ${fmtDate(weekStart(now))} al ${fmtDate(weekEnd(now))}`;
  } else if (tipo === "mes") {
    const y = now.getFullYear(), m = now.getMonth();
    desde = new Date(y,m,1).toISOString(); hasta = new Date(y,m+1,0,23,59,59).toISOString();
    subtitulo = `Mes de ${now.toLocaleString("es-MX",{month:"long",year:"numeric"})}`;
  } else {
    desde = new Date(document.getElementById("reporteFechaInicio").value).toISOString();
    hasta = new Date(document.getElementById("reporteFechaFin").value+"T23:59:59").toISOString();
    subtitulo = `Del ${fmtDate(desde)} al ${fmtDate(hasta)}`;
  }
  const { data, error } = await supabaseClient.from("pedido")
    .select("id_pedido,fecha,total,estado,id_cliente")
    .gte("fecha",desde).lte("fecha",hasta).order("fecha");
  if (error) { alert("Error al obtener datos."); return; }
  const doc = newPDF("Reporte de Ventas", subtitulo);
  const totalGeneral = (data??[]).reduce((s,p)=>s+Number(p.total??0),0);
  doc.autoTable({
    startY:33,
    head:[["ID Pedido","Fecha","Cliente (UUID)","Total","Estado"]],
    body:(data??[]).map(p=>[p.id_pedido,fmtDate(p.fecha),p.id_cliente?p.id_cliente.substring(0,14)+"…":"—","$"+Number(p.total??0).toFixed(2),p.estado??"—"]),
    foot:[["","","TOTAL","$"+totalGeneral.toFixed(2),""]],
    styles:{fontSize:9,cellPadding:4},
    headStyles:{fillColor:[46,27,14],textColor:[201,150,90],fontStyle:"bold"},
    footStyles:{fillColor:[30,18,8],textColor:[201,150,90],fontStyle:"bold"},
    alternateRowStyles:{fillColor:[252,244,230]},theme:"striped"
  });
  doc.save(`reporte_ventas_${tipo}_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}.pdf`);
}

async function generarReporteProductos() {
  const { data, error } = await supabaseClient.from("producto").select("*").order("id_producto");
  if (error) { alert("Error al obtener datos."); return; }
  const doc = newPDF("Reporte de Inventario","Estado actual del inventario");
  doc.autoTable({
    startY:33,head:[["ID","Nombre","Descripción","Stock","Precio"]],
    body:(data??[]).map(p=>[p.id_producto,p.nombre,p.descripcion?(p.descripcion.length>40?p.descripcion.substring(0,40)+"…":p.descripcion):"—",p.stock,"$"+Number(p.precio).toFixed(2)]),
    styles:{fontSize:9,cellPadding:4},
    headStyles:{fillColor:[46,27,14],textColor:[201,150,90],fontStyle:"bold"},
    alternateRowStyles:{fillColor:[252,244,230]},theme:"striped"
  });
  doc.save(`inventario_${new Date().toISOString().slice(0,10)}.pdf`);
}

async function generarReportePagos() {
  const metodoFiltro = document.getElementById("reportePagoMetodo")?.value ?? "";
  let query = supabaseClient.from("pago").select("*").order("id_pago");
  if (metodoFiltro) query = query.eq("metodo", metodoFiltro);
  const { data, error } = await query;
  if (error) { alert("Error al obtener datos."); return; }
  const subtitulo = metodoFiltro ? `Método: ${metodoFiltro}` : "Todos los métodos";
  const doc = newPDF("Reporte de Pagos", subtitulo);
  const totalGeneral = (data??[]).reduce((s,pg)=>s+Number(pg.monto??0),0);
  doc.autoTable({
    startY:33,head:[["ID Pago","Pedido","Método","Monto","Fecha Pago"]],
    body:(data??[]).map(pg=>[pg.id_pago,"#"+pg.id_pedido,pg.metodo??"—","$"+Number(pg.monto??0).toFixed(2),pg.fecha_pago?fmtDate(pg.fecha_pago):"—"]),
    foot:[["","","TOTAL","$"+totalGeneral.toFixed(2),""]],
    styles:{fontSize:9,cellPadding:4},
    headStyles:{fillColor:[46,27,14],textColor:[201,150,90],fontStyle:"bold"},
    footStyles:{fillColor:[30,18,8],textColor:[201,150,90],fontStyle:"bold"},
    alternateRowStyles:{fillColor:[252,244,230]},theme:"striped"
  });
  doc.save(`reporte_pagos_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════════════════════
function esc(str) {
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}