/**
 * Sistema de base de datos local para la aplicación de comparación de formularios
 */
class Database {
    constructor() {
        this.storageKey = 'formComparisonApp_data';
        this.data = this.loadData();
    }

    /**
     * Carga los datos desde localStorage
     * @returns {Object} Datos cargados
     */
    loadData() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
        
        // Datos por defecto
        return {
            users: [],
            comparisons: [],
            chatMessages: [],
            activity: [],
            stats: {
                totalComparisons: 0,
                successfulMatches: 0,
                foundDifferences: 0,
                lastUpdated: null
            }
        };
    }

    /**
     * Guarda los datos en localStorage
     */
    saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    /**
     * Agrega un usuario
     * @param {Object} user - Usuario a agregar
     */
    addUser(user) {
        const userData = {
            id: this.generateId(),
            ...user,
            createdAt: new Date().toISOString()
        };
        
        this.data.users.push(userData);
        this.saveData();
        
        this.addActivity({
            type: 'user_added',
            description: `Usuario agregado: ${user.name}`,
            details: { userId: userData.id }
        });
        
        return userData;
    }

    /**
     * Obtiene todos los usuarios
     * @returns {Array} Array de usuarios
     */
    getUsers() {
        return this.data.users || [];
    }

    /**
     * Agrega una actividad al registro
     * @param {Object} activity - Actividad a registrar
     */
    addActivity(activity) {
        const activityData = {
            id: this.generateId(),
            ...activity,
            timestamp: new Date().toISOString()
        };
        
        this.data.activity.push(activityData);
        
        // Mantener solo las últimas 100 actividades
        if (this.data.activity.length > 100) {
            this.data.activity = this.data.activity.slice(-100);
        }
        
        this.saveData();
        return activityData;
    }

    /**
     * Guarda una comparación en la base de datos
     * @param {Object} comparison - Resultado de la comparación
     */
    saveComparison(comparison) {
        const comparisonData = {
            id: this.generateId(),
            ...comparison,
            savedAt: new Date().toISOString()
        };
        
        this.data.comparisons.push(comparisonData);
        
        // Actualizar estadísticas
        this.data.stats.totalComparisons++;
        if (comparison.summary.similarityScore === 100) {
            this.data.stats.successfulMatches++;
        }
        if (comparison.summary.differentFields > 0) {
            this.data.stats.foundDifferences++;
        }
        this.data.stats.lastUpdated = new Date().toISOString();
        
        this.saveData();
        
        // Agregar actividad
        this.addActivity({
            type: 'comparison_saved',
            description: `Comparación guardada: ${comparison.files.form1} vs ${comparison.files.form2}`,
            details: {
                similarityScore: comparison.summary.similarityScore,
                differences: comparison.summary.differentFields
            }
        });
        
        return comparisonData;
    }

    /**
     * Obtiene todas las comparaciones
     * @returns {Array} Array de comparaciones
     */
    getComparisons() {
        return this.data.comparisons || [];
    }

    /**
     * Obtiene una comparación por ID
     * @param {string} id - ID de la comparación
     * @returns {Object|null} Comparación encontrada
     */
    getComparison(id) {
        return this.data.comparisons.find(comp => comp.id === id) || null;
    }

    /**
     * Agrega un mensaje al chat
     * @param {Object} message - Mensaje a agregar
     */
    addChatMessage(message) {
        const messageData = {
            id: this.generateId(),
            ...message,
            timestamp: message.timestamp || new Date().toISOString()
        };
        
        this.data.chatMessages.push(messageData);
        this.saveData();
        
        return messageData;
    }

    /**
     * Obtiene todos los mensajes del chat
     * @returns {Array} Array de mensajes
     */
    getChatMessages() {
        return this.data.chatMessages || [];
    }

    /**
     * Obtiene estadísticas del sistema
     * @returns {Object} Estadísticas
     */
    getStats() {
        return {
            totalComparisons: this.data.stats.totalComparisons || 0,
            successfulMatches: this.data.stats.successfulMatches || 0,
            foundDifferences: this.data.stats.foundDifferences || 0,
            activeUsers: this.data.users.length || 0,
            lastUpdated: this.data.stats.lastUpdated
        };
    }

    /**
     * Obtiene actividad reciente
     * @param {number} limit - Límite de actividades a retornar
     * @returns {Array} Array de actividades recientes
     */
    getRecentActivity(limit = 10) {
        return (this.data.activity || [])
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
    }

    /**
     * Obtiene el número de alertas no leídas
     * @returns {number} Número de alertas
     */
    getUnreadAlerts() {
        // En una implementación real, esto vendría de una tabla de alertas
        const recentComparisons = this.data.comparisons
            .filter(comp => {
                const compDate = new Date(comp.timestamp);
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return compDate > dayAgo && comp.summary.differentFields > 0;
            });
        
        return recentComparisons.length;
    }

    /**
     * Exporta todos los datos
     * @returns {Object} Todos los datos del sistema
     */
    exportAllData() {
        return {
            ...this.data,
            exportedAt: new Date().toISOString(),
            version: '2.0'
        };
    }

    /**
     * Limpia todos los datos
     */
    clearAllData() {
        this.data = {
            users: [],
            comparisons: [],
            chatMessages: [],
            activity: [],
            stats: {
                totalComparisons: 0,
                successfulMatches: 0,
                foundDifferences: 0,
                lastUpdated: null
            }
        };
        this.saveData();
    }

    /**
     * Genera un ID único
     * @returns {string} ID único
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
}

// Exportar para uso global
window.Database = Database;