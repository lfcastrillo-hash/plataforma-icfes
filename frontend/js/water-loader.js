/* ==========================================================================
   water-loader.js
   ========================================================================== */

let _animFrame          = null;
let _waveOffset         = 0;
let _animando           = false;
let _resultadoPendiente = null;

const DURACION = 5000;

// Lista de mensajes que irán cambiando suavemente a lo largo de los 5 segundos
const MENSAJES_CARGA = [
  'Activando tu progreso...',
  'Construyendo tu futuro...',
  'Ajustando todo para ti...',
  'Un paso más cerca de tus metas...',
  'Tu futuro está cargando...'
];

function mostrarWaterLoader() {
  document.getElementById('hero-login-form').style.display = 'none';
  document.getElementById('water-loader').style.display    = 'flex';

  _waveOffset         = 0;
  _animando           = true;
  _resultadoPendiente = null;

  document.getElementById('water-rect').setAttribute('y', '110');
  document.getElementById('wave-path').setAttribute('d', '');
  
  // Mensaje inicial limpio
  document.getElementById('loader-msg').textContent = MENSAJES_CARGA[0];

  const inicio = performance.now();

  function frame(ts) {
    const progress = Math.min((ts - inicio) / DURACION, 1);

    // Sube lineal y constante
    const yRect = 110 - (progress * 110);

    // Ola suave: amplitud pequeña, frecuencia baja
    _waveOffset += 0.5;
    let d = 'M -10 ' + yRect;
    for (let x = -10; x <= 230; x += 6) {
      const y = yRect - 3 * Math.sin((x * 0.04 + _waveOffset * 0.06) * Math.PI);
      d += ' L ' + x + ' ' + y;
    }
    d += ' L 230 120 L -10 120 Z';

    document.getElementById('water-rect').setAttribute('y', yRect);
    document.getElementById('wave-path').setAttribute('d', d);

    // === NUEVO: Control de Mensajes Dinámicos ===
    // Divide equitativamente los 5 segundos entre la cantidad de mensajes
    const indiceMensaje = Math.min(
      Math.floor(progress * MENSAJES_CARGA.length),
      MENSAJES_CARGA.length - 1
    );
    document.getElementById('loader-msg').textContent = MENSAJES_CARGA[indiceMensaje];

    if (progress < 1) {
      _animFrame = requestAnimationFrame(frame);
    } else {
      _animando = false;
      if (_resultadoPendiente) _resultadoPendiente();
    }
  }

  _animFrame = requestAnimationFrame(frame);
}

function waterLoaderExito(urlDestino) {
  const accion = function() {
    document.getElementById('water-rect').setAttribute('y', '0');
    document.getElementById('wave-path').setAttribute('d', '');
    setTimeout(function() {
      window.location.href = urlDestino || 'dashboard.html';
    }, 400);
  };

  if (_animando) {
    _resultadoPendiente = accion;
  } else {
    accion();
  }
}

function waterLoaderError(mensajeError) {
  _animando           = false;
  _resultadoPendiente = null;
  cancelAnimationFrame(_animFrame);

  document.getElementById('water-loader').style.display    = 'none';
  document.getElementById('hero-login-form').style.display = 'block';

  mostrarFeedback('hero-login-form', mensajeError || 'Correo o contraseña incorrectos.');
}

function alternarHeroForm(cual) {
  document.getElementById('water-loader').style.display = 'none';
  if (cual === 'registro') {
    document.getElementById('hero-login-form').style.display    = 'none';
    document.getElementById('hero-registro-form').style.display = 'block';
  } else {
    document.getElementById('hero-registro-form').style.display = 'none';
    document.getElementById('hero-login-form').style.display    = 'block';
  }
}