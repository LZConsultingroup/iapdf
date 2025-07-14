@@ .. @@
         this.data = {
             users: [],
             comparisons: [],
             chatMessages: [],
-            activity: []
+            activity: [],
+            stats: {
+                totalComparisons: 0,
+                successfulMatches: 0,
+                foundDifferences: 0,
+                lastUpdated: null
+            }
         };
@@ .. @@
     }

+    /**
+     * Guarda una comparación en la base de datos
+     * @param {Object} comparison - Resultado de la comparación
+     */
+    saveComparison(comparison) {
+        const comparisonData = {
+            id: this.generateId(),
+            ...comparison,
+            savedAt: new Date().toISOString()
+        };
+        
+        this.data.comparisons.push(comparisonData);
+        
+        // Actualizar estadísticas
+        this.data.stats.totalComparisons++;
+        if (comparison.summary.similarityScore === 100) {
+            this.data.stats.successfulMatches++;
+        }
+        if (comparison.summary.differentFields > 0) {
+            this.data.stats.foundDifferences++;
+        }
+        this.data.stats.lastUpdated = new Date().toISOString();
+        
+        this.saveData();
+        
+        // Agregar actividad
+        this.addActivity({
+            type: 'comparison_saved',
+            description: `Comparación guardada: ${comparison.files.form1} vs ${comparison.files.form2}`,
+            details: {
+                similarityScore: comparison.summary.similarityScore,
+                differences: comparison.summary.differentFields
+            }
+        });
+        
+        return comparisonData;
+    }

+    /**
+     * Obtiene todas las comparaciones
+     * @returns {Array} Array de comparaciones
+     */
+    getComparisons() {
+        return this.data.comparisons || [];
+    }

+    /**
+     * Obtiene una comparación por ID
+     * @param {string} id - ID de la comparación
+     * @returns {Object|null} Comparación encontrada
+     */
+    getComparison(id) {
+        return this.data.comparisons.find(comp => comp.id === id) || null;
+    }

+    /**
+     * Agrega un mensaje al chat
+     * @param {Object} message - Mensaje a agregar
+     */
+    addChatMessage(message) {
+        const messageData = {
+            id: this.generateId(),
+            ...message,
+            timestamp: message.timestamp || new Date().toISOString()
+        };
+        
+        this.data.chatMessages.push(messageData);
+        this.saveData();
+        
+        return messageData;
+    }

+    /**
+     * Obtiene todos los mensajes del chat
+     * @returns {Array} Array de mensajes
+     */
+    getChatMessages() {
+        return this.data.chatMessages || [];
+    }

+    /**
+     * Obtiene estadísticas del sistema
+     * @returns {Object} Estadísticas
+     */
+    getStats() {
+        return {
+            totalComparisons: this.data.stats.totalComparisons || 0,
+            successfulMatches: this.data.stats.successfulMatches || 0,
+            foundDifferences: this.data.stats.foundDifferences || 0,
+            activeUsers: this.data.users.length || 0,
+            lastUpdated: this.data.stats.lastUpdated
+        };
+    }

+    /**
+     * Obtiene actividad reciente
+     * @param {number} limit - Límite de actividades a retornar
+     * @returns {Array} Array de actividades recientes
+     */
+    getRecentActivity(limit = 10) {
+        return (this.data.activity || [])
+            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
+            .slice(0, limit);
+    }

+    /**
+     * Obtiene el número de alertas no leídas
+     * @returns {number} Número de alertas
+     */
+    getUnreadAlerts() {
+        // En una implementación real, esto vendría de una tabla de alertas
+        const recentComparisons = this.data.comparisons
+            .filter(comp => {
+                const compDate = new Date(comp.timestamp);
+                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
+                return compDate > dayAgo && comp.summary.differentFields > 0;
+            });
+        
+        return recentComparisons.length;
+    }

+    /**
+     * Exporta todos los datos
+     * @returns {Object} Todos los datos del sistema
+     */
+    exportAllData() {
+        return {
+            ...this.data,
+            exportedAt: new Date().toISOString(),
+            version: '2.0'
+        };
+    }

+    /**
+     * Limpia todos los datos
+     */
+    clearAllData() {
+        this.data = {
+            users: [],
+            comparisons: [],
+            chatMessages: [],
+            activity: [],
+            stats: {
+                totalComparisons: 0,
+                successfulMatches: 0,
+                foundDifferences: 0,
+                lastUpdated: null
+            }
+        };
+        this.saveData();
+    }
+
     /**
      * Genera un ID único
      * @returns {string} ID único
@@ .. @@
     generateId() {
         return Date.now().toString(36) + Math.random().toString(36).substr(2);
     }
 }

 // Exportar para uso global
 window.Database = Database;