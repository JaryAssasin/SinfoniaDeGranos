let currentModule = "inventario";
let currentEditingProductoId = null;
let currentEditingUsuarioId  = null;

function initAdmin() {
  setupGlobalEvents();
  loadModule("inventario");
}

function loadModule(module) {
  currentModule = module;

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
  });

  document.querySelector(`[data-module="${module}"]`)?.classList.add("active");

  if      (module === "inventario") loadInventario();
  else if (module === "usuarios")   loadUsuarios();
  else {
    document.getElementById("moduleContent").innerHTML =
      `<h2>${module}</h2><p>Módulo en construcción...</p>`;
  }
}

function setupGlobalEvents() {
  document.getElementById("moduleContent").addEventListener("click", (e) => {

    // ── Inventario ──────────────────────────────────────────────────────────
    if (e.target.id === "btnNuevoProducto") openProductoForm();

    if (e.target.classList.contains("btn-edit-producto")) {
      const btn = e.target;
      editProducto(
        btn.dataset.id,
        decodeURIComponent(btn.dataset.nombre),
        decodeURIComponent(btn.dataset.descripcion),
        parseInt(btn.dataset.stock),
        parseFloat(btn.dataset.precio)
      );
    }

    if (e.target.classList.contains("btn-delete-producto"))
      deleteProducto(e.target.dataset.id);

    // ── Usuarios ────────────────────────────────────────────────────────────
    if (e.target.id === "btnNuevoUsuario") openUsuarioForm();

    if (e.target.classList.contains("btn-edit-usuario")) {
      const btn = e.target;
      editUsuario(
        btn.dataset.id,
        decodeURIComponent(btn.dataset.nombre),
        decodeURIComponent(btn.dataset.correo),
        btn.dataset.rol
      );
    }

    if (e.target.classList.contains("btn-delete-usuario"))
      deleteUsuario(e.target.dataset.id);
  });

  // Botones de modales (están fuera de moduleContent)
  document.addEventListener("click", (e) => {
    // Producto
    if (e.target.id === "btnGuardarProducto")  guardarProducto();
    if (e.target.id === "btnCancelarProducto") closeProductoForm();
    if (e.target.id === "productoModal")       closeProductoForm();

    // Usuario
    if (e.target.id === "btnGuardarUsuario")   guardarUsuario();
    if (e.target.id === "btnCancelarUsuario")  closeUsuarioForm();
    if (e.target.id === "usuarioModal")        closeUsuarioForm();
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// INVENTARIO
// ═══════════════════════════════════════════════════════════════════════════════

function loadInventario() {
  const content = document.getElementById("moduleContent");

  content.innerHTML = `
    <div class="module-header">
      <h2>Inventario</h2>
      <button id="btnNuevoProducto" class="btn btn-primary">+ Nuevo producto</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Descripción</th>
          <th>Stock</th>
          <th>Precio</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="productosTable"></tbody>
    </table>
  `;

  loadProductosData();
}

async function loadProductosData() {
  const tbody = document.getElementById("productosTable");
  if (!tbody) return;

  const { data, error } = await supabaseClient.from("producto").select("*");

  if (error) {
    tbody.innerHTML = `<tr><td colspan="6">Error al cargar</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Sin productos</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((p) => `
    <tr>
      <td>${p.id_producto}</td>
      <td>${p.nombre}</td>
      <td class="td-descripcion">${p.descripcion ?? "—"}</td>
      <td>${p.stock}</td>
      <td>$${p.precio}</td>
      <td>
        <button class="btn btn-edit btn-edit-producto"
          data-id="${p.id_producto}"
          data-nombre="${encodeURIComponent(p.nombre)}"
          data-descripcion="${encodeURIComponent(p.descripcion ?? '')}"
          data-stock="${p.stock}"
          data-precio="${p.precio}">
          Editar
        </button>
        <button class="btn btn-delete btn-delete-producto" data-id="${p.id_producto}">
          Eliminar
        </button>
      </td>
    </tr>
  `).join("");
}

function openProductoForm() {
  currentEditingProductoId = null;
  document.getElementById("modalTitle").textContent = "Nuevo Producto";
  document.getElementById("productoNombre").value = "";
  document.getElementById("productoDescripcion").value = "";
  document.getElementById("productoStock").value = "";
  document.getElementById("productoPrecio").value = "";
  document.getElementById("productoModal").style.display = "flex";
}

function closeProductoForm() {
  document.getElementById("productoModal").style.display = "none";
  currentEditingProductoId = null;
}

function editProducto(id, nombre, descripcion, stock, precio) {
  currentEditingProductoId = id;
  document.getElementById("modalTitle").textContent = "Editar Producto";
  document.getElementById("productoNombre").value = nombre;
  document.getElementById("productoDescripcion").value = descripcion;
  document.getElementById("productoStock").value = stock;
  document.getElementById("productoPrecio").value = precio;
  document.getElementById("productoModal").style.display = "flex";
}

async function guardarProducto() {
  const nombre      = document.getElementById("productoNombre").value.trim();
  const descripcion = document.getElementById("productoDescripcion").value.trim();
  const stock       = parseInt(document.getElementById("productoStock").value);
  const precio      = parseFloat(document.getElementById("productoPrecio").value);

  if (!nombre || isNaN(stock) || isNaN(precio)) {
    alert("Por favor completa nombre, stock y precio.");
    return;
  }

  if (currentEditingProductoId) {
    const { error } = await supabaseClient
      .from("producto")
      .update({ nombre, descripcion, stock, precio })
      .eq("id_producto", currentEditingProductoId);

    if (error) { console.error(error); alert("Error al actualizar."); return; }
  } else {
    const { error } = await supabaseClient
      .from("producto")
      .insert([{ nombre, descripcion, stock, precio }]);

    if (error) { console.error(error); alert("Error al guardar."); return; }
  }

  closeProductoForm();
  loadProductosData();
}

async function deleteProducto(id) {
  if (!confirm("¿Eliminar este producto?")) return;

  const { error } = await supabaseClient
    .from("producto")
    .delete()
    .eq("id_producto", id);

  if (error) { console.error(error); alert("Error al eliminar."); return; }

  loadProductosData();
}

// ═══════════════════════════════════════════════════════════════════════════════
// USUARIOS
// ═══════════════════════════════════════════════════════════════════════════════

function loadUsuarios() {
  const content = document.getElementById("moduleContent");

  content.innerHTML = `
    <div class="module-header">
      <h2>Usuarios</h2>
      <button id="btnNuevoUsuario" class="btn btn-primary">+ Nuevo usuario</button>
    </div>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Correo</th>
          <th>Rol</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="usuariosTable"></tbody>
    </table>
  `;

  loadUsuariosData();
}

async function loadUsuariosData() {
  const tbody = document.getElementById("usuariosTable");
  if (!tbody) return;

  const { data, error } = await supabaseClient
    .from("usuarios")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) {
    tbody.innerHTML = `<tr><td colspan="5">Error al cargar</td></tr>`;
    console.error(error);
    return;
  }

  if (!data || data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5">Sin usuarios</td></tr>`;
    return;
  }

  tbody.innerHTML = data.map((u) => `
    <tr>
      <td class="td-uuid" title="${u.id}">${u.id.substring(0, 8)}…</td>
      <td>${u.nombre ?? "—"}</td>
      <td>${u.correo ?? "—"}</td>
      <td><span class="badge badge-${u.rol}">${u.rol ?? "—"}</span></td>
      <td>
        <button class="btn btn-edit btn-edit-usuario"
          data-id="${u.id}"
          data-nombre="${encodeURIComponent(u.nombre ?? '')}"
          data-correo="${encodeURIComponent(u.correo ?? '')}"
          data-rol="${u.rol ?? 'cliente'}">
          Editar
        </button>
        <button class="btn btn-delete btn-delete-usuario" data-id="${u.id}">
          Eliminar
        </button>
      </td>
    </tr>
  `).join("");
}

function openUsuarioForm() {
  currentEditingUsuarioId = null;
  document.getElementById("usuarioModalTitle").textContent = "Nuevo Usuario";
  document.getElementById("usuarioNombre").value = "";
  document.getElementById("usuarioCorreo").value = "";
  document.getElementById("usuarioCorreo").disabled = false;
  document.getElementById("usuarioRol").value = "cliente";
  document.getElementById("usuarioModal").style.display = "flex";
}

function closeUsuarioForm() {
  document.getElementById("usuarioModal").style.display = "none";
  currentEditingUsuarioId = null;
}

function editUsuario(id, nombre, correo, rol) {
  currentEditingUsuarioId = id;
  document.getElementById("usuarioModalTitle").textContent = "Editar Usuario";
  document.getElementById("usuarioNombre").value = nombre;
  document.getElementById("usuarioCorreo").value = correo;
  document.getElementById("usuarioCorreo").disabled = true; // correo viene de auth.users
  document.getElementById("usuarioRol").value = rol;
  document.getElementById("usuarioModal").style.display = "flex";
}

async function guardarUsuario() {
  const nombre = document.getElementById("usuarioNombre").value.trim();
  const correo = document.getElementById("usuarioCorreo").value.trim();
  const rol    = document.getElementById("usuarioRol").value;

  if (!nombre || (!currentEditingUsuarioId && !correo)) {
    alert("Por favor completa nombre" + (!currentEditingUsuarioId ? " y correo" : "") + ".");
    return;
  }

  if (currentEditingUsuarioId) {
    // Edición: solo nombre y rol (correo vive en auth.users, no se toca)
    const { error } = await supabaseClient
      .from("usuarios")
      .update({ nombre, rol })
      .eq("id", currentEditingUsuarioId);

    if (error) { console.error(error); alert("Error al actualizar."); return; }
  } else {
    // Creación: requiere que el id ya exista en auth.users (foreign key)
    const { error } = await supabaseClient
      .from("usuarios")
      .insert([{ nombre, correo, rol }]);

    if (error) { console.error(error); alert("Error al guardar."); return; }
  }

  closeUsuarioForm();
  loadUsuariosData();
}

async function deleteUsuario(id) {
  if (!confirm("¿Eliminar este usuario?")) return;

  const { error } = await supabaseClient
    .from("usuarios")
    .delete()
    .eq("id", id);

  if (error) { console.error(error); alert("Error al eliminar."); return; }

  loadUsuariosData();
}
