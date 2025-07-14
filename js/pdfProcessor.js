/**
 * TRAZABILITY AI - Procesador de PDFs Mejorado
 * Sistema avanzado para extraer y comparar campos de formularios PDF
 */

class PDFProcessor {
    constructor() {
        this.currentFiles = {
            file1: null,
            file2: null
        };
        this.extractedData = {
            form1: null,
            form2: null
        };
        this.comparisonResult = null;
        
        // Configuración de límites
        this.limits = {
            maxFileSize: 10 * 1024 * 1024, // 10MB
            maxPages: 20,
            timeout: 45000 // 45 segundos
        };

        // Patrones mejorados para identificar campos de formularios
        this.fieldPatterns = {
            // Información personal
            nombre: /(?:nombre|name|apellidos?|first\s*name|last\s*name)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            documento: /(?:documento|dni|cedula|id|identification|passport)[\s:]*([A-Z0-9.-]{6,20})/gi,
            email: /(?:email|correo|e-mail|mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
            telefono: /(?:telefono|phone|tel|celular|movil)[\s:]*([+]?[0-9\s()-]{7,20})/gi,
            
            // Información de dirección
            direccion: /(?:direccion|address|domicilio)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,#-]{5,100})/gi,
            ciudad: /(?:ciudad|city|localidad)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            codigo_postal: /(?:codigo\s*postal|zip|postal\s*code|cp)[\s:]*([A-Z0-9\s-]{3,10})/gi,
            pais: /(?:pais|country|nation)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            
            // Fechas
            fecha_nacimiento: /(?:fecha\s*de?\s*nacimiento|birth\s*date|born)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/gi,
            fecha: /(?:fecha|date)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/gi,
            
            // Información laboral/académica
            empresa: /(?:empresa|company|empleador|employer)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s&.,]{2,80})/gi,
            cargo: /(?:cargo|position|puesto|job\s*title)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,60})/gi,
            salario: /(?:salario|salary|sueldo|income)[\s:]*([0-9.,\$€£¥]{3,20})/gi,
            
            // Campos numéricos
            numero: /(?:numero|number|num|no)[\s:]*([0-9]{1,10})/gi,
            cantidad: /(?:cantidad|quantity|amount)[\s:]*([0-9.,]{1,15})/gi,
            
            // Campos de selección común
            genero: /(?:genero|gender|sexo)[\s:]*([MFmfMasculinoFemeninoMaleFemale]{1,10})/gi,
            estado_civil: /(?:estado\s*civil|marital\s*status)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{4,20})/gi,
            
            // Campos de texto libre
            observaciones: /(?:observaciones|comments|notas|notes|remarks)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,;:!?-]{10,500})/gi,
            descripcion: /(?:descripcion|description|detalle|details)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,;:!?-]{10,300})/gi
        };

        // Configurar PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Procesa un archivo PDF y extrae los campos del formulario
     * @param {File} file - Archivo PDF a procesar
     * @param {string} formId - Identificador del formulario (form1 o form2)
     * @returns {Promise<Object>} Datos extraídos del formulario
     */
    async processFormPDF(file, formId) {
        try {
            // Validar archivo
            this.validateFile(file);
            
            // Almacenar archivo
            this.currentFiles[formId] = file;
            
            // Mostrar estado de procesamiento
            this.updateProcessingStatus(formId, 'Leyendo archivo PDF...');
            
            // Convertir archivo a ArrayBuffer
            const arrayBuffer = await this.fileToArrayBuffer(file);
            
            // Cargar documento PDF
            this.updateProcessingStatus(formId, 'Analizando estructura del documento...');
            const pdfDoc = await pdfjsLib.getDocument(arrayBuffer).promise;
            
            // Validar número de páginas
            if (pdfDoc.numPages > this.limits.maxPages) {
                throw new Error(`El documento tiene ${pdfDoc.numPages} páginas. Máximo permitido: ${this.limits.maxPages}`);
            }
            
            // Extraer texto de todas las páginas
            this.updateProcessingStatus(formId, 'Extrayendo contenido de las páginas...');
            const fullText = await this.extractTextFromPDF(pdfDoc);
            
            // Extraer campos del formulario
            this.updateProcessingStatus(formId, 'Identificando campos del formulario...');
            const formFields = await this.extractFormFields(pdfDoc);
            
            // Procesar y estructurar datos
            this.updateProcessingStatus(formId, 'Procesando datos extraídos...');
            const extractedData = this.processExtractedData(fullText, formFields, file.name);
            
            // Almacenar datos procesados
            this.extractedData[formId] = extractedData;
            
            // Actualizar UI
            this.updateProcessingStatus(formId, 'Procesamiento completado');
            
            return extractedData;
            
        } catch (error) {
            console.error(`Error procesando ${formId}:`, error);
            this.updateProcessingStatus(formId, `Error: ${error.message}`, 'error');
            throw error;
        }
    }

    /**
     * Valida que el archivo sea válido para procesamiento
     * @param {File} file - Archivo a validar
     */
    validateFile(file) {
        if (!file) {
            throw new Error('No se ha seleccionado ningún archivo');
        }
        
        if (file.type !== 'application/pdf') {
            throw new Error('El archivo debe ser un PDF válido');
        }
        
        if (file.size > this.limits.maxFileSize) {
            const maxSizeMB = this.limits.maxFileSize / (1024 * 1024);
            throw new Error(`El archivo es demasiado grande. Tamaño máximo: ${maxSizeMB}MB`);
        }
    }

    /**
     * Convierte un archivo a ArrayBuffer
     * @param {File} file - Archivo a convertir
     * @returns {Promise<ArrayBuffer>}
     */
    fileToArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Error leyendo el archivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    /**
     * Extrae texto completo del PDF
     * @param {Object} pdfDoc - Documento PDF cargado
     * @returns {Promise<string>} Texto completo extraído
     */
    async extractTextFromPDF(pdfDoc) {
        let fullText = '';
        
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            
            fullText += `\n--- PÁGINA ${pageNum} ---\n${pageText}\n`;
        }
        
        return fullText;
    }

    /**
     * Extrae campos de formulario del PDF
     * @param {Object} pdfDoc - Documento PDF cargado
     * @returns {Promise<Array>} Array de campos de formulario
     */
    async extractFormFields(pdfDoc) {
        const formFields = [];
        
        try {
            // Intentar obtener campos de formulario interactivos
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const annotations = await page.getAnnotations();
                
                annotations.forEach(annotation => {
                    if (annotation.subtype === 'Widget' && annotation.fieldName) {
                        formFields.push({
                            name: annotation.fieldName,
                            value: annotation.fieldValue || '',
                            type: annotation.fieldType || 'text',
                            page: pageNum
                        });
                    }
                });
            }
        } catch (error) {
            console.warn('No se pudieron extraer campos interactivos:', error);
        }
        
        return formFields;
    }

    /**
     * Procesa y estructura los datos extraídos
     * @param {string} text - Texto extraído del PDF
     * @param {Array} formFields - Campos de formulario extraídos
     * @param {string} fileName - Nombre del archivo
     * @returns {Object} Datos estructurados
     */
    processExtractedData(text, formFields, fileName) {
        const extractedData = {
            fileName: fileName,
            processedAt: new Date().toISOString(),
            formFields: {},
            interactiveFields: formFields,
            rawText: text,
            fieldCount: 0,
            confidence: 0
        };

        // Procesar campos interactivos
        formFields.forEach(field => {
            if (field.value && field.value.trim()) {
                extractedData.formFields[field.name] = {
                    value: field.value.trim(),
                    type: field.type,
                    source: 'interactive',
                    confidence: 1.0
                };
                extractedData.fieldCount++;
            }
        });

        // Extraer campos usando patrones de texto
        let patternMatches = 0;
        Object.entries(this.fieldPatterns).forEach(([fieldName, pattern]) => {
            const matches = [...text.matchAll(pattern)];
            
            if (matches.length > 0) {
                // Tomar la primera coincidencia más relevante
                const bestMatch = matches[0];
                const value = bestMatch[1].trim();
                
                if (value && value.length > 1) {
                    // Si no existe como campo interactivo, agregarlo
                    if (!extractedData.formFields[fieldName]) {
                        extractedData.formFields[fieldName] = {
                            value: value,
                            type: 'text',
                            source: 'pattern',
                            confidence: 0.8
                        };
                        extractedData.fieldCount++;
                        patternMatches++;
                    }
                }
            }
        });

        // Calcular confianza general
        const totalPossibleFields = Object.keys(this.fieldPatterns).length;
        extractedData.confidence = Math.min(
            (extractedData.fieldCount / totalPossibleFields) * 100,
            100
        );

        return extractedData;
    }

    /**
     * Compara dos formularios procesados
     * @returns {Object} Resultado de la comparación
     */
    compareFormularios() {
        if (!this.extractedData.form1 || !this.extractedData.form2) {
            throw new Error('Ambos formularios deben estar procesados antes de compararlos');
        }

        const form1 = this.extractedData.form1;
        const form2 = this.extractedData.form2;
        
        const comparison = {
            timestamp: new Date().toISOString(),
            files: {
                form1: form1.fileName,
                form2: form2.fileName
            },
            summary: {
                totalFields: 0,
                matchingFields: 0,
                differentFields: 0,
                missingInForm1: 0,
                missingInForm2: 0,
                similarityScore: 0
            },
            fieldComparisons: {},
            differences: [],
            recommendations: []
        };

        // Obtener todos los campos únicos
        const allFields = new Set([
            ...Object.keys(form1.formFields),
            ...Object.keys(form2.formFields)
        ]);

        comparison.summary.totalFields = allFields.size;

        // Comparar cada campo
        allFields.forEach(fieldName => {
            const field1 = form1.formFields[fieldName];
            const field2 = form2.formFields[fieldName];
            
            const fieldComparison = {
                field: fieldName,
                form1Value: field1 ? field1.value : null,
                form2Value: field2 ? field2.value : null,
                status: 'unknown',
                similarity: 0,
                confidence: {
                    form1: field1 ? field1.confidence : 0,
                    form2: field2 ? field2.confidence : 0
                }
            };

            if (!field1 && field2) {
                fieldComparison.status = 'missing_in_form1';
                comparison.summary.missingInForm1++;
                comparison.differences.push({
                    type: 'missing_field',
                    field: fieldName,
                    message: `Campo "${fieldName}" presente solo en ${form2.fileName}`,
                    severity: 'medium'
                });
            } else if (field1 && !field2) {
                fieldComparison.status = 'missing_in_form2';
                comparison.summary.missingInForm2++;
                comparison.differences.push({
                    type: 'missing_field',
                    field: fieldName,
                    message: `Campo "${fieldName}" presente solo en ${form1.fileName}`,
                    severity: 'medium'
                });
            } else if (field1 && field2) {
                // Comparar valores
                const similarity = this.calculateSimilarity(field1.value, field2.value);
                fieldComparison.similarity = similarity;
                
                if (similarity >= 0.95) {
                    fieldComparison.status = 'identical';
                    comparison.summary.matchingFields++;
                } else if (similarity >= 0.7) {
                    fieldComparison.status = 'similar';
                    comparison.summary.differentFields++;
                    comparison.differences.push({
                        type: 'similar_values',
                        field: fieldName,
                        form1Value: field1.value,
                        form2Value: field2.value,
                        similarity: similarity,
                        message: `Campo "${fieldName}" tiene valores similares pero no idénticos`,
                        severity: 'low'
                    });
                } else {
                    fieldComparison.status = 'different';
                    comparison.summary.differentFields++;
                    comparison.differences.push({
                        type: 'different_values',
                        field: fieldName,
                        form1Value: field1.value,
                        form2Value: field2.value,
                        similarity: similarity,
                        message: `Campo "${fieldName}" tiene valores completamente diferentes`,
                        severity: 'high'
                    });
                }
            }

            comparison.fieldComparisons[fieldName] = fieldComparison;
        });

        // Calcular puntaje de similitud general
        if (comparison.summary.totalFields > 0) {
            comparison.summary.similarityScore = Math.round(
                (comparison.summary.matchingFields / comparison.summary.totalFields) * 100
            );
        }

        // Generar recomendaciones
        this.generateRecommendations(comparison);

        // Almacenar resultado
        this.comparisonResult = comparison;

        return comparison;
    }

    /**
     * Calcula la similitud entre dos strings
     * @param {string} str1 - Primer string
     * @param {string} str2 - Segundo string
     * @returns {number} Valor de similitud entre 0 y 1
     */
    calculateSimilarity(str1, str2) {
        if (!str1 || !str2) return 0;
        
        // Normalizar strings
        const s1 = str1.toLowerCase().trim();
        const s2 = str2.toLowerCase().trim();
        
        if (s1 === s2) return 1;
        
        // Calcular distancia de Levenshtein
        const matrix = [];
        const len1 = s1.length;
        const len2 = s2.length;
        
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (s1.charAt(i - 1) === s2.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const distance = matrix[len1][len2];
        const maxLength = Math.max(len1, len2);
        
        return maxLength === 0 ? 1 : (maxLength - distance) / maxLength;
    }

    /**
     * Genera recomendaciones basadas en la comparación
     * @param {Object} comparison - Resultado de la comparación
     */
    generateRecommendations(comparison) {
        const recommendations = [];
        
        if (comparison.summary.similarityScore === 100) {
            recommendations.push({
                type: 'success',
                message: '✅ Los formularios son idénticos. No se requiere acción adicional.',
                priority: 'info'
            });
        } else if (comparison.summary.similarityScore >= 80) {
            recommendations.push({
                type: 'warning',
                message: '⚠️ Los formularios son muy similares pero tienen algunas diferencias menores.',
                priority: 'low'
            });
        } else if (comparison.summary.similarityScore >= 50) {
            recommendations.push({
                type: 'alert',
                message: '🔍 Los formularios tienen diferencias significativas que requieren revisión.',
                priority: 'medium'
            });
        } else {
            recommendations.push({
                type: 'error',
                message: '🚨 Los formularios son muy diferentes. Se recomienda revisión manual completa.',
                priority: 'high'
            });
        }

        if (comparison.summary.missingInForm1 > 0) {
            recommendations.push({
                type: 'info',
                message: `📝 ${comparison.summary.missingInForm1} campo(s) faltan en el primer formulario.`,
                priority: 'medium'
            });
        }

        if (comparison.summary.missingInForm2 > 0) {
            recommendations.push({
                type: 'info',
                message: `📝 ${comparison.summary.missingInForm2} campo(s) faltan en el segundo formulario.`,
                priority: 'medium'
            });
        }

        comparison.recommendations = recommendations;
    }

    /**
     * Actualiza el estado de procesamiento en la UI
     * @param {string} formId - ID del formulario
     * @param {string} message - Mensaje de estado
     * @param {string} type - Tipo de mensaje (info, error, success)
     */
    updateProcessingStatus(formId, message, type = 'info') {
        const statusElement = document.getElementById(`processing${formId === 'form1' ? '1' : '2'}`);
        if (statusElement) {
            const messageElement = statusElement.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
                
                // Cambiar color según el tipo
                switch (type) {
                    case 'error':
                        messageElement.style.color = 'var(--error-color)';
                        break;
                    case 'success':
                        messageElement.style.color = 'var(--success-color)';
                        break;
                    default:
                        messageElement.style.color = 'var(--text-white)';
                }
            }
        }
    }

    /**
     * Genera un reporte detallado de la comparación
     * @returns {Object} Reporte completo
     */
    generateDetailedReport() {
        if (!this.comparisonResult) {
            throw new Error('No hay resultados de comparación disponibles');
        }

        const report = {
            ...this.comparisonResult,
            generatedAt: new Date().toISOString(),
            metadata: {
                processor: 'TRAZABILITY AI v2.0',
                totalProcessingTime: 'N/A',
                confidence: {
                    form1: this.extractedData.form1?.confidence || 0,
                    form2: this.extractedData.form2?.confidence || 0
                }
            }
        };

        return report;
    }

    /**
     * Limpia los datos almacenados
     */
    reset() {
        this.currentFiles = { file1: null, file2: null };
        this.extractedData = { form1: null, form2: null };
        this.comparisonResult = null;
    }

    /**
     * Obtiene estadísticas del procesamiento
     * @returns {Object} Estadísticas
     */
    getProcessingStats() {
        return {
            filesProcessed: Object.values(this.currentFiles).filter(f => f !== null).length,
            form1Ready: !!this.extractedData.form1,
            form2Ready: !!this.extractedData.form2,
            comparisonReady: !!this.comparisonResult,
            lastComparison: this.comparisonResult?.timestamp || null
        };
    }
}

// Exportar para uso global
window.PDFProcessor = PDFProcessor;