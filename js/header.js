/**
 * header.js — Funciones compartidas del header (pill de usuario, sesión, navegación)
 * Incluir en todas las páginas con: <script src="js/header.js"></script>
 *
 * Requiere que el HTML tenga:
 *   - id="pillAvatar"   → div/span del avatar
 *   - id="pillNombre"   → span del nombre
 *   - id="menuUsuario"  → div del dropdown
 *   - id="btnAdmin"     → botón admin (opcional, se oculta si no es admin)
 */

// ── Primer nombre solamente ─────────────────────────────────────────────────
function primerNombre(nombreCompleto) {
    if (!nombreCompleto) return 'Usuario';
    return nombreCompleto.trim().split(/\s+/)[0];
}

// ── Cargar pill de usuario en header ───────────────────────────────────────
async function initHeader() {
    try {
        const { data: sessionData } = await supabaseClient.auth.getSession();
        if (!sessionData.session) {
            window.location.href = 'index.html';
            return null;
        }

        const uid = sessionData.session.user.id;

        // Intentar cargar desde Supabase primero
        const { data: user } = await supabaseClient
            .from('usuarios')
            .select('nombre, rol, foto_url')
            .eq('id', uid)
            .single();

        const nombre  = user?.nombre   || localStorage.getItem('userName') || 'Usuario';
        const fotoUrl = user?.foto_url  || localStorage.getItem('userFoto') || '';
        const rol     = user?.rol       || localStorage.getItem('userRole') || 'cliente';

        // Persistir en localStorage para offline / recarga rápida
        if (user?.nombre)    localStorage.setItem('userName', user.nombre);
        if (user?.rol)       localStorage.setItem('userRole', user.rol);
        if (user?.foto_url)  localStorage.setItem('userFoto', user.foto_url);
        localStorage.setItem('userId', uid);
        localStorage.setItem('isLoggedIn', 'true');

        // Actualizar pill
        renderPill(nombre, fotoUrl);

        // Mostrar botón admin si corresponde
        const btnAdmin = document.getElementById('btnAdmin');
        if (btnAdmin) {
            btnAdmin.style.display = (rol === 'admin' || rol === 'vendedor') ? 'block' : 'none';
        }

        return { nombre, fotoUrl, rol, uid };
    } catch (err) {
        console.error('Error en initHeader:', err);
        // Fallback localStorage
        const nombre  = localStorage.getItem('userName') || 'Usuario';
        const fotoUrl = localStorage.getItem('userFoto') || '';
        renderPill(nombre, fotoUrl);
        return null;
    }
}

function renderPill(nombre, fotoUrl) {
    const avatarEl = document.getElementById('pillAvatar');
    const nombreEl = document.getElementById('pillNombre');

    if (nombreEl) nombreEl.textContent = primerNombre(nombre);

    if (avatarEl) {
        if (fotoUrl && fotoUrl !== 'null' && fotoUrl !== '') {
            // Agregar cache-buster para que recargue la imagen al volver a iniciar sesión
            const src = fotoUrl.includes('?') ? fotoUrl : fotoUrl + '?t=' + Date.now();
            avatarEl.innerHTML = `<img src="${src}" alt="avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.parentElement.textContent='${primerNombre(nombre)[0].toUpperCase()}'">`;
        } else {
            avatarEl.textContent = primerNombre(nombre)[0].toUpperCase();
        }
    }
}

// ── Toggle dropdown ─────────────────────────────────────────────────────────
function toggleMenu() {
    const m = document.getElementById('menuUsuario');
    if (!m) return;
    m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
}

// Cerrar al click fuera
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
    ['carrito','userRole','userName','isLoggedIn','userRoleNormalized','userFoto','userId']
        .forEach(k => localStorage.removeItem(k));
    window.location.href = 'index.html';
}

// ── Redes sociales HTML (para footer y secciones) ────────────────────────────
// Cambia estos valores por tus URLs reales
const REDES = {
    instagram: 'https://instagram.com/TU_USUARIO_IG',
    facebook:  'https://facebook.com/TU_PAGINA_FB'
};