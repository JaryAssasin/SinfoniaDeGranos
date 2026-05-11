/**
 * header.js — Funciones compartidas del header (pill de usuario, sesión, navegación)
 * Incluir en todas las páginas con: <script src="js/header.js"></script>
 *
 * Tabla usuarios: id, nombre, correo, rol
 * Fotos de perfil: Storage bucket "avatares" → avatares/{uid}/avatar.png
 */

// ── Primer nombre solamente ─────────────────────────────────────────────────
function primerNombre(nombreCompleto) {
    if (!nombreCompleto) return 'Usuario';
    return nombreCompleto.trim().split(/\s+/)[0];
}

// ── URL pública del avatar desde Storage ────────────────────────────────────
function getAvatarUrl(uid) {
    // Bucket público: construimos la URL directamente
    const { data } = supabaseClient.storage
        .from('avatares')
        .getPublicUrl(`${uid}/avatar.png`);
    // Añadir cache-buster para que siempre cargue la versión más reciente
    return data?.publicUrl ? data.publicUrl + '?t=' + Date.now() : null;
}

// ── Espera la sesión real de Supabase (evita race condition al cargar) ──────
function esperarSesion() {
    return new Promise((resolve) => {
        const { data: { subscription } } = supabaseClient.auth.onAuthStateChange(
            (event, session) => {
                subscription.unsubscribe();
                resolve(session);
            }
        );
        setTimeout(() => resolve(null), 4000);
    });
}

// ── Cargar pill de usuario en header ───────────────────────────────────────
async function initHeader() {
    try {
        // 1. Obtener sesión
        let { data: sessionData } = await supabaseClient.auth.getSession();

        // 2. Si aún no hay sesión, esperar al evento de Auth (resuelve race condition)
        if (!sessionData.session) {
            const session = await esperarSesion();
            if (!session) {
                window.location.href = 'index.html';
                return null;
            }
            sessionData = { session };
        }

        const uid = sessionData.session.user.id;

        // 3. Leer datos del usuario desde la tabla
        const { data: user, error: userError } = await supabaseClient
            .from('usuarios')
            .select('nombre, rol, correo')
            .eq('id', uid)
            .single();

        // 4. Usuario eliminado de la tabla → cerrar sesión
        if (userError?.code === 'PGRST116' || (userError && !user)) {
            await supabaseClient.auth.signOut();
            ['carrito','userRole','userName','isLoggedIn','userRoleNormalized','userId']
                .forEach(k => localStorage.removeItem(k));
            window.location.href = 'index.html';
            return null;
        }

        // 5. Error de red genérico → fallback sin redirigir
        if (userError || !user) {
            const nombre = localStorage.getItem('userName') || 'Usuario';
            const rol    = localStorage.getItem('userRole')  || 'cliente';
            renderPill(nombre, null);
            mostrarBtnAdmin(rol);
            return { nombre, rol, uid };
        }

        // 6. Todo bien
        const nombre    = user.nombre || localStorage.getItem('userName') || 'Usuario';
        const rol       = user.rol    || localStorage.getItem('userRole')  || 'cliente';
        const avatarUrl = getAvatarUrl(uid);

        localStorage.setItem('userName',   nombre);
        localStorage.setItem('userRole',   rol);
        localStorage.setItem('userId',     uid);
        localStorage.setItem('isLoggedIn', 'true');

        renderPill(nombre, avatarUrl);
        mostrarBtnAdmin(rol);

        return { nombre, rol, uid, avatarUrl };

    } catch (err) {
        console.error('Error en initHeader:', err);
        const nombre = localStorage.getItem('userName') || 'Usuario';
        const rol    = localStorage.getItem('userRole')  || 'cliente';
        renderPill(nombre, null);
        mostrarBtnAdmin(rol);
        return null;
    }
}

// ── Renderizar pill ─────────────────────────────────────────────────────────
function renderPill(nombre, avatarUrl) {
    const avatarEl = document.getElementById('pillAvatar');
    const nombreEl = document.getElementById('pillNombre');
    const inicial  = primerNombre(nombre)[0].toUpperCase();

    if (nombreEl) nombreEl.textContent = primerNombre(nombre);

    if (avatarEl) {
        if (avatarUrl) {
            avatarEl.innerHTML = `<img
                src="${avatarUrl}"
                alt="avatar"
                style="width:100%;height:100%;object-fit:cover;border-radius:50%"
                onerror="this.parentElement.textContent='${inicial}'"
            >`;
        } else {
            avatarEl.textContent = inicial;
        }
    }
}

// ── Mostrar / ocultar botón admin ───────────────────────────────────────────
function mostrarBtnAdmin(rol) {
    const btnAdmin = document.getElementById('btnAdmin');
    if (btnAdmin) {
        btnAdmin.style.display = (rol === 'admin' || rol === 'vendedor') ? 'block' : 'none';
    }
}

// ── Toggle dropdown ─────────────────────────────────────────────────────────
function toggleMenu() {
    const m = document.getElementById('menuUsuario');
    if (!m) return;
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}

document.addEventListener('click', e => {
    const um = document.querySelector('.user-menu');
    const m  = document.getElementById('menuUsuario');
    if (um && m && !um.contains(e.target)) m.style.display = 'none';
});

// ── Navegación ───────────────────────────────────────────────────────────────
function irInicio()    { window.location.href = 'principal.html'; }
function irProductos() { window.location.href = 'productos.html'; }
function irPerfil()    { window.location.href = 'perfil.html'; }
function irAdmin()     { window.location.href = 'admin.html'; }
function irHistorial() { window.location.href = 'historial.html'; }

// ── Logout ───────────────────────────────────────────────────────────────────
async function logout() {
    await supabaseClient.auth.signOut();
    ['carrito','userRole','userName','isLoggedIn','userRoleNormalized','userId']
        .forEach(k => localStorage.removeItem(k));
    window.location.href = 'index.html';
}

// ── URLs de redes sociales ───────────────────────────────────────────────────
const REDES = {
    instagram: 'https://www.instagram.com/sinfoniadegranos00/',
    facebook:  'https://www.facebook.com/profile.php?id=61555563284916'
};