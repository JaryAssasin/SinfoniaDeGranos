/*
 * productos.js — Carga y renderiza productos desde Supabase
 *
 * ─── IMÁGENES DE PRODUCTOS ──────────────────────────────────────────────────
 * Cada producto tiene su imagen en la carpeta: Productos/img/
 * El nombre del archivo es el ID del producto: Productos/img/1.jpg, Productos/img/2.jpg …
 *
 * Para agregar una imagen a un producto:
 *   1. Coloca el archivo en la carpeta Productos/img/ dentro de tu repositorio
 *   2. El nombre DEBE ser el id_producto del producto: ej. "3.jpg" para id_producto = 3
 *   3. Se aceptan: .jpg, .jpeg, .png, .webp
 *   4. Si un producto no tiene imagen se muestra el ícono ☕ como placeholder
 *
 * Estructura de carpetas esperada en tu repositorio:
 *   /
 *   ├── index.html
 *   ├── principal.html
 *   ├── productos.html
 *   ├── Productos/
 *   │   └── img/
 *   │       ├── 1.jpg   ← imagen del producto con id_producto = 1
 *   │       ├── 2.jpg   ← imagen del producto con id_producto = 2
 *   │       └── ...
 *   └── js/
 * ────────────────────────────────────────────────────────────────────────────
 */

async function cargarProductos() {
    try {
        const { data, error } = await supabaseClient
            .from('producto')
            .select('*');

        const contenedor = document.getElementById('productos');
        if (!contenedor) { console.error('Elemento #productos no encontrado'); return; }

        contenedor.innerHTML = '';

        if (error) {
            contenedor.innerHTML = '<p class="vacio" style="color:red">Error cargando productos</p>';
            return;
        }
        if (!data || data.length === 0) {
            contenedor.innerHTML = '<p class="vacio">No hay productos disponibles.</p>';
            return;
        }

        data.forEach(prod => {
            const id          = prod.id_producto || prod.id;
            const nombre      = (prod.nombre || 'Sin nombre').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const descripcion = (prod.descripcion || '').replace(/</g,'&lt;').replace(/>/g,'&gt;');
            const precio      = parseFloat(prod.precio || 0).toFixed(2);
            const stock       = parseInt(prod.stock || 0);

            // Ruta de imagen: Productos/img/<id_producto>.jpg
            // Si no existe el archivo, el onerror oculta la img y muestra el placeholder
            const imgSrc = `Productos/img/${id}.jpg`;

            const html = `
                <div class="card">
                    <!-- Imagen del producto — si no existe muestra placeholder ☕ -->
                    <img
                        class="card-img"
                        src="${imgSrc}"
                        alt="${nombre}"
                        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"
                    >
                    <div class="card-img-placeholder">☕</div>

                    <div class="card-body">
                        <h3>${nombre}</h3>
                        <p class="card-desc">${descripcion || 'Café artesanal de alta calidad de Oaxaca.'}</p>
                        <div class="precio">$${precio} MXN</div>
                        <div class="stock">${stock > 0 ? `${stock} unidades disponibles` : '⚠️ Agotado'}</div>
                        <button
                            class="btn"
                            onclick="agregarCarrito('${nombre.replace(/'/g,"\\'")}', ${precio}, ${id})"
                            ${stock <= 0 ? 'disabled' : ''}
                        >
                            ${stock > 0 ? '🛒 Agregar al carrito' : 'Agotado'}
                        </button>
                    </div>
                </div>`;

            contenedor.innerHTML += html;
        });

    } catch (err) {
        console.error('Error en cargarProductos:', err);
        const contenedor = document.getElementById('productos');
        if (contenedor) contenedor.innerHTML = '<p class="vacio" style="color:red">Error al cargar productos</p>';
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarProductos);
} else {
    cargarProductos();
}