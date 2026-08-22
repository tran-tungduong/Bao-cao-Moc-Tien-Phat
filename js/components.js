// Reusable UI Components and Utility Helpers

export const Toast = {
  show(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';

    toast.innerHTML = `
      <i class="fas ${icon}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    // Auto remove after 3s
    setTimeout(() => {
      toast.classList.add('fadeOut');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, 3000);
  },
  
  success(message) { this.show(message, 'success'); },
  error(message) { this.show(message, 'error'); },
  info(message) { this.show(message, 'info'); }
};

export const Modal = {
  create(title, contentHtml) {
    // Remove existing modal if any
    const existing = document.getElementById('app-modal');
    if (existing) existing.remove();

    // Prevent iOS/PWA from scrolling the page behind an open dialog.
    document.body.classList.add('modal-open');

    const overlay = document.createElement('div');
    overlay.id = 'app-modal';
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
      <div class="modal-drawer" role="dialog" aria-modal="true" aria-labelledby="modal-dialog-title">
        <div class="drawer-drag-handle"></div>
        <div class="drawer-header">
          <h3 class="drawer-title" id="modal-dialog-title">${title}</h3>
          <button class="drawer-close" id="modal-close-btn" type="button" aria-label="Đóng cửa sổ">&times;</button>
        </div>
        <div class="drawer-body">
          ${contentHtml}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => overlay.classList.add('active'), 50);

    const close = () => {
      let finished = false;
      const finishClose = () => {
        if (finished) return;
        finished = true;
        overlay.remove();
        if (!document.querySelector('.modal-overlay')) {
          document.body.classList.remove('modal-open');
        }
      };
      overlay.classList.remove('active');
      overlay.addEventListener('transitionend', finishClose, { once: true });
      // Older iOS WebViews may skip transitionend after an app resumes.
      setTimeout(finishClose, 400);
    };

    overlay.querySelector('#modal-close-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    return {
      element: overlay,
      close: close
    };
  }
};

// Simple Mock Image Generator
export const MockImages = {
  getRandomKitchen() {
    const urls = [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1556909212-d5b604dadb72?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1565538810844-1e1194826c06?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=400&auto=format&fit=crop&q=60'
    ];
    return urls[Math.floor(Math.random() * urls.length)];
  },
  
  getRandomLivingRoom() {
    const urls = [
      'https://images.unsplash.com/photo-1618221381711-42ca8ab6e908?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=400&auto=format&fit=crop&q=60',
      'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&auto=format&fit=crop&q=60'
    ];
    return urls[Math.floor(Math.random() * urls.length)];
  }
};
