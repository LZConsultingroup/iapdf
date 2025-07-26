/**
 * TRAZABILITY AI - Procesador Real de PDFs
 * Sistema avanzado para extraer y comparar campos reales de formularios PDF
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
            maxPages: 50,
            timeout: 60000 // 60 segundos
        };

        // Patrones mejorados para identificar campos reales de formularios
        this.fieldPatterns = {
            // Información personal básica
            nombre_completo: /(?:nombre\s*completo|full\s*name|apellidos?\s*y\s*nombres?)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{3,80})/gi,
            primer_nombre: /(?:primer\s*nombre|first\s*name|nombre)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1]{2,30})/gi,
            apellidos: /(?:apellidos?|last\s*name|surname)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            
            // Documentos de identidad
            cedula: /(?:cedula|c\.?i\.?|documento\s*de\s*identidad|dni)[\s:]*([0-9]{6,12})/gi,
            pasaporte: /(?:pasaporte|passport)[\s:]*([A-Z0-9]{6,15})/gi,
            rif: /(?:rif|r\.?i\.?f\.?)[\s:]*([JVEGP]-?[0-9]{8,9}-?[0-9])/gi,
            
            // Información de contacto
            email: /(?:email|correo|e-mail|mail)[\s:]*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
            telefono: /(?:telefono|phone|tel|celular|movil)[\s:]*([+]?[0-9\s()-]{7,20})/gi,
            telefono_fijo: /(?:telefono\s*fijo|tel\s*fijo|landline)[\s:]*([0-9\s()-]{7,15})/gi,
            telefono_movil: /(?:telefono\s*movil|celular|mobile|cell)[\s:]*([+]?[0-9\s()-]{7,20})/gi,
            
            // Información de dirección
            direccion_completa: /(?:direccion\s*completa|full\s*address|domicilio)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,#-]{10,150})/gi,
            calle: /(?:calle|street|st)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,#-]{5,80})/gi,
            ciudad: /(?:ciudad|city|localidad)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            estado: /(?:estado|state|provincia)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            codigo_postal: /(?:codigo\s*postal|zip|postal\s*code|cp)[\s:]*([A-Z0-9\s-]{3,10})/gi,
            pais: /(?:pais|country)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{2,50})/gi,
            
            // Fechas importantes
            fecha_nacimiento: /(?:fecha\s*de?\s*nacimiento|birth\s*date|born|nac\.)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/gi,
            fecha_expedicion: /(?:fecha\s*de?\s*expedicion|issue\s*date|exp\.)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/gi,
            fecha_vencimiento: /(?:fecha\s*de?\s*vencimiento|expiry\s*date|venc\.)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/gi,
            
            // Información laboral
            empresa: /(?:empresa|company|empleador|employer|organizacion)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s&.,]{3,100})/gi,
            cargo: /(?:cargo|position|puesto|job\s*title|ocupacion)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{3,80})/gi,
            salario: /(?:salario|salary|sueldo|income|ingreso)[\s:]*([0-9.,\$€£¥Bs]{3,20})/gi,
            antiguedad: /(?:antiguedad|seniority|años\s*de\s*servicio)[\s:]*([0-9]{1,2}\s*años?|[0-9]{1,2}\s*meses?)/gi,
            
            // Información académica
            nivel_educativo: /(?:nivel\s*educativo|education\s*level|estudios)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{5,50})/gi,
            institucion: /(?:institucion|institution|universidad|colegio)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s&.,]{5,100})/gi,
            titulo: /(?:titulo|degree|carrera)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{5,80})/gi,
            
            // Información familiar
            estado_civil: /(?:estado\s*civil|marital\s*status)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{4,20})/gi,
            genero: /(?:genero|gender|sexo)[\s:]*([MFmfMasculinoFemeninoMaleFemale]{1,10})/gi,
            nacionalidad: /(?:nacionalidad|nationality)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{4,30})/gi,
            
            // Información financiera
            banco: /(?:banco|bank)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s&.,]{3,50})/gi,
            numero_cuenta: /(?:numero\s*de?\s*cuenta|account\s*number|cuenta)[\s:]*([0-9-]{10,25})/gi,
            tipo_cuenta: /(?:tipo\s*de?\s*cuenta|account\s*type)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s]{5,30})/gi,
            
            // Campos específicos de formularios
            codigo_referencia: /(?:codigo\s*de?\s*referencia|reference\s*code|ref)[\s:]*([A-Z0-9-]{5,20})/gi,
            numero_solicitud: /(?:numero\s*de?\s*solicitud|application\s*number)[\s:]*([0-9-]{5,20})/gi,
            fecha_solicitud: /(?:fecha\s*de?\s*solicitud|application\s*date)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/gi,
            
            // Campos de texto libre
            observaciones: /(?:observaciones|comments|notas|notes|remarks)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,;:!?\-]{10,500})/gi,
            descripcion: /(?:descripcion|description|detalle|details)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,;:!?\-]{10,300})/gi,
            motivo: /(?:motivo|reason|proposito|purpose)[\s:]*([A-Za-zÀ-ÿ\u00f1\u00d1\s0-9.,;:!?\-]{5,200})/gi
        };

        // Configurar PDF.js
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
    }

    /**
     * Procesa un archivo PDF y extrae los campos del formulario de manera real
     * @param {File} file - Archivo PDF a procesar
     * @param {string} formId - Identificador del formulario (form1 o form2)
     * @returns {Promise<Object>} Datos extraídos del formulario
     */
    async processFormPDF(file, formId) {
        try {
            console.log(`🔄 Iniciando procesamiento real de ${file.name}`);
            
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
            
            console.log(`📄 PDF cargado: ${pdfDoc.numPages} páginas`);
            
            // Validar número de páginas
            if (pdfDoc.numPages > this.limits.maxPages) {
                throw new Error(`El documento tiene ${pdfDoc.numPages} páginas. Máximo permitido: ${this.limits.maxPages}`);
            }
            
            // Extraer campos de formulario interactivos
            this.updateProcessingStatus(formId, 'Extrayendo campos interactivos...');
            const interactiveFields = await this.extractInteractiveFields(pdfDoc);
            
            // Extraer texto de todas las páginas
            this.updateProcessingStatus(formId, 'Extrayendo contenido de texto...');
            const textContent = await this.extractTextFromPDF(pdfDoc);
            
            // Procesar y estructurar datos
            this.updateProcessingStatus(formId, 'Identificando campos del formulario...');
            const extractedData = this.processExtractedData(textContent, interactiveFields, file.name);
            
            // Almacenar datos procesados
            this.extractedData[formId] = extractedData;
            
            console.log(`✅ Procesamiento completado: ${extractedData.fieldCount} campos encontrados`);
            
            return extractedData;
            
        } catch (error) {
            console.error(`❌ Error procesando ${formId}:`, error);
            throw error;
        }
    }

    /**
     * Extrae campos interactivos del PDF (formularios rellenables)
     * @param {Object} pdfDoc - Documento PDF cargado
     * @returns {Promise<Array>} Array de campos interactivos
     */
    async extractInteractiveFields(pdfDoc) {
        const interactiveFields = [];
        
        try {
            for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
                const page = await pdfDoc.getPage(pageNum);
                const annotations = await page.getAnnotations();
                
                for (const annotation of annotations) {
                    if (annotation.subtype === 'Widget' && annotation.fieldName) {
                        const fieldValue = annotation.fieldValue || annotation.buttonValue || '';
                        
                        if (fieldValue && fieldValue.toString().trim()) {
                            interactiveFields.push({
                                name: annotation.fieldName,
                                value: fieldValue.toString().trim(),
                                type: annotation.fieldType || 'text',
                                page: pageNum,
                                rect: annotation.rect,
                                source: 'interactive'
                            });
                        }
                    }
                }
            }
            
            console.log(`🔍 Campos interactivos encontrados: ${interactiveFields.length}`);
            
        } catch (error) {
            console.warn('⚠️ No se pudieron extraer campos interactivos:', error);
        }
        
        return interactiveFields;
    }

    /**
     * Extrae texto completo del PDF con mejor precisión
     * @param {Object} pdfDoc - Documento PDF cargado
     * @returns {Promise<Object>} Objeto con texto y metadatos
     */
    async extractTextFromPDF(pdfDoc) {
        const textData = {
            fullText: '',
            pageTexts: [],
            textItems: []
        };
        
        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            const page = await pdfDoc.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            let pageText = '';
            const pageItems = [];
            
            textContent.items.forEach(item => {
                const text = item.str.trim();
                if (text) {
                    pageText += text + ' ';
                    pageItems.push({
                        text: text,
                        x: item.transform[4],
                        y: item.transform[5],
                        width: item.width,
                        height: item.height,
                        fontName: item.fontName
                    });
                }
            });
            
            textData.pageTexts.push(pageText.trim());
            textData.textItems.push(pageItems);
            textData.fullText += `\n--- PÁGINA ${pageNum} ---\n${pageText}\n`;
        }
        
        return textData;
    }

    /**
     * Procesa y estructura los datos extraídos con mayor precisión
     * @param {Object} textData - Datos de texto extraídos
     * @param {Array} interactiveFields - Campos interactivos
     * @param {string} fileName - Nombre del archivo
     * @returns {Object} Datos estructurados
     */
    processExtractedData(textData, interactiveFields, fileName) {
        const extractedData = {
            fileName: fileName,
            processedAt: new Date().toISOString(),
            formFields: {},
            interactiveFields: interactiveFields,
            textData: textData,
            fieldCount: 0,
            confidence: 0,
            processingLog: []
        };

        // Procesar campos interactivos primero (mayor confianza)
        interactiveFields.forEach(field => {
            const normalizedName = this.normalizeFieldName(field.name);
            extractedData.formFields[normalizedName] = {
                value: field.value,
                type: field.type,
                source: 'interactive',
                confidence: 1.0,
                originalName: field.name,
                page: field.page
            };
            extractedData.fieldCount++;
            extractedData.processingLog.push(`✅ Campo interactivo: ${normalizedName} = "${field.value}"`);
        });

        // Extraer campos usando patrones de texto
        const fullText = textData.fullText;
        let patternMatches = 0;
        
        Object.entries(this.fieldPatterns).forEach(([fieldName, pattern]) => {
            // Resetear el índice del patrón
            pattern.lastIndex = 0;
            
            const matches = [...fullText.matchAll(pattern)];
            
            if (matches.length > 0) {
                // Tomar la mejor coincidencia (más larga y completa)
                const bestMatch = matches.reduce((best, current) => {
                    const currentValue = current[1].trim();
                    const bestValue = best[1].trim();
                    
                    // Preferir valores más largos y completos
                    if (currentValue.length > bestValue.length) {
                        return current;
                    }
                    return best;
                });
                
                const value = bestMatch[1].trim();
                
                if (value && value.length > 1 && !this.isCommonWord(value)) {
                    // Si no existe como campo interactivo, agregarlo
                    if (!extractedData.formFields[fieldName]) {
                        extractedData.formFields[fieldName] = {
                            value: this.cleanFieldValue(value),
                            type: 'text',
                            source: 'pattern',
                            confidence: this.calculatePatternConfidence(fieldName, value),
                            originalPattern: pattern.source
                        };
                        extractedData.fieldCount++;
                        patternMatches++;
                        extractedData.processingLog.push(`🔍 Campo por patrón: ${fieldName} = "${value}"`);
                    }
                }
            }
        });

        // Calcular confianza general
        const totalPossibleFields = Object.keys(this.fieldPatterns).length;
        const interactiveWeight = 0.7;
        const patternWeight = 0.3;
        
        extractedData.confidence = Math.min(
            ((interactiveFields.length * interactiveWeight + patternMatches * patternWeight) / totalPossibleFields) * 100,
            100
        );

        console.log(`📊 Datos extraídos: ${extractedData.fieldCount} campos, ${extractedData.confidence.toFixed(1)}% confianza`);
        
        return extractedData;
    }

    /**
     * Normaliza el nombre de un campo
     * @param {string} fieldName - Nombre original del campo
     * @returns {string} Nombre normalizado
     */
    normalizeFieldName(fieldName) {
        return fieldName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }

    /**
     * Limpia el valor de un campo
     * @param {string} value - Valor original
     * @returns {string} Valor limpio
     */
    cleanFieldValue(value) {
        return value
            .replace(/\s+/g, ' ')
            .replace(/[^\w\s@.-]/g, '')
            .trim();
    }

    /**
     * Verifica si una palabra es común y debe ser ignorada
     * @param {string} word - Palabra a verificar
     * @returns {boolean} True si es palabra común
     */
    isCommonWord(word) {
        const commonWords = ['de', 'la', 'el', 'en', 'y', 'a', 'que', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'del', 'los', 'las', 'un', 'una'];
        return commonWords.includes(word.toLowerCase()) || word.length < 2;
    }

    /**
     * Calcula la confianza de un patrón
     * @param {string} fieldName - Nombre del campo
     * @param {string} value - Valor encontrado
     * @returns {number} Nivel de confianza
     */
    calculatePatternConfidence(fieldName, value) {
        let confidence = 0.8; // Base
        
        // Aumentar confianza para ciertos tipos de campos
        if (fieldName.includes('email') && value.includes('@')) confidence = 0.95;
        if (fieldName.includes('telefono') && /^[+]?[0-9\s()-]{7,}$/.test(value)) confidence = 0.9;
        if (fieldName.includes('cedula') && /^[0-9]{6,}$/.test(value)) confidence = 0.9;
        if (fieldName.includes('fecha') && /[0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}/.test(value)) confidence = 0.9;
        
        return confidence;
    }

    /**
     * Compara dos formularios procesados de manera real y detallada
     * @returns {Object} Resultado detallado de la comparación
     */
    compareFormularios() {
        if (!this.extractedData.form1 || !this.extractedData.form2) {
            throw new Error('Ambos formularios deben estar procesados antes de compararlos');
        }

        const form1 = this.extractedData.form1;
        const form2 = this.extractedData.form2;
        
        console.log('🔄 Iniciando comparación real de formularios...');
        
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
                similarityScore: 0,
                isIdentical: false
            },
            fieldComparisons: {},
            differences: [],
            identicalFields: [],
            recommendations: [],
            processingDetails: {
                form1Confidence: form1.confidence,
                form2Confidence: form2.confidence,
                comparisonMethod: 'advanced_pattern_matching'
            }
        };

        // Obtener todos los campos únicos
        const allFields = new Set([
            ...Object.keys(form1.formFields),
            ...Object.keys(form2.formFields)
        ]);

        comparison.summary.totalFields = allFields.size;
        console.log(`📊 Comparando ${comparison.summary.totalFields} campos únicos`);

        // Comparar cada campo de manera detallada
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
                },
                source: {
                    form1: field1 ? field1.source : null,
                    form2: field2 ? field2.source : null
                }
            };

            if (!field1 && field2) {
                fieldComparison.status = 'missing_in_form1';
                comparison.summary.missingInForm1++;
                comparison.differences.push({
                    type: 'missing_field',
                    field: fieldName,
                    form1Value: null,
                    form2Value: field2.value,
                    message: `Campo "${this.getFieldDisplayName(fieldName)}" presente solo en ${form2.fileName}`,
                    severity: 'medium',
                    recommendation: 'Verificar si este campo debería estar presente en ambos formularios'
                });
            } else if (field1 && !field2) {
                fieldComparison.status = 'missing_in_form2';
                comparison.summary.missingInForm2++;
                comparison.differences.push({
                    type: 'missing_field',
                    field: fieldName,
                    form1Value: field1.value,
                    form2Value: null,
                    message: `Campo "${this.getFieldDisplayName(fieldName)}" presente solo en ${form1.fileName}`,
                    severity: 'medium',
                    recommendation: 'Verificar si este campo debería estar presente en ambos formularios'
                });
            } else if (field1 && field2) {
                // Comparar valores con algoritmo mejorado
                const similarity = this.calculateAdvancedSimilarity(field1.value, field2.value, fieldName);
                fieldComparison.similarity = similarity;
                
                if (similarity >= 0.98) {
                    fieldComparison.status = 'identical';
                    comparison.summary.matchingFields++;
                    comparison.identicalFields.push({
                        field: fieldName,
                        value: field1.value,
                        confidence: Math.min(field1.confidence, field2.confidence)
                    });
                } else if (similarity >= 0.85) {
                    fieldComparison.status = 'similar';
                    comparison.summary.differentFields++;
                    comparison.differences.push({
                        type: 'similar_values',
                        field: fieldName,
                        form1Value: field1.value,
                        form2Value: field2.value,
                        similarity: similarity,
                        message: `Campo "${this.getFieldDisplayName(fieldName)}" tiene valores similares pero no idénticos`,
                        severity: 'low',
                        recommendation: 'Revisar manualmente para confirmar si las diferencias son aceptables'
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
                        message: `Campo "${this.getFieldDisplayName(fieldName)}" tiene valores completamente diferentes`,
                        severity: 'high',
                        recommendation: 'Verificación manual requerida - diferencia significativa detectada'
                    });
                }
            }

            comparison.fieldComparisons[fieldName] = fieldComparison;
        });

        // Calcular puntaje de similitud general
        if (comparison.summary.totalFields > 0) {
            const exactMatches = comparison.summary.matchingFields;
            const totalComparableFields = comparison.summary.totalFields - comparison.summary.missingInForm1 - comparison.summary.missingInForm2;
            
            if (totalComparableFields > 0) {
                comparison.summary.similarityScore = Math.round((exactMatches / totalComparableFields) * 100);
            } else {
                comparison.summary.similarityScore = 0;
            }
        }

        // Determinar si son idénticos
        comparison.summary.isIdentical = (
            comparison.summary.similarityScore === 100 && 
            comparison.summary.missingInForm1 === 0 && 
            comparison.summary.missingInForm2 === 0
        );

        // Generar recomendaciones detalladas
        this.generateDetailedRecommendations(comparison);

        // Almacenar resultado
        this.comparisonResult = comparison;

        console.log(`✅ Comparación completada: ${comparison.summary.similarityScore}% similitud`);
        
        return comparison;
    }

    /**
     * Calcula similitud avanzada entre dos valores
     * @param {string} value1 - Primer valor
     * @param {string} value2 - Segundo valor
     * @param {string} fieldType - Tipo de campo
     * @returns {number} Similitud entre 0 y 1
     */
    calculateAdvancedSimilarity(value1, value2, fieldType) {
        if (!value1 || !value2) return 0;
        
        // Normalizar valores
        const v1 = this.normalizeValue(value1, fieldType);
        const v2 = this.normalizeValue(value2, fieldType);
        
        if (v1 === v2) return 1;
        
        // Aplicar algoritmos específicos según el tipo de campo
        if (fieldType.includes('email')) {
            return this.compareEmails(v1, v2);
        } else if (fieldType.includes('telefono')) {
            return this.comparePhones(v1, v2);
        } else if (fieldType.includes('fecha')) {
            return this.compareDates(v1, v2);
        } else if (fieldType.includes('cedula') || fieldType.includes('documento')) {
            return this.compareDocuments(v1, v2);
        } else {
            return this.calculateLevenshteinSimilarity(v1, v2);
        }
    }

    /**
     * Normaliza un valor según su tipo
     * @param {string} value - Valor a normalizar
     * @param {string} fieldType - Tipo de campo
     * @returns {string} Valor normalizado
     */
    normalizeValue(value, fieldType) {
        let normalized = value.toString().trim().toLowerCase();
        
        if (fieldType.includes('telefono')) {
            normalized = normalized.replace(/[\s()-]/g, '');
        } else if (fieldType.includes('email')) {
            normalized = normalized.toLowerCase();
        } else if (fieldType.includes('nombre')) {
            normalized = normalized.replace(/\s+/g, ' ');
        }
        
        return normalized;
    }

    /**
     * Compara emails
     * @param {string} email1 - Primer email
     * @param {string} email2 - Segundo email
     * @returns {number} Similitud
     */
    compareEmails(email1, email2) {
        if (email1 === email2) return 1;
        
        const [user1, domain1] = email1.split('@');
        const [user2, domain2] = email2.split('@');
        
        if (domain1 !== domain2) return 0.3; // Dominios diferentes
        
        return this.calculateLevenshteinSimilarity(user1, user2) * 0.8 + 0.2;
    }

    /**
     * Compara teléfonos
     * @param {string} phone1 - Primer teléfono
     * @param {string} phone2 - Segundo teléfono
     * @returns {number} Similitud
     */
    comparePhones(phone1, phone2) {
        // Remover prefijos comunes
        const clean1 = phone1.replace(/^(\+58|0058|58|0)/, '');
        const clean2 = phone2.replace(/^(\+58|0058|58|0)/, '');
        
        if (clean1 === clean2) return 1;
        
        return this.calculateLevenshteinSimilarity(clean1, clean2);
    }

    /**
     * Compara fechas
     * @param {string} date1 - Primera fecha
     * @param {string} date2 - Segunda fecha
     * @returns {number} Similitud
     */
    compareDates(date1, date2) {
        // Intentar parsear fechas en diferentes formatos
        const parsed1 = this.parseDate(date1);
        const parsed2 = this.parseDate(date2);
        
        if (parsed1 && parsed2) {
            return parsed1.getTime() === parsed2.getTime() ? 1 : 0;
        }
        
        return this.calculateLevenshteinSimilarity(date1, date2);
    }

    /**
     * Parsea una fecha en múltiples formatos
     * @param {string} dateStr - String de fecha
     * @returns {Date|null} Fecha parseada o null
     */
    parseDate(dateStr) {
        const formats = [
            /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/,
            /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})$/,
            /^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/
        ];
        
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                const [, p1, p2, p3] = match;
                // Asumir formato DD/MM/YYYY para los primeros dos patrones
                if (format === formats[0] || format === formats[1]) {
                    const year = p3.length === 2 ? `20${p3}` : p3;
                    return new Date(year, p2 - 1, p1);
                } else {
                    return new Date(p1, p2 - 1, p3);
                }
            }
        }
        
        return null;
    }

    /**
     * Compara documentos de identidad
     * @param {string} doc1 - Primer documento
     * @param {string} doc2 - Segundo documento
     * @returns {number} Similitud
     */
    compareDocuments(doc1, doc2) {
        // Para documentos, debe ser exacto
        return doc1 === doc2 ? 1 : 0;
    }

    /**
     * Calcula similitud usando distancia de Levenshtein
     * @param {string} str1 - Primer string
     * @param {string} str2 - Segundo string
     * @returns {number} Similitud entre 0 y 1
     */
    calculateLevenshteinSimilarity(str1, str2) {
        if (str1 === str2) return 1;
        
        const matrix = [];
        const len1 = str1.length;
        const len2 = str2.length;
        
        if (len1 === 0) return len2 === 0 ? 1 : 0;
        if (len2 === 0) return 0;
        
        for (let i = 0; i <= len1; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= len2; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= len1; i++) {
            for (let j = 1; j <= len2; j++) {
                if (str1.charAt(i - 1) === str2.charAt(j - 1)) {
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
     * Obtiene el nombre de visualización de un campo
     * @param {string} fieldName - Nombre interno del campo
     * @returns {string} Nombre para mostrar
     */
    getFieldDisplayName(fieldName) {
        const displayNames = {
            nombre_completo: 'Nombre Completo',
            primer_nombre: 'Primer Nombre',
            apellidos: 'Apellidos',
            cedula: 'Cédula',
            pasaporte: 'Pasaporte',
            rif: 'RIF',
            email: 'Email',
            telefono: 'Teléfono',
            telefono_fijo: 'Teléfono Fijo',
            telefono_movil: 'Teléfono Móvil',
            direccion_completa: 'Dirección Completa',
            ciudad: 'Ciudad',
            estado: 'Estado',
            codigo_postal: 'Código Postal',
            pais: 'País',
            fecha_nacimiento: 'Fecha de Nacimiento',
            fecha_expedicion: 'Fecha de Expedición',
            fecha_vencimiento: 'Fecha de Vencimiento',
            empresa: 'Empresa',
            cargo: 'Cargo',
            salario: 'Salario',
            estado_civil: 'Estado Civil',
            genero: 'Género',
            nacionalidad: 'Nacionalidad'
        };
        
        return displayNames[fieldName] || fieldName.replace(/_/g, ' ').toUpperCase();
    }

    /**
     * Genera recomendaciones detalladas
     * @param {Object} comparison - Resultado de la comparación
     */
    generateDetailedRecommendations(comparison) {
        const recommendations = [];
        
        if (comparison.summary.isIdentical) {
            recommendations.push({
                type: 'success',
                icon: '✅',
                message: 'Los formularios son completamente idénticos. Todos los campos coinciden perfectamente.',
                priority: 'info',
                action: 'No se requiere acción adicional.'
            });
        } else if (comparison.summary.similarityScore >= 90) {
            recommendations.push({
                type: 'success',
                icon: '✅',
                message: `Los formularios son muy similares (${comparison.summary.similarityScore}% de coincidencia).`,
                priority: 'low',
                action: 'Revisar las diferencias menores encontradas.'
            });
        } else if (comparison.summary.similarityScore >= 70) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                message: `Los formularios tienen similitud moderada (${comparison.summary.similarityScore}%).`,
                priority: 'medium',
                action: 'Se recomienda revisión manual de las diferencias.'
            });
        } else {
            recommendations.push({
                type: 'error',
                icon: '🚨',
                message: `Los formularios tienen diferencias significativas (${comparison.summary.similarityScore}% similitud).`,
                priority: 'high',
                action: 'Revisión manual completa requerida.'
            });
        }

        // Recomendaciones específicas por tipo de diferencia
        const highSeverityDiffs = comparison.differences.filter(d => d.severity === 'high');
        if (highSeverityDiffs.length > 0) {
            recommendations.push({
                type: 'alert',
                icon: '🔍',
                message: `Se encontraron ${highSeverityDiffs.length} diferencia(s) crítica(s) que requieren atención inmediata.`,
                priority: 'high',
                action: 'Verificar manualmente cada diferencia crítica.'
            });
        }

        if (comparison.summary.missingInForm1 > 0 || comparison.summary.missingInForm2 > 0) {
            recommendations.push({
                type: 'info',
                icon: '📝',
                message: `Campos faltantes detectados: ${comparison.summary.missingInForm1} en formulario 1, ${comparison.summary.missingInForm2} en formulario 2.`,
                priority: 'medium',
                action: 'Verificar si todos los campos requeridos están presentes.'
            });
        }

        comparison.recommendations = recommendations;
    }

    /**
     * Genera un reporte PDF detallado de la comparación
     * @returns {Object} Datos del reporte
     */
    generateDetailedReport() {
        if (!this.comparisonResult) {
            throw new Error('No hay resultados de comparación disponibles para generar el reporte');
        }

        const report = {
            ...this.comparisonResult,
            generatedAt: new Date().toISOString(),
            reportId: `RPT-${Date.now()}`,
            metadata: {
                processor: 'TRAZABILITY AI v2.0',
                version: '2.0.0',
                processingMethod: 'Advanced Pattern Recognition',
                confidence: {
                    form1: this.extractedData.form1?.confidence || 0,
                    form2: this.extractedData.form2?.confidence || 0,
                    overall: (this.extractedData.form1?.confidence + this.extractedData.form2?.confidence) / 2 || 0
                }
            },
            executiveSummary: this.generateExecutiveSummary(),
            detailedAnalysis: this.generateDetailedAnalysis()
        };

        return report;
    }

    /**
     * Genera resumen ejecutivo
     * @returns {Object} Resumen ejecutivo
     */
    generateExecutiveSummary() {
        const result = this.comparisonResult;
        
        return {
            conclusion: result.summary.isIdentical ? 'DOCUMENTOS IDÉNTICOS' : 'DIFERENCIAS DETECTADAS',
            similarityPercentage: result.summary.similarityScore,
            totalFieldsAnalyzed: result.summary.totalFields,
            criticalDifferences: result.differences.filter(d => d.severity === 'high').length,
            recommendedAction: result.summary.isIdentical ? 'APROBAR' : 'REVISAR MANUALMENTE',
            riskLevel: this.calculateRiskLevel(result.summary.similarityScore)
        };
    }

    /**
     * Genera análisis detallado
     * @returns {Object} Análisis detallado
     */
    generateDetailedAnalysis() {
        const result = this.comparisonResult;
        
        return {
            fieldAnalysis: Object.entries(result.fieldComparisons).map(([field, comparison]) => ({
                fieldName: this.getFieldDisplayName(field),
                status: comparison.status,
                form1Value: comparison.form1Value,
                form2Value: comparison.form2Value,
                similarity: comparison.similarity,
                recommendation: this.getFieldRecommendation(comparison)
            })),
            differencesSummary: {
                total: result.differences.length,
                byType: this.groupDifferencesByType(result.differences),
                bySeverity: this.groupDifferencesBySeverity(result.differences)
            },
            qualityMetrics: {
                dataCompleteness: this.calculateDataCompleteness(),
                extractionAccuracy: this.calculateExtractionAccuracy(),
                comparisonReliability: this.calculateComparisonReliability()
            }
        };
    }

    /**
     * Calcula el nivel de riesgo
     * @param {number} similarity - Porcentaje de similitud
     * @returns {string} Nivel de riesgo
     */
    calculateRiskLevel(similarity) {
        if (similarity >= 95) return 'BAJO';
        if (similarity >= 80) return 'MEDIO';
        if (similarity >= 60) return 'ALTO';
        return 'CRÍTICO';
    }

    /**
     * Obtiene recomendación para un campo específico
     * @param {Object} comparison - Comparación del campo
     * @returns {string} Recomendación
     */
    getFieldRecommendation(comparison) {
        switch (comparison.status) {
            case 'identical':
                return 'Campo verificado correctamente';
            case 'similar':
                return 'Revisar diferencias menores';
            case 'different':
                return 'Verificación manual requerida';
            case 'missing_in_form1':
                return 'Completar información en formulario 1';
            case 'missing_in_form2':
                return 'Completar información en formulario 2';
            default:
                return 'Estado desconocido';
        }
    }

    /**
     * Agrupa diferencias por tipo
     * @param {Array} differences - Array de diferencias
     * @returns {Object} Diferencias agrupadas por tipo
     */
    groupDifferencesByType(differences) {
        return differences.reduce((acc, diff) => {
            acc[diff.type] = (acc[diff.type] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Agrupa diferencias por severidad
     * @param {Array} differences - Array de diferencias
     * @returns {Object} Diferencias agrupadas por severidad
     */
    groupDifferencesBySeverity(differences) {
        return differences.reduce((acc, diff) => {
            acc[diff.severity] = (acc[diff.severity] || 0) + 1;
            return acc;
        }, {});
    }

    /**
     * Calcula completitud de datos
     * @returns {number} Porcentaje de completitud
     */
    calculateDataCompleteness() {
        const form1Fields = Object.keys(this.extractedData.form1?.formFields || {}).length;
        const form2Fields = Object.keys(this.extractedData.form2?.formFields || {}).length;
        const totalPossible = Object.keys(this.fieldPatterns).length;
        
        return Math.round(((form1Fields + form2Fields) / (totalPossible * 2)) * 100);
    }

    /**
     * Calcula precisión de extracción
     * @returns {number} Porcentaje de precisión
     */
    calculateExtractionAccuracy() {
        const form1Confidence = this.extractedData.form1?.confidence || 0;
        const form2Confidence = this.extractedData.form2?.confidence || 0;
        
        return Math.round((form1Confidence + form2Confidence) / 2);
    }

    /**
     * Calcula confiabilidad de comparación
     * @returns {number} Porcentaje de confiabilidad
     */
    calculateComparisonReliability() {
        const totalFields = this.comparisonResult?.summary.totalFields || 0;
        const highConfidenceFields = Object.values(this.comparisonResult?.fieldComparisons || {})
            .filter(field => Math.min(field.confidence.form1, field.confidence.form2) > 0.8).length;
        
        return totalFields > 0 ? Math.round((highConfidenceFields / totalFields) * 100) : 0;
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
        
        if (file.size === 0) {
            throw new Error('El archivo está vacío');
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
     * Actualiza el estado de procesamiento en la UI
     * @param {string} formId - ID del formulario
     * @param {string} message - Mensaje de estado
     * @param {string} type - Tipo de mensaje
     */
    updateProcessingStatus(formId, message, type = 'info') {
        const statusElement = document.getElementById(`processing${formId === 'form1' ? '1' : '2'}`);
        if (statusElement) {
            const messageElement = statusElement.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
                
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
     * Limpia los datos almacenados
     */
    reset() {
        this.currentFiles = { file1: null, file2: null };
        this.extractedData = { form1: null, form2: null };
        this.comparisonResult = null;
        console.log('🔄 Procesador reiniciado');
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
            lastComparison: this.comparisonResult?.timestamp || null,
            totalFieldsExtracted: {
                form1: Object.keys(this.extractedData.form1?.formFields || {}).length,
                form2: Object.keys(this.extractedData.form2?.formFields || {}).length
            },
            confidence: {
                form1: this.extractedData.form1?.confidence || 0,
                form2: this.extractedData.form2?.confidence || 0
            }
        };
    }
}

// Exportar para uso global
window.PDFProcessor = PDFProcessor;