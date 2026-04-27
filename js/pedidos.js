// Verificar sesión
(function() {
    if (!localStorage.getItem('isLoggedIn')) {
        window.location.href = 'index.html';
    }
})();

let editingPedidoId = null;
let allPedidos = [];

// Cargar pedidos al cargar la página
async function cargarPedidos() {
    try {
        const { data, error } = await supabaseClient
            .from("pedido")
            .select("*");

        const tbody = document.querySelector("#tablaPedidos tbody");
        tbody.innerHTML = "";

        if (error) {
            tbody.innerHTML = `<tr><td colspan='8' style="color: #ff6b6b;">Error cargando pedidos</td></tr>`;
            return;
        }

        if (!data || data.length === 0) {
            tbody.innerHTML = `<tr><td colspan='8'>No hay pedidos registrados</td></tr>`;
            return;
        }

        allPedidos = data;
        renderPedidosTable(data);

    } catch (error) {
        console.error('Error:', error);
    }
}

function renderPedidosTable(data) {
    const tbody = document.querySelector("#tablaPedidos tbody");
    let html = '';

    data.forEach(ped => {
        const fecha = ped.fecha ? new Date(ped.fecha).toLocaleDateString() : 'N/A';
        const estadoColor = ped.estado === 'completado' ? '#6ee7b7' : ped.estado === 'pendiente' ? '#ffbe3b' : '#ff6b6b';
        const metodoTexto = ped.metodo_pago === 'transferencia' ? '🏦 Transferencia' : ped.metodo_pago === 'contraentrega' ? '💵 Contraentrega' : '❓ Sin definir';
        const pagadoTexto = ped.pagado ? '✅ Sí' : '❌ No';

        html += `
            <tr>
                <td>${ped.id_pedido || ped.id || ''}</td>
                <td>${fecha}</td>
                <td>$${(ped.total || 0).toFixed(2)}</td>
                <td><span style="background: ${estadoColor}; color: #000; padding: 4px 8px; border-radius: 3px; font-weight: bold;">${ped.estado || 'N/A'}</span></td>
                <td>${metodoTexto}</td>
                <td>${pagadoTexto}</td>
                <td>${ped.id_cliente || ''}</td>
                <td style="display: flex; gap: 5px; flex-wrap: wrap;">
                    <button class="btn btn-sm btn-primary" onclick="editarPedido(${ped.id_pedido || ped.id})">✏️ Editar</button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarPedido(${ped.id_pedido || ped.id})">🗑️ Eliminar</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// Buscar pedidos
function buscarPedidos() {
    const searchTerm = document.getElementById('searchPedidos')?.value.toLowerCase() || '';
    const filtered = allPedidos.filter(ped => {
        const fecha = ped.fecha ? new Date(ped.fecha).toLocaleDateString() : '';
        return (
            (ped.id_pedido?.toString() || '').includes(searchTerm) ||
            fecha.includes(searchTerm) ||
            (ped.total?.toString() || '').includes(searchTerm) ||
            (ped.estado || '').toLowerCase().includes(searchTerm) ||
            (ped.id_cliente?.toString() || '').includes(searchTerm)
        );
    });
    renderPedidosTable(filtered);
}

// Crear nuevo pedido
document.addEventListener('DOMContentLoaded', () => {
    cargarPedidos();

    // Form crear pedido
    const formCrear = document.getElementById('formCrearPedido');
    if (formCrear) {
        formCrear.addEventListener('submit', async (e) => {
            e.preventDefault();

            const pedido = {
                fecha: document.querySelector('input[name="fecha_pedido"]').value,
                total: parseFloat(document.querySelector('input[name="total"]').value),
                estado: document.querySelector('input[name="estado"]').value,
                metodo_pago: document.querySelector('select[name="metodo_pago"]')?.value || null,
                pagado: document.querySelector('input[name="pagado"]')?.checked || false,
                id_cliente: parseInt(document.querySelector('input[name="id_cliente"]').value) || null
            };

            try {
                const { error } = await supabaseClient.from('pedido').insert([pedido]);

                if (error) throw error;

                $('#modalCrearPedido').modal('hide');
                formCrear.reset();
                await cargarPedidos();
                mostrarNotificacion('Pedido creado exitosamente', 'success');
            } catch (error) {
                console.error('Error:', error);
                alert('Error al crear pedido: ' + error.message);
            }
        });
    }

    // Form editar pedido
    const formEditar = document.getElementById('formEditarPedido');
    if (formEditar) {
        formEditar.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = document.getElementById('edit_id_pedido').value;
            const pedido = {
                fecha: document.getElementById('edit_fecha_pedido').value,
                total: parseFloat(document.getElementById('edit_total').value),
                estado: document.getElementById('edit_estado').value,
                metodo_pago: document.getElementById('edit_metodo_pago')?.value || null,
                pagado: document.getElementById('edit_pagado')?.checked || false,
                id_cliente: parseInt(document.getElementById('edit_id_cliente').value) || null
            };

            try {
                const { error } = await supabaseClient
                    .from('pedido')
                    .update(pedido)
                    .eq('id_pedido', id);

                if (error) throw error;

                $('#modalEditarPedido').modal('hide');
                await cargarPedidos();
                mostrarNotificacion('Pedido actualizado exitosamente', 'success');
            } catch (error) {
                console.error('Error:', error);
                alert('Error al actualizar pedido: ' + error.message);
            }
        });
    }

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userRole');
        window.location.href = 'index.html';
    });

    // Búsqueda
    const searchInput = document.getElementById('searchPedidos');
    if (searchInput) {
        searchInput.addEventListener('keyup', buscarPedidos);
    }
});

async function editarPedido(id) {
    try {
        const { data, error } = await supabaseClient
            .from('pedido')
            .select('*')
            .eq('id_pedido', id)
            .single();

        if (error) throw error;

        document.getElementById('edit_id_pedido').value = data.id_pedido;
        document.getElementById('edit_fecha_pedido').value = data.fecha || '';
        document.getElementById('edit_total').value = data.total || 0;
        document.getElementById('edit_estado').value = data.estado || '';
        document.getElementById('edit_metodo_pago').value = data.metodo_pago || '';
        document.getElementById('edit_pagado').checked = data.pagado || false;
        document.getElementById('edit_id_cliente').value = data.id_cliente || '';

        $('#modalEditarPedido').modal('show');
    } catch (error) {
        console.error('Error:', error);
        alert('Error cargando pedido');
    }
}

async function eliminarPedido(id) {
    if (!confirm('¿Seguro de eliminar este pedido?')) return;

    try {
        const { error } = await supabaseClient
            .from('pedido')
            .delete()
            .eq('id_pedido', id);

        if (error) throw error;

        await cargarPedidos();
        mostrarNotificacion('Pedido eliminado', 'success');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar pedido');
    }
}

// Notificaciones simples
function mostrarNotificacion(mensaje, tipo = 'info') {
    const div = document.createElement('div');
    div.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${tipo === 'success' ? '#6ee7b7' : '#ffbe3b'};
        color: #000;
        border-radius: 6px;
        z-index: 9999;
        animation: slideIn 0.3s ease-in-out;
    `;
    div.textContent = mensaje;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}
