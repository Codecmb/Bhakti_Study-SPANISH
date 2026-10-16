(function () {
  'use strict';

  const panel = document.createElement('div');
  panel.id = 'bhakti-update-panel';
  panel.innerHTML = `
    <button id="bhakti-check-update" type="button">
      ↻ Buscar actualizaciones
    </button>
    <span id="bhakti-update-message" role="status" aria-live="polite"></span>
  `;

  const style = document.createElement('style');
  style.textContent = `
    #bhakti-update-panel {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 15px;
      margin: 20px 0;
      background: #eef3ff;
      border: 1px solid #cbd8f5;
      border-radius: 14px;
      font-family: Arial, sans-serif;
    }
    #bhakti-check-update {
      background: linear-gradient(135deg,#233e88,#6554b6);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 12px 18px;
      font-weight: bold;
      font-size: 15px;
      cursor: pointer;
    }
    #bhakti-check-update:disabled {
      opacity: .65;
      cursor: wait;
    }
    #bhakti-update-message {
      color: #233e88;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);

  // Posición fija, independiente de los estilos de la portada.
  panel.style.setProperty('position', 'fixed', 'important');
  panel.style.setProperty('top', '12px', 'important');
  panel.style.setProperty('right', '12px', 'important');
  panel.style.setProperty('left', 'auto', 'important');
  panel.style.setProperty('z-index', '9999', 'important');
  panel.style.setProperty('margin', '0', 'important');
  panel.style.setProperty('padding', '0', 'important');
  panel.style.setProperty('background', 'transparent', 'important');
  panel.style.setProperty('border', 'none', 'important');


  const target = document.querySelector('#offline-books-status');

  if (!target) return;

  target.before(panel);

  const button = document.getElementById('bhakti-check-update');
  const message = document.getElementById('bhakti-update-message');

  button.addEventListener('click', async function () {
    if (button.dataset.action === 'reload') {
      window.location.reload();
      return;
    }

    button.disabled = true;
    message.textContent = 'Buscando actualizaciones…';

    try {
      if (!('serviceWorker' in navigator)) {
        message.textContent =
          'Este navegador no admite actualizaciones automáticas.';
        return;
      }

      const registration =
        await navigator.serviceWorker.getRegistration();

      if (!registration) {
        message.textContent =
          'No hay un servicio de actualización registrado.';
        return;
      }

      await registration.update();

      if (registration.waiting) {
        message.textContent =
          'Hay una actualización preparada. Cierra y vuelve a abrir la aplicación.';
      } else if (registration.installing) {
        message.textContent =
          'Se está preparando una nueva versión. Vuelve a comprobar en unos momentos.';
      } else {
        message.textContent =
          'Comprobación completada. Puedes recargar la aplicación para ver los cambios publicados.';

        button.textContent = '↻ Recargar aplicación';
        button.dataset.action = 'reload';
      }

    } catch (error) {
      message.textContent =
        'No se pudo comprobar la actualización. Revisa tu conexión.';
      console.error(error);
    } finally {
      button.disabled = false;
    }
  });
})();
