// UI utilities for JSON Viewer

/**
 * Shows a notification toast
 * @param {string} message - The message to display
 * @param {boolean} isError - Whether this is an error notification
 */
export const showNotification = (message, isError = false) => {
  const notificationDiv = document.createElement('div');
  notificationDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${isError ? '#f44336' : '#4CAF50'};
    color: white;
    padding: 15px;
    border-radius: 5px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 1000;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation keyframes
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(styleSheet);

  notificationDiv.innerHTML = message;
  document.body.appendChild(notificationDiv);

  // Remove the notification after 5 seconds with fade-out effect
  setTimeout(() => {
    notificationDiv.style.transition = 'opacity 0.5s ease-out';
    notificationDiv.style.opacity = '0';
    setTimeout(() => {
      if (notificationDiv.parentNode) {
        notificationDiv.parentNode.removeChild(notificationDiv);
      }
      styleSheet.remove();
    }, 500);
  }, 5000);
}; 