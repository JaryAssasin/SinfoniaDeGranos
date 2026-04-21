async function cargarProductos() {

    const { data, error } = await supabaseClient
        .from("productos")
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
                <button class="btn" onclick="agregarCarrito('${prod.nombre}', ${prod.precio})">Agregar</button>
            </div>
        `;
    });

}