/**
 * TRAZABILITY AI - Aplicación Principal Mejorada
 * Sistema completo de comparación de formularios PDF con IA
 */

class TrazabilityApp {
    constructor() {
        this.pdfProcessor = new PDFProcessor();
        this.database = new Database();
        this.notifications = new NotificationSystem();
        this.ui = new UIController();
        
        this.currentStep = 1;
        this.maxSteps = 4;
        this.processingState = {
            file1Processed: false,
            file2Processed: false,
            comparisonDone: false
        };

        this.init();
    }

    /**
     * Inicializa la aplicación
     */
    init() {
        this.setupEventListeners();
        this.initializeOnboarding();
        this.loadInitialData();
        this.updateConnectionStatus();
        
        // Configurar atajos de teclado
        this.setupKeyboardShortcuts();
        
        console.log('🚀 TRAZABILITY AI v2.0 iniciado correctamente');
    }

    /**
     * Configura todos los event listeners
     */
    setupEventListeners() {
        // Navegación entre pestañas
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const tabName = e.currentTarget.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Upload de archivos PDF
        this.setupFileUpload('dropZone1', 'fileInput1', 'form1');
        this.setupFileUpload('dropZone2', 'fileInput2', 'form2');

        // Botón de comparación
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.addEventListener('click', () => this.compareDocuments());
        }

        // Botones de resultados
        this.setupResultButtons();

        // Gestión de usuarios
        this.setupUserManagement();

        // Sistema de chat
        this.setupChatSystem();

        // Botón de nueva comparación
        const newComparisonBtn = document.getElementById('newComparisonBtn');
        if (newComparisonBtn) {
            newComparisonBtn.addEventListener('click', () => this.resetComparison());
        }
    }

    /**
     * Configura el sistema de upload de archivos
     * @param {string} dropZoneId - ID de la zona de drop
     * @param {string} inputId - ID del input de archivo
     * @param {string} formId - ID del formulario (form1 o form2)
     */
    setupFileUpload(dropZoneId, inputId, formId) {
        const dropZone = document.getElementById(dropZoneId);
        const fileInput = document.getElementById(inputId);

        if (!dropZone || !fileInput) return;

        // Click en zona de drop
        dropZone.addEventListener('click', () => fileInput.click());

        // Cambio en input de archivo
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.handleFileUpload(file, formId);
            }
        });

        // Drag and drop
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
            
            const file = e.dataTransfer.files[0];
            if (file && file.type === 'application/pdf') {
                this.handleFileUpload(file, formId);
            } else {
                this.notifications.showToast('Error', 'Por favor, sube solo archivos PDF', 'error');
            }
        });
    }

    /**
     * Maneja la subida y procesamiento de archivos
     * @param {File} file - Archivo subido
     * @param {string} formId - ID del formulario
     */
    async handleFileUpload(file, formId) {
        try {
            // Mostrar información del archivo
            this.showFileInfo(file, formId);
            
            // Mostrar estado de procesamiento
            this.showProcessingState(formId, true);
            
            // Procesar archivo PDF
            const extractedData = await this.pdfProcessor.processFormPDF(file, formId);
            
            // Actualizar estado
            this.processingState[`${formId}Processed`] = true;
            
            // Ocultar estado de procesamiento
            this.showProcessingState(formId, false);
            
            // Mostrar datos extraídos
            this.displayExtractedData(extractedData, formId);
            
            // Actualizar botón de comparación
            this.updateCompareButton();
            
            // Actualizar onboarding
            this.updateOnboardingStep();
            
            // Mostrar notificación de éxito
            this.notifications.showToast(
                'Éxito', 
                `Formulario ${formId === 'form1' ? '1' : '2'} procesado correctamente. ${extractedData.fieldCount} campos encontrados.`, 
                'success'
            );

            // Guardar actividad
            this.database.addActivity({
                type: 'file_processed',
                description: `Archivo ${file.name} procesado exitosamente`,
                details: {
                    fileName: file.name,
                    fieldsFound: extractedData.fieldCount,
                    confidence: extractedData.confidence
                }
            });

        } catch (error) {
            console.error('Error procesando archivo:', error);
            
            // Ocultar estado de procesamiento
            this.showProcessingState(formId, false);
            
            // Mostrar error
            this.notifications.showToast('Error', error.message, 'error');
            
            // Resetear estado del archivo
            this.resetFileState(formId);
        }
    }

    /**
     * Muestra información del archivo subido
     * @param {File} file - Archivo subido
     * @param {string} formId - ID del formulario
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
     * Muestra/oculta el estado de procesamiento
     * @param {string} formId - ID del formulario
     * @param {boolean} show - Mostrar o ocultar
     */
    showProcessingState(formId, show) {
        const processingId = formId === 'form1' ? 'processing1' : 'processing2';
        const processing = document.getElementById(processingId);
        
        if (processing) {
            if (show) {
                processing.classList.remove('hidden');
            } else {
                processing.classList.add('hidden');
            }
        }
    }

    /**
     * Muestra los datos extraídos en la UI
     * @param {Object} data - Datos extraídos
     * @param {string} formId - ID del formulario
     */
    displayExtractedData(data, formId) {
        // Esta función se implementará cuando se muestren los resultados
        console.log(`Datos extraídos de ${formId}:`, data);
    }

    /**
     * Actualiza el estado del botón de comparación
     */
    updateCompareButton() {
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            const canCompare = this.processingState.file1Processed && this.processingState.file2Processed;
            compareBtn.disabled = !canCompare;
            
            if (canCompare) {
                compareBtn.classList.add('ready');
                compareBtn.querySelector('.btn-text').textContent = 'Comparar Documentos';
            }
        }
    }

    /**
     * Realiza la comparación de documentos
     */
    async compareDocuments() {
        try {
            // Mostrar estado de procesamiento
            this.showComparisonProcessing(true);
            
            // Realizar comparación
            const comparisonResult = this.pdfProcessor.compareFormularios();
            
            // Ocultar estado de procesamiento
            this.showComparisonProcessing(false);
            
            // Mostrar resultados
            this.displayComparisonResults(comparisonResult);
            
            // Actualizar estado
            this.processingState.comparisonDone = true;
            
            // Actualizar onboarding
            this.updateOnboardingStep();
            
            // Enviar alertas si hay diferencias
            if (comparisonResult.summary.differentFields > 0 || 
                comparisonResult.summary.missingInForm1 > 0 || 
                comparisonResult.summary.missingInForm2 > 0) {
                
                await this.sendComparisonAlerts(comparisonResult);
            }
            
            // Guardar actividad
            this.database.addActivity({
                type: 'comparison_completed',
                description: `Comparación completada con ${comparisonResult.summary.similarityScore}% de similitud`,
                details: {
                    similarityScore: comparisonResult.summary.similarityScore,
                    differences: comparisonResult.summary.differentFields,
                    files: comparisonResult.files
                }
            });

            // Actualizar estadísticas
            this.updateStats();

        } catch (error) {
            console.error('Error en comparación:', error);
            this.showComparisonProcessing(false);
            this.notifications.showToast('Error', error.message, 'error');
        }
    }

    /**
     * Muestra/oculta el estado de procesamiento de comparación
     * @param {boolean} show - Mostrar o ocultar
     */
    showComparisonProcessing(show) {
        const processingStatus = document.getElementById('processingStatus');
        if (processingStatus) {
            if (show) {
                processingStatus.textContent = '🔄 Comparando formularios... Esto puede tomar unos momentos.';
                processingStatus.classList.remove('hidden');
            } else {
                processingStatus.classList.add('hidden');
            }
        }
    }

    /**
     * Muestra los resultados de la comparación
     * @param {Object} result - Resultado de la comparación
     */
    displayComparisonResults(result) {
        const resultsSection = document.getElementById('resultsSection');
        if (!resultsSection) return;

        // Mostrar sección de resultados
        resultsSection.classList.remove('hidden');

        // Actualizar header de resultados
        this.updateResultsHeader(result);

        // Mostrar comparación de campos
        this.displayFieldComparison(result);

        // Mostrar diferencias si existen
        if (result.differences.length > 0) {
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
            if (resultTitle) resultTitle.textContent = '¡Formularios Idénticos!';
            if (resultDescription) resultDescription.textContent = 'Los documentos son completamente iguales. No se encontraron diferencias.';
        } else if (result.summary.similarityScore >= 80) {
            if (resultIcon) resultIcon.textContent = '⚠️';
            if (resultTitle) resultTitle.textContent = 'Formularios Muy Similares';
            if (resultDescription) resultDescription.textContent = `Similitud del ${result.summary.similarityScore}%. Se encontraron algunas diferencias menores.`;
        } else {
            if (resultIcon) resultIcon.textContent = '🚨';
            if (resultTitle) resultTitle.textContent = 'Diferencias Significativas Encontradas';
            if (resultDescription) resultDescription.textContent = `Similitud del ${result.summary.similarityScore}%. Los formularios tienen diferencias importantes.`;
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
                <div class="difference-value-label">Formulario 1:</div>
                <div class="difference-value-text">${diff.form1Value}</div>
            `;

            const value2Div = document.createElement('div');
            value2Div.className = 'difference-value';
            value2Div.innerHTML = `
                <div class="difference-value-label">Formulario 2:</div>
                <div class="difference-value-text">${diff.form2Value}</div>
            `;

            valuesDiv.appendChild(value1Div);
            valuesDiv.appendChild(value2Div);
            diffDiv.appendChild(valuesDiv);
        }

        return diffDiv;
    }

    /**
     * Envía alertas por diferencias encontradas
     * @param {Object} result - Resultado de la comparación
     */
    async sendComparisonAlerts(result) {
        const users = this.database.getUsers();
        
        if (users.length === 0) {
            console.warn('No hay usuarios registrados para enviar alertas');
            return;
        }

        const alertMessage = `🚨 ALERTA DE DIFERENCIAS DETECTADAS\n\n` +
            `Archivos comparados:\n` +
            `• ${result.files.form1}\n` +
            `• ${result.files.form2}\n\n` +
            `Similitud: ${result.summary.similarityScore}%\n` +
            `Diferencias encontradas: ${result.differences.length}\n\n` +
            `Se requiere revisión manual.`;

        // Enviar a chat interno
        this.addSystemMessage(alertMessage, 'alert');

        // Simular envío de notificaciones
        for (const user of users) {
            try {
                // Simular WhatsApp
                console.log(`📱 WhatsApp enviado a ${user.whatsapp}: ${alertMessage}`);
                
                // Simular Email
                console.log(`📧 Email enviado a ${user.email}: ${alertMessage}`);
                
                await new Promise(resolve => setTimeout(resolve, 100)); // Simular delay
            } catch (error) {
                console.error(`Error enviando alerta a ${user.name}:`, error);
            }
        }

        // Mostrar notificación de alertas enviadas
        this.notifications.showToast(
            'Alertas Enviadas', 
            `Se enviaron alertas a ${users.length} usuario(s) por las diferencias encontradas`, 
            'warning'
        );

        // Actualizar badge de alertas
        this.updateAlertBadge();
    }

    /**
     * Configura los botones de resultados
     */
    setupResultButtons() {
        // Descargar reporte
        const downloadBtn = document.getElementById('downloadReportBtn');
        if (downloadBtn) {
            downloadBtn.addEventListener('click', () => this.downloadReport());
        }

        // Guardar resultado
        const saveBtn = document.getElementById('saveResultBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveResult());
        }
    }

    /**
     * Descarga el reporte de comparación
     */
    downloadReport() {
        try {
            const report = this.pdfProcessor.generateDetailedReport();
            
            // Crear PDF con jsPDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Título
            doc.setFontSize(20);
            doc.text('REPORTE DE COMPARACIÓN PDF', 20, 30);
            
            // Información básica
            doc.setFontSize(12);
            doc.text(`Fecha: ${new Date(report.timestamp).toLocaleString()}`, 20, 50);
            doc.text(`Archivo 1: ${report.files.form1}`, 20, 60);
            doc.text(`Archivo 2: ${report.files.form2}`, 20, 70);
            doc.text(`Similitud: ${report.summary.similarityScore}%`, 20, 80);
            
            // Resumen
            doc.text('RESUMEN:', 20, 100);
            doc.text(`• Total de campos: ${report.summary.totalFields}`, 25, 110);
            doc.text(`• Campos coincidentes: ${report.summary.matchingFields}`, 25, 120);
            doc.text(`• Campos diferentes: ${report.summary.differentFields}`, 25, 130);
            
            // Diferencias
            if (report.differences.length > 0) {
                doc.text('DIFERENCIAS ENCONTRADAS:', 20, 150);
                let yPos = 160;
                
                report.differences.slice(0, 10).forEach((diff, index) => {
                    if (yPos > 250) {
                        doc.addPage();
                        yPos = 30;
                    }
                    doc.text(`${index + 1}. ${diff.message}`, 25, yPos);
                    yPos += 10;
                });
            }
            
            // Descargar
            doc.save(`reporte-comparacion-${Date.now()}.pdf`);
            
            this.notifications.showToast('Éxito', 'Reporte descargado correctamente', 'success');
            
        } catch (error) {
            console.error('Error generando reporte:', error);
            this.notifications.showToast('Error', 'No se pudo generar el reporte', 'error');
        }
    }

    /**
     * Guarda el resultado de la comparación
     */
    saveResult() {
        try {
            const result = this.pdfProcessor.comparisonResult;
            if (!result) {
                throw new Error('No hay resultados para guardar');
            }

            // Guardar en base de datos local
            this.database.saveComparison(result);
            
            // Actualizar estadísticas
            this.updateStats();
            
            this.notifications.showToast('Éxito', 'Resultado guardado correctamente', 'success');
            
        } catch (error) {
            console.error('Error guardando resultado:', error);
            this.notifications.showToast('Error', error.message, 'error');
        }
    }

    /**
     * Resetea la comparación para empezar de nuevo
     */
    resetComparison() {
        // Resetear procesador
        this.pdfProcessor.reset();
        
        // Resetear estado
        this.processingState = {
            file1Processed: false,
            file2Processed: false,
            comparisonDone: false
        };
        
        // Resetear UI
        this.resetFileState('form1');
        this.resetFileState('form2');
        
        // Ocultar resultados
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.add('hidden');
        }
        
        // Resetear botón de comparación
        const compareBtn = document.getElementById('compareBtn');
        if (compareBtn) {
            compareBtn.disabled = true;
            compareBtn.classList.remove('ready');
        }
        
        // Resetear onboarding
        this.currentStep = 1;
        this.updateOnboardingStep();
        
        this.notifications.showToast('Info', 'Comparación reiniciada. Puedes subir nuevos archivos.', 'info');
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
     * Inicializa el sistema de onboarding
     */
    initializeOnboarding() {
        this.createOnboardingSteps();
        this.updateOnboardingStep();
    }

    /**
     * Crea los pasos del onboarding
     */
    createOnboardingSteps() {
        const onboardingHTML = `
            <div id="onboardingContainer" class="onboarding-container">
                <div class="onboarding-header">
                    <h3>🎯 Guía Paso a Paso</h3>
                    <div class="progress-bar">
                        <div id="progressFill" class="progress-fill"></div>
                    </div>
                </div>
                <div class="onboarding-steps">
                    <div class="step" data-step="1">
                        <div class="step-number">1</div>
                        <div class="step-content">
                            <h4>Subir Primer Formulario</h4>
                            <p>Arrastra o selecciona el primer archivo PDF que deseas comparar</p>
                        </div>
                    </div>
                    <div class="step" data-step="2">
                        <div class="step-number">2</div>
                        <div class="step-content">
                            <h4>Subir Segundo Formulario</h4>
                            <p>Arrastra o selecciona el segundo archivo PDF para la comparación</p>
                        </div>
                    </div>
                    <div class="step" data-step="3">
                        <div class="step-number">3</div>
                        <div class="step-content">
                            <h4>Iniciar Comparación</h4>
                            <p>Haz clic en "Comparar Documentos" para analizar las diferencias</p>
                        </div>
                    </div>
                    <div class="step" data-step="4">
                        <div class="step-number">4</div>
                        <div class="step-content">
                            <h4>Revisar Resultados</h4>
                            <p>Analiza los resultados, descarga el reporte o guarda los datos</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insertar después de la sección de comparación
        const comparisonContainer = document.querySelector('.comparison-container');
        if (comparisonContainer) {
            comparisonContainer.insertAdjacentHTML('beforeend', onboardingHTML);
        }
    }

    /**
     * Actualiza el paso actual del onboarding
     */
    updateOnboardingStep() {
        // Determinar paso actual basado en el estado
        if (this.processingState.comparisonDone) {
            this.currentStep = 4;
        } else if (this.processingState.file1Processed && this.processingState.file2Processed) {
            this.currentStep = 3;
        } else if (this.processingState.file1Processed) {
            this.currentStep = 2;
        } else {
            this.currentStep = 1;
        }

        // Actualizar UI
        const steps = document.querySelectorAll('.step');
        const progressFill = document.getElementById('progressFill');

        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });

        // Actualizar barra de progreso
        if (progressFill) {
            const progress = ((this.currentStep - 1) / (this.maxSteps - 1)) * 100;
            progressFill.style.width = `${progress}%`;
        }
    }

    /**
     * Configura la gestión de usuarios
     */
    setupUserManagement() {
        const addUserBtn = document.getElementById('addUserBtn');
        const userForm = document.getElementById('userForm');
        const userFormElement = document.getElementById('userFormElement');
        const cancelUserBtn = document.getElementById('cancelUserBtn');

        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => {
                this.showUserForm();
            });
        }

        if (cancelUserBtn) {
            cancelUserBtn.addEventListener('click', () => {
                this.hideUserForm();
            });
        }

        if (userFormElement) {
            userFormElement.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveUser();
            });
        }

        // Cargar usuarios existentes
        this.loadUsers();
    }

    /**
     * Muestra el formulario de usuario
     * @param {Object} user - Usuario a editar (opcional)
     */
    showUserForm(user = null) {
        const userForm = document.getElementById('userForm');
        const formTitle = document.getElementById('formTitle');
        
        if (userForm) userForm.classList.remove('hidden');
        
        if (user) {
            if (formTitle) formTitle.textContent = 'Editar Usuario';
            this.fillUserForm(user);
        } else {
            if (formTitle) formTitle.textContent = 'Crear Nuevo Usuario';
            this.clearUserForm();
        }
    }

    /**
     * Oculta el formulario de usuario
     */
    hideUserForm() {
        const userForm = document.getElementById('userForm');
        if (userForm) userForm.classList.add('hidden');
        this.clearUserForm();
    }

    /**
     * Limpia el formulario de usuario
     */
    clearUserForm() {
        const form = document.getElementById('userFormElement');
        if (form) form.reset();
    }

    /**
     * Llena el formulario con datos de usuario
     * @param {Object} user - Datos del usuario
     */
    fillUserForm(user) {
        document.getElementById('userName').value = user.name || '';
        document.getElementById('userWhatsapp').value = user.whatsapp || '';
        document.getElementById('userEmail').value = user.email || '';
        document.getElementById('userCategory').value = user.category || '';
    }

    /**
     * Guarda un usuario
     */
    saveUser() {
        try {
            const userData = {
                name: document.getElementById('userName').value.trim(),
                whatsapp: document.getElementById('userWhatsapp').value.trim(),
                email: document.getElementById('userEmail').value.trim(),
                category: document.getElementById('userCategory').value
            };

            // Validar datos
            if (!userData.name || !userData.whatsapp || !userData.email || !userData.category) {
                throw new Error('Todos los campos son obligatorios');
            }

            // Validar email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('El email no tiene un formato válido');
            }

            // Guardar usuario
            this.database.addUser(userData);
            
            // Actualizar tabla
            this.loadUsers();
            
            // Ocultar formulario
            this.hideUserForm();
            
            // Mostrar notificación
            this.notifications.showToast('Éxito', 'Usuario guardado correctamente', 'success');
            
            // Actualizar estadísticas
            this.updateStats();

        } catch (error) {
            console.error('Error guardando usuario:', error);
            this.notifications.showToast('Error', error.message, 'error');
        }
    }

    /**
     * Carga y muestra los usuarios
     */
    loadUsers() {
        const users = this.database.getUsers();
        const tableBody = document.getElementById('usersTableBody');
        const noUsersMessage = document.getElementById('noUsersMessage');

        if (!tableBody) return;

        tableBody.innerHTML = '';

        if (users.length === 0) {
            if (noUsersMessage) noUsersMessage.style.display = 'block';
            return;
        }

        if (noUsersMessage) noUsersMessage.style.display = 'none';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.whatsapp}</td>
                <td>${user.email}</td>
                <td>${user.category}</td>
                <td>
                    <div class="user-actions">
                        <button class="user-action-btn edit" onclick="app.editUser('${user.id}')" title="Editar">
                            ✏️
                        </button>
                        <button class="user-action-btn delete" onclick="app.deleteUser('${user.id}')" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Edita un usuario
     * @param {string} userId - ID del usuario
     */
    editUser(userId) {
        const user = this.database.getUser(userId);
        if (user) {
            this.showUserForm(user);
        }
    }

    /**
     * Elimina un usuario
     * @param {string} userId - ID del usuario
     */
    deleteUser(userId) {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
            this.database.deleteUser(userId);
            this.loadUsers();
            this.updateStats();
            this.notifications.showToast('Info', 'Usuario eliminado correctamente', 'info');
        }
    }

    /**
     * Configura el sistema de chat
     */
    setupChatSystem() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendMessageBtn');

        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                const hasText = e.target.value.trim().length > 0;
                if (sendBtn) sendBtn.disabled = !hasText;
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }

        // Cargar mensajes existentes
        this.loadChatMessages();
    }

    /**
     * Envía un mensaje al chat
     */
    sendMessage() {
        const messageInput = document.getElementById('messageInput');
        if (!messageInput) return;

        const message = messageInput.value.trim();
        if (!message) return;

        // Agregar mensaje
        this.addChatMessage({
            text: message,
            sender: 'Usuario',
            timestamp: new Date().toISOString(),
            type: 'user'
        });

        // Limpiar input
        messageInput.value = '';
        const sendBtn = document.getElementById('sendMessageBtn');
        if (sendBtn) sendBtn.disabled = true;

        // Guardar en base de datos
        this.database.addChatMessage({
            text: message,
            sender: 'Usuario',
            type: 'user'
        });
    }

    /**
     * Agrega un mensaje al chat
     * @param {Object} message - Mensaje a agregar
     */
    addChatMessage(message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        // Ocultar mensaje de "no hay mensajes"
        const noMessages = chatMessages.querySelector('.no-messages');
        if (noMessages) noMessages.style.display = 'none';

        // Crear elemento de mensaje
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.type === 'user' ? 'own' : ''} ${message.type === 'system' ? 'system' : ''} ${message.type === 'alert' ? 'alert' : ''}`;

        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';

        if (message.type !== 'user') {
            const messageHeader = document.createElement('div');
            messageHeader.className = 'message-header';
            messageHeader.textContent = message.sender || 'Sistema';
            messageContent.appendChild(messageHeader);
        }

        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        messageText.textContent = message.text;
        messageContent.appendChild(messageText);

        const messageTime = document.createElement('div');
        messageTime.className = 'message-time';
        messageTime.textContent = new Date(message.timestamp).toLocaleTimeString();
        messageContent.appendChild(messageTime);

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll al final
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    /**
     * Agrega un mensaje del sistema
     * @param {string} text - Texto del mensaje
     * @param {string} type - Tipo de mensaje (system, alert)
     */
    addSystemMessage(text, type = 'system') {
        const message = {
            text: text,
            sender: 'TRAZABILITY AI',
            timestamp: new Date().toISOString(),
            type: type
        };

        this.addChatMessage(message);
        this.database.addChatMessage(message);
    }

    /**
     * Carga los mensajes del chat
     */
    loadChatMessages() {
        const messages = this.database.getChatMessages();
        messages.forEach(message => {
            this.addChatMessage(message);
        });
    }

    /**
     * Actualiza las estadísticas
     */
    updateStats() {
        const stats = this.database.getStats();
        
        // Actualizar elementos de estadísticas
        const totalComparisons = document.getElementById('totalComparisons');
        const successfulMatches = document.getElementById('successfulMatches');
        const foundDifferences = document.getElementById('foundDifferences');
        const activeUsers = document.getElementById('activeUsers');

        if (totalComparisons) totalComparisons.textContent = stats.totalComparisons;
        if (successfulMatches) successfulMatches.textContent = stats.successfulMatches;
        if (foundDifferences) foundDifferences.textContent = stats.foundDifferences;
        if (activeUsers) activeUsers.textContent = stats.activeUsers;

        // Actualizar actividad reciente
        this.updateRecentActivity();
        
        // Actualizar contador de usuarios en chat
        const userCount = document.getElementById('userCount');
        if (userCount) {
            userCount.textContent = `${stats.activeUsers} usuario${stats.activeUsers !== 1 ? 's' : ''}`;
        }
    }

    /**
     * Actualiza la actividad reciente
     */
    updateRecentActivity() {
        const activities = this.database.getRecentActivity();
        const activityList = document.getElementById('recentActivity');
        
        if (!activityList) return;

        activityList.innerHTML = '';

        if (activities.length === 0) {
            activityList.innerHTML = '<div class="no-activity"><p>No hay actividad reciente</p></div>';
            return;
        }

        activities.forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.className = 'activity-item';
            
            activityDiv.innerHTML = `
                <div class="activity-time">${new Date(activity.timestamp).toLocaleString()}</div>
                <div class="activity-description">${activity.description}</div>
            `;
            
            activityList.appendChild(activityDiv);
        });
    }

    /**
     * Actualiza el badge de alertas
     */
    updateAlertBadge() {
        const alertBadge = document.getElementById('alertBadge');
        const alertCount = document.getElementById('alertCount');
        
        // Simular conteo de alertas (en una implementación real vendría de la base de datos)
        const alertsCount = this.database.getUnreadAlerts();
        
        if (alertsCount > 0) {
            if (alertBadge) alertBadge.classList.remove('hidden');
            if (alertCount) alertCount.textContent = alertsCount;
        } else {
            if (alertBadge) alertBadge.classList.add('hidden');
        }
    }

    /**
     * Cambia entre pestañas
     * @param {string} tabName - Nombre de la pestaña
     */
    switchTab(tabName) {
        // Actualizar navegación
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Mostrar contenido de pestaña
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');

        // Actualizar datos si es necesario
        if (tabName === 'reports') {
            this.updateStats();
        } else if (tabName === 'users') {
            this.loadUsers();
        } else if (tabName === 'chat') {
            this.loadChatMessages();
        }
    }

    /**
     * Configura atajos de teclado
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchTab('comparison');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchTab('users');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchTab('chat');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchTab('reports');
                        break;
                }
                
                if (e.shiftKey) {
                    switch (e.key) {
                        case 'D':
                            e.preventDefault();
                            this.exportAllData();
                            break;
                        case 'R':
                            e.preventDefault();
                            this.clearAllData();
                            break;
                    }
                }
            }
        });
    }

    /**
     * Exporta todos los datos
     */
    exportAllData() {
        try {
            const data = this.database.exportAllData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `trazability-data-${Date.now()}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            
            this.notifications.showToast('Éxito', 'Datos exportados correctamente', 'success');
        } catch (error) {
            console.error('Error exportando datos:', error);
            this.notifications.showToast('Error', 'No se pudieron exportar los datos', 'error');
        }
    }

    /**
     * Limpia todos los datos
     */
    clearAllData() {
        if (confirm('¿Estás seguro de que deseas eliminar todos los datos? Esta acción no se puede deshacer.')) {
            this.database.clearAllData();
            this.resetComparison();
            this.loadUsers();
            this.updateStats();
            this.loadChatMessages();
            
            this.notifications.showToast('Info', 'Todos los datos han sido eliminados', 'info');
        }
    }

    /**
     * Carga datos iniciales
     */
    loadInitialData() {
        this.updateStats();
        this.loadUsers();
        this.updateAlertBadge();
    }

    /**
     * Actualiza el estado de conexión
     */
    updateConnectionStatus() {
        const connectionStatus = document.getElementById('connectionStatus');
        if (connectionStatus) {
            // Simular estado de conexión
            const isOnline = navigator.onLine;
            connectionStatus.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
            connectionStatus.querySelector('.status-text').textContent = isOnline ? 'En línea' : 'Sin conexión';
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
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TrazabilityApp();
    
    // Configurar debug global
    window.TRAZABILITY_DEBUG = {
        getStatus: () => window.app.pdfProcessor.getProcessingStats(),
        exportData: () => window.app.exportAllData(),
        testNotification: () => window.app.notifications.showToast('Test', 'Notificación de prueba', 'info'),
        clearData: () => window.app.clearAllData()
    };
});

// Manejar errores globales
window.addEventListener('error', (e) => {
    console.error('Error global:', e.error);
    if (window.app && window.app.notifications) {
        window.app.notifications.showToast('Error', 'Ha ocurrido un error inesperado', 'error');
    }
});

// Manejar cambios de conexión
window.addEventListener('online', () => {
    if (window.app) window.app.updateConnectionStatus();
});

window.addEventListener('offline', () => {
    if (window.app) window.app.updateConnectionStatus();
});