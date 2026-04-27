// Variables globales
let currentModule = 'inventario';
let usuarioActual = null;
let rolUsuario = localStorage.getItem('userRole');
let editingProductoId = null;
let editingUsuarioId = null;

// Inicialización
async function initAdmin() {
    const { data } = await supabaseClient.auth.getSession();

    if (!data.session) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const { data: usuarios, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

        if (error || !usuarios) {
            alert('Error verificando usuario');
            window.location.href = 'principal.html';
            return;
        }

        // Permitir admin y vendedor en el panel
        if (usuarios.rol !== 'admin' && usuarios.rol !== 'vendedor') {
            alert('No tienes permisos para acceder al panel');
            window.location.href = 'principal.html';
            return;
        }

        usuarioActual = usuarios;
        rolUsuario = usuarios.rol;
        localStorage.setItem('userRole', usuarios.rol);

        // Mostrar rol del usuario actual
        const roleDisplay = document.getElementById('currentUserRole');
        if (roleDisplay) {
            roleDisplay.textContent = `${usuarios.nombre || 'Usuario'} (${rolUsuario.toUpperCase()})`;
            roleDisplay.className = `role-badge role-${rolUsuario}`;
        }

        // Actualizar sidebar según rol
        updateSidebarByRole();

        // Cargar módulo de inventario por defecto
        loadModule('inventario');

    } catch (error) {
        console.error('Error verificando permisos:', error);
        window.location.href = 'principal.html';
    }
}

// Actualizar sidebar según rol
function updateSidebarByRole() {
    const navMenu = document.querySelector('.nav-menu');

    // Los vendedores no deben ver el módulo de usuarios
    if (rolUsuario === 'vendedor') {
        const usuariosLink = document.querySelector('[data-module="usuarios"]');
        if (usuariosLink) {
            usuariosLink.parentElement.style.display = 'none';
        }
    }
}

// Cambiar módulo
function loadModule(module) {
    currentModule = module;

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    const activeLink = document.querySelector(`[data-module="${module}"]`);
    if (activeLink) activeLink.classList.add('active');

    switch (module) {
        case 'inventario':
            loadInventario();
            break;
        case 'reportes':
            loadReportes();
            break;
        case 'usuarios':
            // Solo admin puede acceder a usuarios
            if (rolUsuario !== 'admin') {
                alert('No tienes permisos para acceder a usuarios');
                loadModule('inventario');
                return;
            }
            loadUsuarios();
            break;
        case 'pagos':
            loadPagos();
            break;
    }
}

//////////////////////////////////////////////////
// INVENTARIO - COMPLETE CRUD
//////////////////////////////////////////////////

async function loadInventario() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="module-header">
            <h2>📦 Módulo de Inventario</h2>
            <button class="btn-primary" onclick="openProductoForm()">+ Nuevo Producto</button>
        </div>

        <div class="stats-container">
            <div class="stat-card">
                <h4>Total Productos</h4>
                <p class="stat-value" id="totalProductos">0</p>
            </div>
            <div class="stat-card">
                <h4>Stock Total</h4>
                <p class="stat-value" id="stockTotal">0 unidades</p>
            </div>
            <div class="stat-card">
                <h4>Productos Bajos</h4>
                <p class="stat-value" id="productosBaros">0</p>
            </div>
        </div>

        <div class="table-container">
            <h3>Productos en Inventario</h3>
            <input type="text" id="searchProductos" placeholder="🔍 Buscar producto..." style="margin-bottom: 15px; padding: 8px; width: 100%; border: 1px solid #4b2e2e; background: #2e1b1b; color: #e0e0e0; border-radius: 4px;">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Stock</th>
                        <th>Precio</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="productosTable"></tbody>
            </table>
        </div>

        <div id="productoModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closeProductoForm()">&times;</span>
                <h2 id="productoModalTitle">Nuevo Producto</h2>
                <form onsubmit="saveProducto(event)">
                    <input type="hidden" id="productoId">
                    <input type="text" id="productoNombre" placeholder="Nombre" required>
                    <input type="number" id="productoStock" placeholder="Stock" required min="0">
                    <input type="number" id="productoPrecio" placeholder="Precio" required step="0.01" min="0">
                    <textarea id="productoDescripcion" placeholder="Descripción"></textarea>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary">Guardar</button>
                        <button type="button" class="btn-primary" onclick="closeProductoForm()" style="background: #999;">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadProductosData();

    // Agregar búsqueda
    document.getElementById('searchProductos').addEventListener('keyup', filterProductos);
}

async function loadProductosData() {
    try {
        const { data: productos, error } = await supabaseClient.from('producto').select('*');

        const tbody = document.getElementById('productosTable');

        if (error) {
            tbody.innerHTML = '<tr><td colspan="6">Error cargando productos</td></tr>';
            return;
        }

        if (!productos || productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">Sin productos</td></tr>';
            return;
        }

        let html = '';
        let totalStock = 0;
        let bajos = 0;

        productos.forEach(p => {
            totalStock += p.stock || 0;
            if ((p.stock || 0) < 5) bajos++;

            html += `
                <tr>
                    <td>${p.id_producto || p.id}</td>
                    <td>${p.nombre || ''}</td>
                    <td>${p.stock || 0}</td>
                    <td>$${(p.precio || 0).toFixed(2)}</td>
                    <td>${p.descripcion || '-'}</td>
                    <td style="display: flex; gap: 5px;">
                        <button onclick="editProducto(${p.id_producto || p.id})" style="background: #6ee7b7; color: #000; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Editar</button>
                        <button onclick="deleteProducto(${p.id_producto || p.id})" style="background: #ff6b6b; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        document.getElementById('totalProductos').textContent = productos.length;
        document.getElementById('stockTotal').textContent = totalStock + ' unidades';
        document.getElementById('productosBaros').textContent = bajos;

    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function filterProductos() {
    const searchTerm = document.getElementById('searchProductos').value.toLowerCase();
    const rows = document.querySelectorAll('#productosTable tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function openProductoForm() {
    editingProductoId = null;
    document.getElementById('productoId').value = '';
    document.getElementById('productoNombre').value = '';
    document.getElementById('productoStock').value = '';
    document.getElementById('productoPrecio').value = '';
    document.getElementById('productoDescripcion').value = '';
    document.getElementById('productoModalTitle').textContent = 'Nuevo Producto';
    document.getElementById('productoModal').style.display = 'flex';
}

function closeProductoForm() {
    document.getElementById('productoModal').style.display = 'none';
}

async function editProducto(id) {
    try {
        const { data, error } = await supabaseClient
            .from('producto')
            .select('*')
            .eq('id_producto', id)
            .single();

        if (error) throw error;

        editingProductoId = id;
        document.getElementById('productoId').value = id;
        document.getElementById('productoNombre').value = data.nombre || '';
        document.getElementById('productoStock').value = data.stock || 0;
        document.getElementById('productoPrecio').value = data.precio || 0;
        document.getElementById('productoDescripcion').value = data.descripcion || '';
        document.getElementById('productoModalTitle').textContent = 'Editar Producto';
        document.getElementById('productoModal').style.display = 'flex';
    } catch (error) {
        console.error('Error:', error);
        alert('Error cargando producto');
    }
}

async function saveProducto(e) {
    e.preventDefault();

    const id = document.getElementById('productoId').value;
    const producto = {
        nombre: document.getElementById('productoNombre').value.trim(),
        stock: parseInt(document.getElementById('productoStock').value),
        precio: parseFloat(document.getElementById('productoPrecio').value),
        descripcion: document.getElementById('productoDescripcion').value
    };

    try {
        if (id) {
            // UPDATE
            const { error } = await supabaseClient.from('producto').update(producto).eq('id_producto', id);
            if (error) throw error;
        } else {
            // INSERT
            const { error } = await supabaseClient.from('producto').insert([producto]);
            if (error) throw error;
        }

        closeProductoForm();
        await loadProductosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar: ' + error.message);
    }
}

async function deleteProducto(id) {
    if (!confirm('¿Eliminar producto?')) return;

    try {
        const { error } = await supabaseClient.from('producto').delete().eq('id_producto', id);

        if (error) throw error;

        await loadProductosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}

//////////////////////////////////////////////////
// REPORTES - ENHANCED
//////////////////////////////////////////////////

async function loadReportes() {
    const content = document.getElementById('moduleContent');

    content.innerHTML = `
        <h2>📊 Reportes</h2>
        <div class="stats-container">
            <div class="stat-card">
                <h4>Total Ingresos</h4>
                <p class="stat-value" id="totalIngresos">$0.00</p>
            </div>
            <div class="stat-card">
                <h4>Por Transferencia</h4>
                <p class="stat-value" id="ingresoTransferencia">$0.00</p>
            </div>
            <div class="stat-card">
                <h4>Por Contraentrega</h4>
                <p class="stat-value" id="ingresoContraentrega">$0.00</p>
            </div>
            <div class="stat-card">
                <h4>Pagos Completados</h4>
                <p class="stat-value" id="pagosCompletados">0</p>
            </div>
            <div class="stat-card">
                <h4>Pagos Pendientes</h4>
                <p class="stat-value" id="pagosPendientes">0</p>
            </div>
            <div class="stat-card">
                <h4>Total Pedidos</h4>
                <p class="stat-value" id="totalPedidos">0</p>
            </div>
        </div>
    `;

    try {
        // Obtener datos de pagos y pedidos
        const { data: pagos } = await supabaseClient.from('pago').select('*');
        const { data: pedidos } = await supabaseClient.from('pedido').select('*');

        let totalIngresos = 0;
        let ingresoTransf = 0;
        let ingresoCont = 0;
        let completados = 0;
        let pendientes = 0;

        pagos?.forEach(p => {
            if (p.estado === 'completado') {
                totalIngresos += p.monto || 0;
                completados++;
                // Determinar método de pago basado en metodo field
                if (p.metodo === 'transferencia') {
                    ingresoTransf += p.monto || 0;
                } else if (p.metodo === 'efectivo') {
                    ingresoCont += p.monto || 0;
                }
            } else if (p.estado === 'pendiente') {
                pendientes++;
            }
        });

        document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toFixed(2);
        document.getElementById('ingresoTransferencia').textContent = '$' + ingresoTransf.toFixed(2);
        document.getElementById('ingresoContraentrega').textContent = '$' + ingresoCont.toFixed(2);
        document.getElementById('pagosCompletados').textContent = completados;
        document.getElementById('pagosPendientes').textContent = pendientes;
        document.getElementById('totalPedidos').textContent = pedidos?.length || 0;
    } catch (error) {
        console.error('Error:', error);
    }
}

//////////////////////////////////////////////////
// USUARIOS - COMPLETE CRUD (ADMIN ONLY)
//////////////////////////////////////////////////

async function loadUsuarios() {
    const content = document.getElementById('moduleContent');

    const adminOnly = rolUsuario === 'admin' ?
        '<button class="btn-primary" onclick="openUsuarioForm()" style="margin-bottom: 15px;">+ Cambiar Rol de Usuario</button>'
        : '';

    content.innerHTML = `
        <h2>👤 Gestión de Usuarios</h2>
        ${adminOnly}
        <div class="table-container">
            <input type="text" id="searchUsuarios" placeholder="🔍 Buscar usuario..." style="margin-bottom: 15px; padding: 8px; width: 100%; border: 1px solid #4b2e2e; background: #2e1b1b; color: #e0e0e0; border-radius: 4px;">
            <table>
                <thead>
                    <tr>
                        <th>Email</th>
                        <th>Nombre</th>
                        <th>Rol</th>
                        ${rolUsuario === 'admin' ? '<th>Acciones</th>' : ''}
                    </tr>
                </thead>
                <tbody id="usuariosTable"></tbody>
            </table>
        </div>

        ${rolUsuario === 'admin' ? `
        <div id="usuarioModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closeUsuarioForm()">&times;</span>
                <h2>Cambiar Rol de Usuario</h2>
                <form onsubmit="saveUsuario(event)">
                    <input type="hidden" id="usuarioId">
                    <select id="usuarioSelect" required style="margin-bottom: 15px;">
                        <option value="">-- Seleccionar usuario --</option>
                    </select>
                    <select id="usuarioRol" required style="margin-bottom: 15px;">
                        <option value="cliente">Cliente</option>
                        <option value="vendedor">Vendedor</option>
                        <option value="admin">Admin</option>
                    </select>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary">Guardar</button>
                        <button type="button" class="btn-primary" onclick="closeUsuarioForm()" style="background: #999;">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
        ` : ''}
    `;

    await loadUsuariosData();

    // Agregar búsqueda
    document.getElementById('searchUsuarios').addEventListener('keyup', filterUsuarios);
}

async function loadUsuariosData() {
    try {
        const { data: usuarios, error } = await supabaseClient.from('usuarios').select('*');

        const tbody = document.getElementById('usuariosTable');

        if (error) {
            tbody.innerHTML = '<tr><td colspan="4">Error cargando usuarios</td></tr>';
            return;
        }

        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4">Sin usuarios</td></tr>';
            return;
        }

        let html = '';

        usuarios.forEach(u => {
            const rolColor = u.rol === 'admin' ? '#ff6b6b' : (u.rol === 'vendedor' ? '#ffbe3b' : '#6ee7b7');
            const actionBtn = rolUsuario === 'admin' ?
                `<td>
                    <button onclick="editUsuario('${u.id}', '${u.correo}', '${u.nombre}', '${u.rol}')" style="background: #6ee7b7; color: #000; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Cambiar</button>
                    ${u.rol !== 'admin' ? `<button onclick="deleteUsuario('${u.id}')" style="background: #ff6b6b; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Eliminar</button>` : ''}
                </td>`
                : '';

            html += `
                <tr>
                    <td>${u.correo || u.email || ''}</td>
                    <td>${u.nombre || ''}</td>
                    <td><span style="background: ${rolColor}; color: #000; padding: 4px 8px; border-radius: 3px; font-weight: bold;">${u.rol?.toUpperCase()}</span></td>
                    ${actionBtn}
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Llenar select de usuarios para cambiar rol
        if (rolUsuario === 'admin') {
            const select = document.getElementById('usuarioSelect');
            if (select) {
                select.innerHTML = '<option value="">-- Seleccionar usuario --</option>';
                usuarios.forEach(u => {
                    select.innerHTML += `<option value="${u.id}|${u.correo}|${u.nombre}|${u.rol}">${u.correo} (${u.nombre})</option>`;
                });
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

function filterUsuarios() {
    const searchTerm = document.getElementById('searchUsuarios').value.toLowerCase();
    const rows = document.querySelectorAll('#usuariosTable tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function openUsuarioForm() {
    editingUsuarioId = null;
    document.getElementById('usuarioId').value = '';
    document.getElementById('usuarioSelect').value = '';
    document.getElementById('usuarioRol').value = 'cliente';
    document.getElementById('usuarioModal').style.display = 'flex';
}

function closeUsuarioForm() {
    document.getElementById('usuarioModal').style.display = 'none';
}

function editUsuario(id, correo, nombre, rol) {
    if (rolUsuario !== 'admin') {
        alert('Solo los admin pueden cambiar roles');
        return;
    }

    editingUsuarioId = id;
    document.getElementById('usuarioId').value = id;
    document.getElementById('usuarioRol').value = rol;

    // Marcar el usuario en el select
    const select = document.getElementById('usuarioSelect');
    for (let option of select.options) {
        if (option.value.startsWith(id)) {
            option.selected = true;
            break;
        }
    }

    document.getElementById('usuarioModal').style.display = 'flex';
}

async function saveUsuario(e) {
    e.preventDefault();

    if (rolUsuario !== 'admin') {
        alert('Solo los admin pueden cambiar roles');
        return;
    }

    const id = document.getElementById('usuarioId').value;
    const nuevoRol = document.getElementById('usuarioRol').value;

    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .update({ rol: nuevoRol })
            .eq('id', id);

        if (error) throw error;

        closeUsuarioForm();
        await loadUsuariosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al actualizar: ' + error.message);
    }
}

async function deleteUsuario(id) {
    if (rolUsuario !== 'admin') {
        alert('Solo los admin pueden eliminar usuarios');
        return;
    }

    if (!confirm('¿Eliminar usuario? Esta acción no se puede deshacer.')) return;

    try {
        const { error } = await supabaseClient.from('usuarios').delete().eq('id', id);

        if (error) throw error;

        await loadUsuariosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}

//////////////////////////////////////////////////
// PAGOS - COMPLETE CRUD
//////////////////////////////////////////////////

async function loadPagos() {
    const content = document.getElementById('moduleContent');

    content.innerHTML = `
        <div class="module-header">
            <h2>💳 Gestión de Pagos</h2>
            <button class="btn-primary" onclick="openPagoForm()">+ Nuevo Pago</button>
        </div>
        <div class="table-container">
            <input type="text" id="searchPagos" placeholder="🔍 Buscar pago..." style="margin-bottom: 15px; padding: 8px; width: 100%; border: 1px solid #4b2e2e; background: #2e1b1b; color: #e0e0e0; border-radius: 4px;">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>ID Pedido</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="pagosTable"></tbody>
            </table>
        </div>

        <div id="pagoModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closePagoForm()">&times;</span>
                <h2 id="pagoModalTitle">Nuevo Pago</h2>
                <form onsubmit="savePago(event)">
                    <input type="hidden" id="pagoId">
                    <input type="number" id="pagoPedido" placeholder="ID Pedido" required>
                    <input type="number" id="pagoMonto" placeholder="Monto" required step="0.01" min="0">
                    <select id="pagoMetodo" required>
                        <option value="">-- Seleccionar método --</option>
                        <option value="transferencia">Transferencia Bancaria</option>
                        <option value="efectivo">Contraentrega (Efectivo)</option>
                    </select>
                    <select id="pagoEstado" required>
                        <option value="pendiente">Pendiente</option>
                        <option value="completado">Completado</option>
                    </select>
                    <div style="display: flex; gap: 10px;">
                        <button type="submit" class="btn-primary">Guardar</button>
                        <button type="button" class="btn-primary" onclick="closePagoForm()" style="background: #999;">Cancelar</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    await loadPagosData();

    // Agregar búsqueda
    document.getElementById('searchPagos').addEventListener('keyup', filterPagos);
}

async function loadPagosData() {
    try {
        const { data: pagos, error } = await supabaseClient.from('pago').select('*');

        if (error) {
            document.getElementById('pagosTable').innerHTML = '<tr><td colspan="7">Error cargando pagos</td></tr>';
            return;
        }

        let html = '';

        pagos?.forEach(p => {
            const estadoColor = p.estado === 'completado' ? '#6ee7b7' : '#ffbe3b';
            const metodoTexto = p.metodo === 'transferencia' ? '🏦 Transferencia' : '💵 Efectivo';
            const fecha = p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : 'N/A';

            html += `
                <tr>
                    <td>${p.id_pago || p.id}</td>
                    <td>${p.id_pedido || ''}</td>
                    <td>$${(p.monto || 0).toFixed(2)}</td>
                    <td>${metodoTexto}</td>
                    <td><span style="background: ${estadoColor}; color: #000; padding: 4px 8px; border-radius: 3px;">${p.estado}</span></td>
                    <td>${fecha}</td>
                    <td style="display: flex; gap: 5px;">
                        <button onclick="editPago(${p.id_pago || p.id})" style="background: #6ee7b7; color: #000; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">✏️ Editar</button>
                        <button onclick="deletePago(${p.id_pago || p.id})" style="background: #ff6b6b; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">🗑️ Eliminar</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('pagosTable').innerHTML = html || '<tr><td colspan="7">No hay pagos registrados</td></tr>';
    } catch (error) {
        console.error('Error:', error);
    }
}

function filterPagos() {
    const searchTerm = document.getElementById('searchPagos').value.toLowerCase();
    const rows = document.querySelectorAll('#pagosTable tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

function openPagoForm() {
    document.getElementById('pagoId').value = '';
    document.getElementById('pagoPedido').value = '';
    document.getElementById('pagoMonto').value = '';
    document.getElementById('pagoMetodo').value = '';
    document.getElementById('pagoEstado').value = 'pendiente';
    document.getElementById('pagoModalTitle').textContent = 'Nuevo Pago';
    document.getElementById('pagoModal').style.display = 'flex';
}

function closePagoForm() {
    document.getElementById('pagoModal').style.display = 'none';
}

async function editPago(id) {
    try {
        const { data, error } = await supabaseClient
            .from('pago')
            .select('*')
            .eq('id_pago', id)
            .single();

        if (error) throw error;

        document.getElementById('pagoId').value = id;
        document.getElementById('pagoPedido').value = data.id_pedido || '';
        document.getElementById('pagoMonto').value = data.monto || 0;
        document.getElementById('pagoMetodo').value = data.metodo || '';
        document.getElementById('pagoEstado').value = data.estado || 'pendiente';
        document.getElementById('pagoModalTitle').textContent = 'Editar Pago';
        document.getElementById('pagoModal').style.display = 'flex';
    } catch (error) {
        console.error('Error:', error);
        alert('Error cargando pago');
    }
}

async function savePago(e) {
    e.preventDefault();

    const id = document.getElementById('pagoId').value;
    const pago = {
        id_pedido: parseInt(document.getElementById('pagoPedido').value),
        monto: parseFloat(document.getElementById('pagoMonto').value),
        metodo: document.getElementById('pagoMetodo').value,
        estado: document.getElementById('pagoEstado').value,
        fecha_pago: new Date().toISOString()
    };

    try {
        if (id) {
            // UPDATE
            const { error } = await supabaseClient.from('pago').update(pago).eq('id_pago', id);
            if (error) throw error;
        } else {
            // INSERT
            const { error } = await supabaseClient.from('pago').insert([pago]);
            if (error) throw error;
        }

        closePagoForm();
        await loadPagosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar: ' + error.message);
    }
}

async function deletePago(id) {
    if (!confirm('¿Eliminar pago?')) return;

    try {
        const { error } = await supabaseClient.from('pago').delete().eq('id_pago', id);

        if (error) throw error;

        await loadPagosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar');
    }
}

//////////////////////////////////////////////////
// LOGOUT
//////////////////////////////////////////////////

async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    window.location.href = 'index.html';
}

window.addEventListener('load', initAdmin);
