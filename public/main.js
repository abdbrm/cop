let longPressTimer = null;

function setupLongPress(selector, permKey) {
  const el = document.querySelector(selector);
  if (!el) return;

  let isDown = false;

  const start = () => {
    isDown = true;
    longPressTimer = setTimeout(() => {
      if (isDown) {
        fetch('/abdo/permissions/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: permKey })
        })
          .then(r => r.json())
          .then(d => {
            if (!d.ok) return alert('Ошибка обновления прав');
            alert('Права обновлены: ' + permKey + ' = ' + (d.value ? 'Разрешено' : 'Скрыто'));
            location.reload();
          })
          .catch(() => alert('Ошибка обновления прав'));
      }
    }, 700);
  };

  const cancel = () => {
    isDown = false;
    if (longPressTimer) clearTimeout(longPressTimer);
  };

  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start);
  el.addEventListener('mouseup', cancel);
  el.addEventListener('mouseleave', cancel);
  el.addEventListener('touchend', cancel);
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.perm-target').forEach(el => {
    const key = el.getAttribute('data-perm-key');
    if (key) setupLongPress(`[data-perm-key="${key}"]`, key);
  });
});
