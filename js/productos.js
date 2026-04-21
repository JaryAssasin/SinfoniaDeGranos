async function cargarProductos() {

    const { data, error } = await supabaseClient
        .from("producto")
        .select("*");

    if (error) {
        console.log(error);
        return;
    }

    const contenedor = document.getElementById("productos");

    contenedor.innerHTML = "";

    data.forEach(prod => {
        contenedor.innerHTML += `
            <div class="card">
                <h3>${prod.nombre}</h3>
                <p>${prod.descripcion}</p>
                <strong>$${prod.precio}</strong>
                <p>Stock: ${prod.stock}</p>
                <button class="btn" onclick="agregarCarrito('${prod.nombre}', ${prod.precio}, ${prod.id_producto})">Agregar</button>
            </div>
        `;
    });

}