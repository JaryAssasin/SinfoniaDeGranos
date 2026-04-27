// Variables globales
let currentModule = 'inventario';
let usuarioActual = null;
let rolUsuario = localStorage.getItem('userRole');

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

        if (error || !usuarios || usuarios.rol !== 'admin') {
            alert('No tienes permisos de administrador');
            window.location.href = 'principal.html';
            return;
        }

        usuarioActual = usuarios;
        rolUsuario = usuarios.rol;
        localStorage.setItem('userRole', usuarios.rol);

        // ✅ Cargar módulo de inventario por defecto
        loadModule('inventario');

    } catch (error) {
        console.error('Error verificando permisos:', error);
        window.location.href = 'principal.html';
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
            loadUsuarios();
            break;
        case 'pagos':
            loadPagos();
            break;
    }
}

//////////////////////////////////////////////////
// INVENTARIO
//////////////////////////////////////////////////

async function loadInventario() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="module-header">
            <h2>Módulo de Inventario</h2>
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
                <h2>Nuevo Producto</h2>
                <form onsubmit="saveProducto(event)">
                    <input type="text" id="productoNombre" placeholder="Nombre" required>
                    <input type="number" id="productoStock" placeholder="Stock" required min="0">
                    <input type="number" id="productoPrecio" placeholder="Precio" required step="0.01">
                    <textarea id="productoDescripcion" placeholder="Descripción"></textarea>
                    <button type="submit" class="btn-primary">Guardar</button>
                    <button type="button" class="btn-primary" onclick="closeProductoForm()" style="background: #999;">Cancelar</button>
                </form>
            </div>
        </div>
    `;

    await loadProductosData();
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
                    <td>
                        <button onclick="editProducto(${p.id_producto || p.id})" style="background: #6ee7b7; color: #000; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Editar</button>
                        <button onclick="deleteProducto(${p.id_producto || p.id})" style="background: #ff6b6b; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Eliminar</button>
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

function openProductoForm() {
    document.getElementById('productoModal').style.display = 'flex';
}

function closeProductoForm() {
    document.getElementById('productoModal').style.display = 'none';
    document.getElementById('productoNombre').value = '';
    document.getElementById('productoStock').value = '';
    document.getElementById('productoPrecio').value = '';
    document.getElementById('productoDescripcion').value = '';
}

async function saveProducto(e) {
    e.preventDefault();

    const producto = {
        nombre: document.getElementById('productoNombre').value.trim(),
        stock: parseInt(document.getElementById('productoStock').value),
        precio: parseFloat(document.getElementById('productoPrecio').value),
        descripcion: document.getElementById('productoDescripcion').value
    };

    try {
        const { error } = await supabaseClient.from('producto').insert([producto]);

        if (error) {
            alert('Error al guardar: ' + error.message);
            return;
        }

        closeProductoForm();
        await loadProductosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el producto');
    }
}

async function editProducto(id) {
    alert('Función de edición en desarrollo');
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
// REPORTES
//////////////////////////////////////////////////

async function loadReportes() {
    const content = document.getElementById('moduleContent');

    content.innerHTML = `
        <h2>Reportes</h2>
        <div class="stats-container">
            <div class="stat-card">
                <h4>Total Ingresos</h4>
                <p class="stat-value" id="totalIngresos">$0.00</p>
            </div>
            <div class="stat-card">
                <h4>Pagos Completados</h4>
                <p class="stat-value" id="pagosCompletados">0</p>
            </div>
            <div class="stat-card">
                <h4>Pagos Pendientes</h4>
                <p class="stat-value" id="pagosPendientes">0</p>
            </div>
        </div>
    `;

    try {
        const { data: pagos, error } = await supabaseClient.from('pago').select('*');

        if (error) {
            content.innerHTML += '<p>Error cargando reportes</p>';
            return;
        }

        let total = 0;
        let completados = 0;
        let pendientes = 0;

        pagos?.forEach(p => {
            if (p.estado === 'completado') {
                total += p.monto || 0;
                completados++;
            } else if (p.estado === 'pendiente') {
                pendientes++;
            }
        });

        document.getElementById('totalIngresos').textContent = '$' + total.toFixed(2);
        document.getElementById('pagosCompletados').textContent = completados;
        document.getElementById('pagosPendientes').textContent = pendientes;
    } catch (error) {
        console.error('Error:', error);
    }
}

//////////////////////////////////////////////////
// USUARIOS
//////////////////////////////////////////////////

async function loadUsuarios() {
    const content = document.getElementById('moduleContent');

    try {
        const { data: usuarios, error } = await supabaseClient.from('usuarios').select('*');

        if (error) {
            content.innerHTML = '<p>Error cargando usuarios</p>';
            return;
        }

        let html = `<h2>Usuarios</h2><table><thead><tr><th>Correo</th><th>Rol</th></tr></thead><tbody>`;

        usuarios?.forEach(u => {
            html += `<tr><td>${u.correo || u.email || ''}</td><td>${u.rol || 'usuario'}</td></tr>`;
        });

        html += `</tbody></table>`;
        content.innerHTML = html;
    } catch (error) {
        console.error('Error:', error);
    }
}

//////////////////////////////////////////////////
// PAGOS
//////////////////////////////////////////////////

async function loadPagos() {
    const content = document.getElementById('moduleContent');

    content.innerHTML = `
        <div class="module-header">
            <h2>Gestión de Pagos</h2>
            <button class="btn-primary" onclick="openPagoForm()">+ Nuevo Pago</button>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="pagosTable"></tbody>
            </table>
        </div>

        <div id="pagoModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closePagoForm()">&times;</span>
                <h2>Nuevo Pago</h2>
                <form onsubmit="savePago(event)">
                    <input type="number" id="pagoPedido" placeholder="ID Pedido" required>
                    <input type="number" id="pagoMonto" placeholder="Monto" required step="0.01">
                    <select id="pagoMetodo">
                        <option value="efectivo">Efectivo</option>
                        <option value="tarjeta">Tarjeta</option>
                    </select>
                    <select id="pagoEstado">
                        <option value="completado">Completado</option>
                        <option value="pendiente">Pendiente</option>
                    </select>
                    <button type="submit" class="btn-primary">Guardar</button>
                    <button type="button" class="btn-primary" onclick="closePagoForm()" style="background: #999;">Cancelar</button>
                </form>
            </div>
        </div>
    `;

    await loadPagosData();
}

async function loadPagosData() {
    try {
        const { data: pagos, error } = await supabaseClient.from('pago').select('*');

        if (error) {
            document.getElementById('pagosTable').innerHTML = '<tr><td colspan="4">Error cargando pagos</td></tr>';
            return;
        }

        let html = '';

        pagos?.forEach(p => {
            html += `
                <tr>
                    <td>${p.id_pago || p.id}</td>
                    <td>$${(p.monto || 0).toFixed(2)}</td>
                    <td><span style="background: ${p.estado === 'completado' ? '#6ee7b7' : '#ffbe3b'}; color: #000; padding: 5px 10px; border-radius: 4px;">${p.estado}</span></td>
                    <td><button onclick="deletePago(${p.id_pago || p.id})" style="background: #ff6b6b; color: white; padding: 5px 10px; border: none; border-radius: 4px; cursor: pointer;">Eliminar</button></td>
                </tr>
            `;
        });

        document.getElementById('pagosTable').innerHTML = html || '<tr><td colspan="4">No hay pagos registrados</td></tr>';
    } catch (error) {
        console.error('Error:', error);
    }
}

function openPagoForm() {
    document.getElementById('pagoModal').style.display = 'flex';
}

function closePagoForm() {
    document.getElementById('pagoModal').style.display = 'none';
    document.getElementById('pagoPedido').value = '';
    document.getElementById('pagoMonto').value = '';
}

async function savePago(e) {
    e.preventDefault();

    const pago = {
        id_pedido: parseInt(document.getElementById('pagoPedido').value),
        monto: parseFloat(document.getElementById('pagoMonto').value),
        metodo: document.getElementById('pagoMetodo').value,
        estado: document.getElementById('pagoEstado').value,
        fecha_pago: new Date().toISOString()
    };

    try {
        const { error } = await supabaseClient.from('pago').insert([pago]);

        if (error) throw error;

        closePagoForm();
        await loadPagosData();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar el pago');
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
    window.location.href = 'index.html';
}

window.addEventListener('load', initAdmin);