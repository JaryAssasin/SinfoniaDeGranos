async function cargarProductos() {
    try {
        const { data, error } = await supabaseClient
            .from("producto")
            .select("*");

        const contenedor = document.getElementById("productos");

        if (!contenedor) {
            console.error('Elemento con id "productos" no encontrado');
            return;
        }

        contenedor.innerHTML = "";

        if (error) {
            console.error('Error de Supabase:', error);
            contenedor.innerHTML = '<p style="color: red;">Error cargando productos</p>';
            return;
        }

        if (!data || data.length === 0) {
            contenedor.innerHTML = '<p>No hay productos disponibles.</p>';
            return;
        }

        data.forEach(prod => {
            const nombre = (prod.nombre || 'Sin nombre').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const descripcion = (prod.descripcion || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const precio = parseFloat(prod.precio || 0).toFixed(2);
            const stock = parseInt(prod.stock || 0);
            const id = prod.id_producto || prod.id;

            const html = `
                <div class="card">
                    <h3>${nombre}</h3>
                    <p>${descripcion}</p>
                    <strong>$${precio}</strong>
                    <p>Stock: ${stock}</p>
                    <button class="btn" onclick="agregarCarrito('${nombre.replace(/'/g, "\\'")}', ${precio}, ${id})">
                        Agregar ${stock > 0 ? '' : '(Agotado)'}
                    </button>
                </div>
            `;

            contenedor.innerHTML += html;
        });
    } catch (err) {
        console.error('Error en cargarProductos:', err);
        const contenedor = document.getElementById("productos");
        if (contenedor) {
            contenedor.innerHTML = '<p style="color: red;">Error al cargar productos</p>';
        }
    }
}

// Ejecutar al cargar la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarProductos);
} else {
    cargarProductos();
}
