console.log(window.supabaseClient);
async function register(e) {

    e.preventDefault();

    const nombre = document.getElementById("nombre").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    const { data, error } = await supabaseClient.auth.signUp({
        email,
        password
    });

    if (error) {
        alert(error.message);
        return;
    }

    if (!data.user) {
        alert("Revisa tu correo para confirmar");
        return;
    }

    const { error: insertError } = await supabaseClient
    .from("usuarios")
    .insert([{
        id: data.user.id,
        correo: email,
        nombre: nombre,
        rol: "cliente"
    }]);

    if (insertError) {
        alert("Error guardando usuario: " + insertError.message);
        return;
    }

    alert("Registro exitoso ");
    window.location.href = "index.html";
}