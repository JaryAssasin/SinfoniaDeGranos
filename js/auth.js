async function register() {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    //VERIFICACIÓN CLAVE
    if (!data.user) {
        alert("El usuario no se creó correctamente (revisa confirm email)");
        return;
    }

    // 🔥 INSERTAR EN TU TABLA
    const { error: insertError } = await supabase
        .from("usuarios")
        .insert([
            {
                id: data.user.id,
                correo: email,
                nombre: "Usuario",
                rol: "cliente"
            }
        ]);

    if (insertError) {
        alert("Error guardando usuario: " + insertError.message);
        return;
    }

    alert("Usuario registrado correctamente");
}