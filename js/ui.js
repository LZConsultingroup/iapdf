/**
 * TRAZABILITY AI - Controlador de Interfaz Simplificado
 * Maneja la interfaz de usuario para carga y reconocimiento de archivos
 */

class UIController {
    constructor() {
        this.currentTab = 'comparison';
        this.init();
    }

    /**
     * Inicializa el controlador de UI
     */
    init() {
        this.setupTabNavigation();
        this.setupFileUploadUI();
        console.log('✅ UIController inicializado correctamente');
    }

    /**
     * Configura la navegación entre pestañas
     */
    setupTabNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }

    /**
     * Configura la interfaz de subida de archivos
     */
    setupFileUploadUI() {
        // Configurar zonas de drop para archivos
        this.setupDropZone('dropZone1', 'fileInput1');
        this.setupDropZone('dropZone2', 'fileInput2');
    }

    /**
     * Configura una zona de drop para archivos
     * @param {string} dropZoneId - ID de la zona de drop
     * @param {string} inputId - ID del input de archivo
     */
    setupDropZone(dropZoneId, inputId) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(inputId);

        if (!dropZone || !fileInput) return;

        // Eventos de drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        });

        // Click para abrir selector de archivos
        dropZone.addEventListener('click', () => {
            fileInput.click();
        });
    }

    /**
     * Cambia entre pestañas
     * @param {string} tabName - Nombre de la pestaña
     */
    switchTab(tabName) {
        // Actualizar navegación activa
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Mostrar contenido de pestaña correspondiente
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeTab = document.getElementById(`${tabName}Tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentTab = tabName;
    }

    /**
     * Muestra información del archivo subido
     * @param {File} file - Archivo subido
     * @param {string} formId - ID del formulario (form1 o form2)
     */
    showFileInfo(file, formId) {
        const fileInfoId = formId === 'form1' ? 'fileInfo1' : 'fileInfo2';
        const fileInfo = document.getElementById(fileInfoId);
        
        if (fileInfo) {
            const fileName = fileInfo.querySelector('.file-name');
            const fileSize = fileInfo.querySelector('.file-size');
            
            if (fileName) fileName.textContent = file.name;
            if (fileSize) fileSize.textContent = this.formatFileSize(file.size);
            
            // Ocultar contenido de drop y mostrar info
            const dropContent = fileInfo.parentElement.querySelector('.drop-content');
            if (dropContent) dropContent.classList.add('hidden');
            
            fileInfo.classList.remove('hidden');
        }
    }

    /**
     * Muestra el estado de procesamiento
     * @param {string} formId - ID del formulario
     * @param {boolean} show - Mostrar o ocultar
     * @param {string} message - Mensaje a mostrar
     */
    showProcessingState(formId, show, message = 'Procesando archivo...') {
        const processingId = formId === 'form1' ? 'processing1' : 'processing2';
        const processing = document.getElementById(processingId);
        
        if (processing) {
            if (show) {
                const messageElement = processing.querySelector('p');
                if (messageElement) {
                    messageElement.textContent = message;
                }
                processing.classList.remove('hidden');
            } else {
                processing.classList.add('hidden');
            }
        }
    }

    /**
     * Actualiza el botón de comparación
     * @param {boolean} enabled - Si el botón debe estar habilitado
     */
    updateCompareButton(enabled) {
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.disabled = !enabled;
            
            if (enabled) {
                compareBtn.classList.add('ready');
                compareBtn.querySelector('.btn-text').textContent = 'Comparar Documentos';
            } else {
                compareBtn.classList.remove('ready');
                compareBtn.querySelector('.btn-text').textContent = 'Selecciona ambos archivos';
            }
        }
    }

    /**
     * Muestra los resultados de la comparación
     * @param {Object} result - Resultado de la comparación
     */
    displayResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) return;

        // Mostrar sección de resultados
        resultsSection.classList.remove('hidden');

        // Actualizar header de resultados
        this.updateResultsHeader(result);

        // Mostrar comparación de campos
        this.displayFieldComparison(result);

        // Mostrar diferencias si existen
        if (result.differences && result.differences.length > 0) {
            this.displayDifferences(result.differences);
        }

        // Scroll a resultados
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Actualiza el header de resultados
     * @param {Object} result - Resultado de la comparación
     */
    updateResultsHeader(result) {
        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultDescription = document.getElementById('resultDescription');

        if (result.summary.similarityScore === 100) {
            if (resultIcon) resultIcon.textContent = '✅';
            if (resultTitle) resultTitle.textContent = '¡COINCIDENCIA PERFECTA!';
            if (resultDescription) resultDescription.textContent = 'Los documentos son idénticos. No se encontraron diferencias.';
        } else if (result.summary.similarityScore >= 80) {
            if (resultIcon) resultIcon.textContent = '⚠️';
            if (resultTitle) resultTitle.textContent = 'COINCIDENCIA PARCIAL';
            if (resultDescription) resultDescription.textContent = `Similitud del ${result.summary.similarityScore}%. Se encontraron algunas diferencias.`;
        } else {
            if (resultIcon) resultIcon.textContent = '❌';
            if (resultTitle) resultTitle.textContent = 'NO COINCIDENCIA';
            if (resultDescription) resultDescription.textContent = `Similitud del ${result.summary.similarityScore}%. Los documentos tienen diferencias significativas.`;
        }
    }

    /**
     * Muestra la comparación de campos
     * @param {Object} result - Resultado de la comparación
     */
    displayFieldComparison(result) {
        const fileName1 = document.getElementById('fileName1');
        const fileName2 = document.getElementById('fileName2');
        const fields1 = document.getElementById('fields1');
        const fields2 = document.getElementById('fields2');

        if (fileName1) fileName1.textContent = result.files.form1;
        if (fileName2) fileName2.textContent = result.files.form2;

        if (fields1) fields1.innerHTML = '';
        if (fields2) fields2.innerHTML = '';

        // Mostrar campos de cada formulario
        Object.entries(result.fieldComparisons).forEach(([fieldName, comparison]) => {
            if (fields1) {
                const field1Element = this.createFieldElement(fieldName, comparison.form1Value, comparison.status);
                fields1.appendChild(field1Element);
            }

            if (fields2) {
                const field2Element = this.createFieldElement(fieldName, comparison.form2Value, comparison.status);
                fields2.appendChild(field2Element);
            }
        });
    }

    /**
     * Crea un elemento de campo para mostrar
     * @param {string} fieldName - Nombre del campo
     * @param {string} value - Valor del campo
     * @param {string} status - Estado de la comparación
     * @returns {HTMLElement} Elemento del campo
     */
    createFieldElement(fieldName, value, status) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = `field-item ${status === 'different' ? 'different' : ''}`;

        const labelDiv = document.createElement('div');
        labelDiv.className = 'field-label';
        labelDiv.textContent = fieldName.replace(/_/g, ' ').toUpperCase();

        const valueDiv = document.createElement('div');
        valueDiv.className = 'field-value';
        valueDiv.textContent = value || '(vacío)';

        fieldDiv.appendChild(labelDiv);
        fieldDiv.appendChild(valueDiv);

        return fieldDiv;
    }

    /**
     * Muestra las diferencias encontradas
     * @param {Array} differences - Array de diferencias
     */
    displayDifferences(differences) {
        const differencesSection = document.getElementById('differencesSection');
        const differencesList = document.getElementById('differencesList');

        if (!differencesSection || !differencesList) return;

        differencesSection.classList.remove('hidden');
        differencesList.innerHTML = '';

        differences.forEach(diff => {
            const diffElement = this.createDifferenceElement(diff);
            differencesList.appendChild(diffElement);
        });
    }

    /**
     * Crea un elemento de diferencia
     * @param {Object} diff - Objeto de diferencia
     * @returns {HTMLElement} Elemento de diferencia
     */
    createDifferenceElement(diff) {
        const diffDiv = document.createElement('div');
        diffDiv.className = 'difference-item';

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'difference-field';
        fieldDiv.textContent = diff.field || 'Campo desconocido';

        const messageDiv = document.createElement('div');
        messageDiv.textContent = diff.message;

        diffDiv.appendChild(fieldDiv);
        diffDiv.appendChild(messageDiv);

        if (diff.form1Value && diff.form2Value) {
            const valuesDiv = document.createElement('div');
            valuesDiv.className = 'difference-values';

            const value1Div = document.createElement('div');
            value1Div.className = 'difference-value';
            value1Div.innerHTML = `
                <div class="difference-value-label">Archivo 1:</div>
                <div class="difference-value-text">${diff.form1Value}</div>
            `;

            const value2Div = document.createElement('div');
            value2Div.className = 'difference-value';
            value2Div.innerHTML = `
                <div class="difference-value-label">Archivo 2:</div>
                <div class="difference-value-text">${diff.form2Value}</div>
            `;

            valuesDiv.appendChild(value1Div);
            valuesDiv.appendChild(value2Div);
            diffDiv.appendChild(valuesDiv);
        }

        return diffDiv;
    }

    /**
     * Resetea el estado de un archivo
     * @param {string} formId - ID del formulario
     */
    resetFileState(formId) {
        const fileInfoId = formId === 'form1' ? 'fileInfo1' : 'fileInfo2';
        const processingId = formId === 'form1' ? 'processing1' : 'processing2';
        const inputId = formId === 'form1' ? 'fileInput1' : 'fileInput2';
        
        // Ocultar info y processing
        const fileInfo = document.getElementById(fileInfoId);
        const processing = document.getElementById(processingId);
        const input = document.getElementById(inputId);
        
        if (fileInfo) fileInfo.classList.add('hidden');
        if (processing) processing.classList.add('hidden');
        if (input) input.value = '';
        
        // Mostrar drop content
        const dropContent = document.querySelector(`#${formId === 'form1' ? 'dropZone1' : 'dropZone2'} .drop-content`);
        if (dropContent) dropContent.classList.remove('hidden');
    }

    /**
     * Oculta la sección de resultados
     */
    hideResults() {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
    }

    /**
     * Formatea el tamaño de archivo
     * @param {number} bytes - Tamaño en bytes
     * @returns {string} Tamaño formateado
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Obtiene la pestaña actual
     * @returns {string} Nombre de la pestaña actual
     */
    getCurrentTab() {
        return this.currentTab;
    }
}

// Exportar para uso global
window.UIController = UIController;