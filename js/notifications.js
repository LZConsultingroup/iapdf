/**
 * TRAZABILITY AI - Sistema de Notificaciones
 * Maneja todas las notificaciones, alertas y mensajes del sistema
 */

class NotificationSystem {
    constructor() {
        this.toastContainer = null;
        this.init();
    }

    /**
     * Inicializa el sistema de notificaciones
     */
    init() {
        this.toastContainer = document.getElementById('toastContainer');
        if (!this.toastContainer) {
            console.warn('Toast container not found');
        }
    }

    /**
     * Muestra una notificación toast
     * @param {string} title - Título de la notificación
     * @param {string} message - Mensaje de la notificación
     * @param {string} type - Tipo de notificación (success, error, warning, info)
     * @param {number} duration - Duración en milisegundos (default: 5000)
     */
    showToast(title, message, type = 'info', duration = 5000) {
        if (!this.toastContainer) {
            console.warn('Toast container not available');
            return;
        }

        const toast = this.createToastElement(title, message, type);
        this.toastContainer.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            this.removeToast(toast);
        }, duration);

        return toast;
    }

    /**
     * Crea un elemento toast
     * @param {string} title - Título
     * @param {string} message - Mensaje
     * @param {string} type - Tipo
     * @returns {HTMLElement} Elemento toast
     */
    createToastElement(title, message, type) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const header = document.createElement('div');
        header.className = 'toast-header';

        const titleElement = document.createElement('div');
        titleElement.className = 'toast-title';
        titleElement.textContent = title;

        const closeButton = document.createElement('button');
        closeButton.className = 'toast-close';
        closeButton.innerHTML = '×';
        closeButton.addEventListener('click', () => this.removeToast(toast));

        header.appendChild(titleElement);
        header.appendChild(closeButton);

        const messageElement = document.createElement('div');
        messageElement.className = 'toast-message';
        messageElement.textContent = message;

        toast.appendChild(header);
        toast.appendChild(messageElement);

        return toast;
    }

    /**
     * Remueve un toast
     * @param {HTMLElement} toast - Elemento toast a remover
     */
    removeToast(toast) {
        if (toast && toast.parentNode) {
            toast.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }
    }

    /**
     * Muestra una notificación de éxito
     * @param {string} title - Título
     * @param {string} message - Mensaje
     */
    showSuccess(title, message) {
        return this.showToast(title, message, 'success');
    }

    /**
     * Muestra una notificación de error
     * @param {string} title - Título
     * @param {string} message - Mensaje
     */
    showError(title, message) {
        return this.showToast(title, message, 'error');
    }

    /**
     * Muestra una notificación de advertencia
     * @param {string} title - Título
     * @param {string} message - Mensaje
     */
    showWarning(title, message) {
        return this.showToast(title, message, 'warning');
    }

    /**
     * Muestra una notificación informativa
     * @param {string} title - Título
     * @param {string} message - Mensaje
     */
    showInfo(title, message) {
        return this.showToast(title, message, 'info');
    }

    /**
     * Limpia todas las notificaciones
     */
    clearAll() {
        if (this.toastContainer) {
            this.toastContainer.innerHTML = '';
        }
    }

    /**
     * Solicita permisos de notificación del navegador
     */
    async requestNotificationPermission() {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return false;
    }

    /**
     * Envía una notificación del navegador
     * @param {string} title - Título
     * @param {string} message - Mensaje
     * @param {Object} options - Opciones adicionales
     */
    sendBrowserNotification(title, message, options = {}) {
        if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification(title, {
                body: message,
                icon: '/favicon.ico',
                ...options
            });

            // Auto-close after 5 seconds
            setTimeout(() => {
                notification.close();
            }, 5000);

            return notification;
        }
    }

    /**
     * Simula envío de WhatsApp
     * @param {string} phone - Número de teléfono
     * @param {string} message - Mensaje
     */
    sendWhatsApp(phone, message) {
        console.log(`📱 WhatsApp simulado a ${phone}: ${message}`);
        return Promise.resolve({
            success: true,
            message: 'WhatsApp enviado correctamente (simulado)'
        });
    }

    /**
     * Simula envío de Email
     * @param {string} email - Email destinatario
     * @param {string} subject - Asunto
     * @param {string} message - Mensaje
     */
    sendEmail(email, subject, message) {
        console.log(`📧 Email simulado a ${email}: ${subject} - ${message}`);
        return Promise.resolve({
            success: true,
            message: 'Email enviado correctamente (simulado)'
        });
    }
}

// Exportar para uso global
window.NotificationSystem = NotificationSystem;