// Variables globales
let currentModule = 'ventas';
let usuarioActual = null;
let rolUsuario = localStorage.getItem('userRole');

// Inicialización
async function initAdmin() {
    // Verificar sesión y rol
    const { data } = await supabaseClient.auth.getSession();
    
    if (!data.session) {
        window.location.href = 'index.html';
        return;
    }

    // Obtener usuario de Supabase
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
        
        // Cargar módulo inicial
        loadModule('ventas');
    } catch (error) {
        console.error('Error verificando permisos:', error);
        window.location.href = 'principal.html';
    }
}

// Cambiar módulo
function loadModule(module) {
    currentModule = module;
    const content = document.getElementById('moduleContent');
    
    // Remover clase activa
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Añadir clase activa
    document.querySelector(`[data-module="${module}"]`).classList.add('active');
    
    // Cargar contenido del módulo
    switch(module) {
        case 'ventas':
            loadVentas();
            break;
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

// === MÓDULO DE VENTAS ===
async function loadVentas() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="module-header">
            <h2>📊 Módulo de Ventas</h2>
            <button class="btn-primary" onclick="openVentaForm()">+ Nueva Venta</button>
        </div>
        
        <div class="stats-container">
            <div class="stat-card">
                <h4>Ventas Hoy</h4>
                <p class="stat-value" id="ventasHoy">$0</p>
            </div>
            <div class="stat-card">
                <h4>Total Órdenes</h4>
                <p class="stat-value" id="totalOrdenes">0</p>
            </div>
            <div class="stat-card">
                <h4>Promedio por Venta</h4>
                <p class="stat-value" id="promedioVenta">$0</p>
            </div>
        </div>

        <div class="table-container">
            <h3>Historial de Ventas</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Total</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="ventasTable">
                    <tr><td colspan="7" class="loading">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="ventaModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closeVentaForm()">&times;</span>
                <h2>Nueva Venta</h2>
                <form onsubmit="saveVenta(event)">
                    <div class="form-group">
                        <label>Cliente:</label>
                        <input type="text" id="ventaCliente" required>
                    </div>
                    <div class="form-group">
                        <label>Producto:</label>
                        <input type="text" id="ventaProducto" required>
                    </div>
                    <div class="form-group">
                        <label>Cantidad:</label>
                        <input type="number" id="ventaCantidad" required min="1">
                    </div>
                    <div class="form-group">
                        <label>Precio Unitario:</label>
                        <input type="number" id="ventaPrecio" required min="0" step="0.01">
                    </div>
                    <button type="submit" class="btn-primary">Guardar Venta</button>
                </form>
            </div>
        </div>
    `;

    // Cargar datos de ventas
    await loadVentasData();
}

async function loadVentasData() {
    try {
        const { data: ventas, error } = await supabaseClient
            .from('ventas')
            .select('*')
            .order('fecha', { ascending: false })
            .limit(20);

        if (error) throw error;

        const tbody = document.getElementById('ventasTable');
        tbody.innerHTML = '';

        if (!ventas || ventas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Sin ventas registradas</td></tr>';
            return;
        }

        let totalVentas = 0;
        ventas.forEach(venta => {
            const total = venta.cantidad * venta.precio;
            totalVentas += total;
            tbody.innerHTML += `
                <tr>
                    <td>${venta.id}</td>
                    <td>${venta.cliente}</td>
                    <td>${venta.producto}</td>
                    <td>${venta.cantidad}</td>
                    <td>$${total.toFixed(2)}</td>
                    <td>${new Date(venta.fecha).toLocaleDateString()}</td>
                    <td><button class="btn-sm" onclick="deleteVenta(${venta.id})">Eliminar</button></td>
                </tr>
            `;
        });

        // Actualizar estadísticas
        document.getElementById('ventasHoy').textContent = '$' + totalVentas.toFixed(2);
        document.getElementById('totalOrdenes').textContent = ventas.length;
        document.getElementById('promedioVenta').textContent = '$' + (totalVentas / ventas.length).toFixed(2);
    } catch (error) {
        console.error('Error cargando ventas:', error);
    }
}

function openVentaForm() {
    document.getElementById('ventaModal').style.display = 'block';
}

function closeVentaForm() {
    document.getElementById('ventaModal').style.display = 'none';
}

async function saveVenta(event) {
    event.preventDefault();
    
    const venta = {
        cliente: document.getElementById('ventaCliente').value,
        producto: document.getElementById('ventaProducto').value,
        cantidad: parseInt(document.getElementById('ventaCantidad').value),
        precio: parseFloat(document.getElementById('ventaPrecio').value),
        fecha: new Date().toISOString()
    };

    try {
        const { error } = await supabaseClient
            .from('ventas')
            .insert([venta]);

        if (error) throw error;

        alert('Venta guardada correctamente');
        closeVentaForm();
        await loadVentasData();
    } catch (error) {
        alert('Error al guardar venta: ' + error.message);
    }
}

async function deleteVenta(id) {
    if (confirm('¿Estás seguro de eliminar esta venta?')) {
        try {
            const { error } = await supabaseClient
                .from('ventas')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadVentasData();
        } catch (error) {
            alert('Error al eliminar: ' + error.message);
        }
    }
}

// === MÓDULO DE INVENTARIO ===
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
                <tbody id="productosTable">
                    <tr><td colspan="6" class="loading">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="productoModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closeProductoForm()">&times;</span>
                <h2>Nuevo Producto</h2>
                <form onsubmit="saveProducto(event)">
                    <div class="form-group">
                        <label>Nombre:</label>
                        <input type="text" id="productoNombre" required>
                    </div>
                    <div class="form-group">
                        <label>Stock:</label>
                        <input type="number" id="productoStock" required min="0">
                    </div>
                    <div class="form-group">
                        <label>Precio:</label>
                        <input type="number" id="productoPrecio" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Descripción:</label>
                        <textarea id="productoDescripcion"></textarea>
                    </div>
                    <button type="submit" class="btn-primary">Guardar Producto</button>
                </form>
            </div>
        </div>
    `;

    await loadProductosData();
}

async function loadProductosData() {
    try {
        const { data: productos, error } = await supabaseClient
            .from('productos')
            .select('*');

        if (error) throw error;

        const tbody = document.getElementById('productosTable');
        tbody.innerHTML = '';

        if (!productos || productos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="no-data">Sin productos registrados</td></tr>';
            return;
        }

        let totalStock = 0;
        let productosBaros = 0;

        productos.forEach(prod => {
            totalStock += prod.stock || 0;
            if ((prod.stock || 0) < 5) productosBaros++;

            tbody.innerHTML += `
                <tr>
                    <td>${prod.id}</td>
                    <td>${prod.nombre}</td>
                    <td>${prod.stock || 0}</td>
                    <td>$${(prod.precio || 0).toFixed(2)}</td>
                    <td>${prod.descripcion || '-'}</td>
                    <td>
                        <button class="btn-sm" onclick="editProducto(${prod.id})">Editar</button>
                        <button class="btn-sm btn-danger" onclick="deleteProducto(${prod.id})">Eliminar</button>
                    </td>
                </tr>
            `;
        });

        document.getElementById('totalProductos').textContent = productos.length;
        document.getElementById('stockTotal').textContent = totalStock + ' unidades';
        document.getElementById('productosBaros').textContent = productosBaros;
    } catch (error) {
        console.error('Error cargando productos:', error);
    }
}

function openProductoForm() {
    document.getElementById('productoModal').style.display = 'block';
}

function closeProductoForm() {
    document.getElementById('productoModal').style.display = 'none';
}

async function saveProducto(event) {
    event.preventDefault();
    
    const producto = {
        nombre: document.getElementById('productoNombre').value,
        stock: parseInt(document.getElementById('productoStock').value),
        precio: parseFloat(document.getElementById('productoPrecio').value),
        descripcion: document.getElementById('productoDescripcion').value
    };

    try {
        const { error } = await supabaseClient
            .from('productos')
            .insert([producto]);

        if (error) throw error;

        alert('Producto guardado correctamente');
        closeProductoForm();
        await loadProductosData();
    } catch (error) {
        alert('Error al guardar: ' + error.message);
    }
}

async function deleteProducto(id) {
    if (confirm('¿Estás seguro?')) {
        try {
            const { error } = await supabaseClient
                .from('productos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadProductosData();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

function editProducto(id) {
    alert('Función de editar en desarrollo...');
}

// === MÓDULO DE REPORTES ===
async function loadReportes() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="module-header">
            <h2>📈 Módulo de Reportes</h2>
        </div>

        <div class="reports-container">
            <div class="report-card">
                <h3>Ventas por Período</h3>
                <div class="chart-placeholder">
                    <canvas id="chartVentas"></canvas>
                </div>
            </div>

            <div class="report-card">
                <h3>Top Productos Vendidos</h3>
                <div id="topProductos" class="report-list">
                    <p class="loading">Cargando...</p>
                </div>
            </div>

            <div class="report-card">
                <h3>Resumen General</h3>
                <div class="summary-list">
                    <div class="summary-item">
                        <span>Total de Ingresos:</span>
                        <strong id="totalIngresos">$0</strong>
                    </div>
                    <div class="summary-item">
                        <span>Número de Transacciones:</span>
                        <strong id="numTransacciones">0</strong>
                    </div>
                    <div class="summary-item">
                        <span>Clientes Registrados:</span>
                        <strong id="numClientes">0</strong>
                    </div>
                    <div class="summary-item">
                        <span>Valor Inventario:</span>
                        <strong id="valorInventario">$0</strong>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadReportesData();
}

async function loadReportesData() {
    try {
        // Obtener ventas
        const { data: ventas } = await supabaseClient.from('ventas').select('*');
        
        // Obtener productos
        const { data: productos } = await supabaseClient.from('productos').select('*');
        
        // Obtener usuarios
        const { data: usuarios } = await supabaseClient.from('usuarios').select('*');

        let totalIngresos = 0;
        let topProds = {};

        if (ventas) {
            ventas.forEach(v => {
                const total = (v.cantidad || 0) * (v.precio || 0);
                totalIngresos += total;
                
                const key = v.producto;
                topProds[key] = (topProds[key] || 0) + v.cantidad;
            });
        }

        // Valor inventario
        let valorInventario = 0;
        if (productos) {
            productos.forEach(p => {
                valorInventario += (p.stock || 0) * (p.precio || 0);
            });
        }

        document.getElementById('totalIngresos').textContent = '$' + totalIngresos.toFixed(2);
        document.getElementById('numTransacciones').textContent = ventas?.length || 0;
        document.getElementById('numClientes').textContent = usuarios?.length || 0;
        document.getElementById('valorInventario').textContent = '$' + valorInventario.toFixed(2);

        // Top productos
        const topList = document.getElementById('topProductos');
        topList.innerHTML = '';
        
        Object.entries(topProds)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([prod, cant]) => {
                topList.innerHTML += `
                    <div class="list-item">
                        <span>${prod}</span>
                        <strong>${cant} unidades</strong>
                    </div>
                `;
            });

        if (Object.keys(topProds).length === 0) {
            topList.innerHTML = '<p class="no-data">Sin datos</p>';
        }
    } catch (error) {
        console.error('Error cargando reportes:', error);
    }
}

// === MÓDULO DE USUARIOS ===
async function loadUsuarios() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="module-header">
            <h2>👥 Módulo de Usuarios</h2>
        </div>

        <div class="stats-container">
            <div class="stat-card">
                <h4>Total Usuarios</h4>
                <p class="stat-value" id="totalUsuarios">0</p>
            </div>
            <div class="stat-card">
                <h4>Administradores</h4>
                <p class="stat-value" id="totalAdmins">0</p>
            </div>
            <div class="stat-card">
                <h4>Vendedores</h4>
                <p class="stat-value" id="totalVendedores">0</p>
            </div>
            <div class="stat-card">
                <h4>Clientes</h4>
                <p class="stat-value" id="totalClientes">0</p>
            </div>
        </div>

        <div class="table-container">
            <h3>Lista de Usuarios</h3>
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
                <tbody id="usuariosTable">
                    <tr><td colspan="5" class="loading">Cargando...</td></tr>
                </tbody>
            </table>
        </div>
    `;

    await loadUsuariosData();
}

async function loadUsuariosData() {
    try {
        const { data: usuarios, error } = await supabaseClient
            .from('usuarios')
            .select('*');

        if (error) throw error;

        const tbody = document.getElementById('usuariosTable');
        tbody.innerHTML = '';

        if (!usuarios || usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="no-data">Sin usuarios registrados</td></tr>';
            return;
        }

        let admins = 0, vendedores = 0, clientes = 0;

        usuarios.forEach(user => {
            if (user.rol === 'admin') admins++;
            else if (user.rol === 'vendedor') vendedores++;
            else if (user.rol === 'cliente') clientes++;

            tbody.innerHTML += `
                <tr>
                    <td>${user.id.substring(0, 8)}...</td>
                    <td>${user.nombre || '-'}</td>
                    <td>${user.correo}</td>
                    <td><span class="role-badge role-${user.rol}">${user.rol}</span></td>
                    <td>
                        <select onchange="changeUserRole('${user.id}', this.value)" style="padding: 5px;">
                            <option value="${user.rol}">Cambiar rol</option>
                            <option value="admin">Admin</option>
                            <option value="vendedor">Vendedor</option>
                            <option value="cliente">Cliente</option>
                        </select>
                    </td>
                </tr>
            `;
        });

        document.getElementById('totalUsuarios').textContent = usuarios.length;
        document.getElementById('totalAdmins').textContent = admins;
        document.getElementById('totalVendedores').textContent = vendedores;
        document.getElementById('totalClientes').textContent = clientes;
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

async function changeUserRole(userId, newRole) {
    if (newRole === 'Cambiar rol') return;
    
    try {
        const { error } = await supabaseClient
            .from('usuarios')
            .update({ rol: newRole })
            .eq('id', userId);

        if (error) throw error;
        
        alert('Rol actualizado correctamente');
        await loadUsuariosData();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// === MÓDULO DE PAGOS ===
async function loadPagos() {
    const content = document.getElementById('moduleContent');
    content.innerHTML = `
        <div class="module-header">
            <h2>💳 Módulo de Pagos</h2>
            <button class="btn-primary" onclick="openPagoForm()">+ Registrar Pago</button>
        </div>

        <div class="stats-container">
            <div class="stat-card">
                <h4>Total Pagado</h4>
                <p class="stat-value" id="totalPagado">$0</p>
            </div>
            <div class="stat-card">
                <h4>Transacciones</h4>
                <p class="stat-value" id="totalTransacciones">0</p>
            </div>
            <div class="stat-card">
                <h4>Promedio</h4>
                <p class="stat-value" id="promedioPago">$0</p>
            </div>
            <div class="stat-card">
                <h4>Pendientes</h4>
                <p class="stat-value" id="pagosPendientes">0</p>
            </div>
        </div>

        <div class="table-container">
            <h3>Historial de Pagos</h3>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Monto</th>
                        <th>Método</th>
                        <th>Estado</th>
                        <th>Fecha</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="pagosTable">
                    <tr><td colspan="7" class="loading">Cargando...</td></tr>
                </tbody>
            </table>
        </div>

        <div id="pagoModal" class="modal" style="display:none;">
            <div class="modal-content">
                <span class="close" onclick="closePagoForm()">&times;</span>
                <h2>Registrar Pago</h2>
                <form onsubmit="savePago(event)">
                    <div class="form-group">
                        <label>Cliente:</label>
                        <input type="text" id="pagoCliente" required>
                    </div>
                    <div class="form-group">
                        <label>Monto:</label>
                        <input type="number" id="pagoMonto" required min="0" step="0.01">
                    </div>
                    <div class="form-group">
                        <label>Método de Pago:</label>
                        <select id="pagoMetodo" required>
                            <option value="">Seleccionar...</option>
                            <option value="efectivo">Efectivo</option>
                            <option value="tarjeta">Tarjeta de Crédito</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="cheque">Cheque</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Estado:</label>
                        <select id="pagoEstado" required>
                            <option value="completado">Completado</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="fallido">Fallido</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">Guardar Pago</button>
                </form>
            </div>
        </div>
    `;

    await loadPagosData();
}

async function loadPagosData() {
    try {
        const { data: pagos, error } = await supabaseClient
            .from('pagos')
            .select('*')
            .order('fecha', { ascending: false });

        if (error) throw error;

        const tbody = document.getElementById('pagosTable');
        tbody.innerHTML = '';

        if (!pagos || pagos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="no-data">Sin pagos registrados</td></tr>';
            return;
        }

        let totalPagado = 0;
        let pagosPendientes = 0;

        pagos.forEach(pago => {
            if (pago.estado === 'completado') totalPagado += pago.monto || 0;
            if (pago.estado === 'pendiente') pagosPendientes++;

            tbody.innerHTML += `
                <tr>
                    <td>${pago.id}</td>
                    <td>${pago.cliente}</td>
                    <td>$${(pago.monto || 0).toFixed(2)}</td>
                    <td>${pago.metodo}</td>
                    <td><span class="status-badge status-${pago.estado}">${pago.estado}</span></td>
                    <td>${new Date(pago.fecha).toLocaleDateString()}</td>
                    <td><button class="btn-sm btn-danger" onclick="deletePago(${pago.id})">Eliminar</button></td>
                </tr>
            `;
        });

        document.getElementById('totalPagado').textContent = '$' + totalPagado.toFixed(2);
        document.getElementById('totalTransacciones').textContent = pagos.length;
        document.getElementById('promedioPago').textContent = '$' + (totalPagado / pagos.length).toFixed(2);
        document.getElementById('pagosPendientes').textContent = pagosPendientes;
    } catch (error) {
        console.error('Error cargando pagos:', error);
    }
}

function openPagoForm() {
    document.getElementById('pagoModal').style.display = 'block';
}

function closePagoForm() {
    document.getElementById('pagoModal').style.display = 'none';
}

async function savePago(event) {
    event.preventDefault();
    
    const pago = {
        cliente: document.getElementById('pagoCliente').value,
        monto: parseFloat(document.getElementById('pagoMonto').value),
        metodo: document.getElementById('pagoMetodo').value,
        estado: document.getElementById('pagoEstado').value,
        fecha: new Date().toISOString()
    };

    try {
        const { error } = await supabaseClient
            .from('pagos')
            .insert([pago]);

        if (error) throw error;

        alert('Pago registrado correctamente');
        closePagoForm();
        await loadPagosData();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

async function deletePago(id) {
    if (confirm('¿Estás seguro?')) {
        try {
            const { error } = await supabaseClient
                .from('pagos')
                .delete()
                .eq('id', id);

            if (error) throw error;
            await loadPagosData();
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }
}

// Logout
async function logoutAdmin() {
    await supabaseClient.auth.signOut();
    localStorage.removeItem('userRole');
    window.location.href = 'index.html';
}

// Inicializar al cargar la página
window.addEventListener('load', initAdmin);
