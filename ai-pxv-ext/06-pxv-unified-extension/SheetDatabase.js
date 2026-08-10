(async () => {
	console.log('[CRX] SheetDatabase 1.1.2');
	const CRX = window.CRX = window.CRX || { log: console.log.bind(null), error: console.error.bind(null) }

	const fetch = CRX.originalFetch || window.fetch

	const instance = { webAppUrl: null, data: null }

	class SheetDatabase {
		/**
		 * @param {string} webAppUrl - URL do Google Apps Script
		 */
		constructor(webAppUrl) {
			instance.webAppUrl = webAppUrl;
			instance.data = {};
		}

		get data() {
			return instance.data;
		}

		/**
		 * Recarrega todas as abas e registros do Google Sheets para o objeto JS local.
		 * @returns {Promise<Object>}
		 */
		async load() {
			try {
				const response = await fetch(instance.webAppUrl);
				if (!response.ok) {
					throw new Error(`Erro ao carregar dados: ${response.statusText}`);
				}
				instance.data = await response.json();
				return instance.data;
			} catch (error) {
				console.error("SheetDatabase.load() falhou:", error);
				throw error;
			}
		}

		/**
		 * Insere ou atualiza (com comportamento PATCH) um registro em uma aba específica.
		 * 
		 * @param {string} aba - Nome da aba (ex: "pessoas", "documentos")
		 * @param {string} chave - Chave identificadora do registro (ex: "João")
		 * @param {Object} valorObj - Objeto com propriedades (ex: { "idade": 35 })
		 */
		async put(aba, chave, valorObj = {}) {
			// Garante que a estrutura da aba existe no estado local
			if (!instance.data[aba]) {
				instance.data[aba] = {};
			}

			// 1. Atualiza o estado local mesclando propriedades existentes (Patch)
			const mergedRecord = {
				...(instance.data[aba][chave] || {}),
				...valorObj
			};
			instance.data[aba][chave] = mergedRecord;

			// 2. Persiste a alteração na planilha enviando o registro completo mesclado
			try {
				const response = await fetch(instance.webAppUrl, {
					method: "POST",
					mode: "cors",
					redirect: "follow",
					headers: {
						"Content-Type": "text/plain;charset=utf-8"
					},
					body: JSON.stringify({
						action: "put",
						sheetName: aba,
						key: chave,
						values: mergedRecord
					})
				});

				const resJson = await response.json();
				if (resJson.status !== "success") {
					throw new Error(resJson.message || "Erro desconhecido ao salvar.");
				}
			} catch (error) {
				console.error(`SheetDatabase.put("${aba}", "${chave}") falhou:`, error);
				throw error;
			}
		}

		/**
		 * Obtém os dados de uma chave em uma aba, ou a aba inteira se nenhuma chave for especificada.
		 * 
		 * @param {string} aba - Nome da aba
		 * @param {string} [chave] - Chave opcional do registro
		 * @returns {Object|undefined}
		 */
		get(aba, chave) {
			if (!instance.data[aba]) return undefined;
			if (chave === undefined) return instance.data[aba];
			return instance.data[aba][chave];
		}

	/**
		 * Insere ou atualiza múltiplos registros de uma só vez em 1 única requisição HTTP.
		 * 
		 * @param {string} aba - Nome da aba (ex: 'tags')
		 * @param {Array<{key: string, values: Object}>} items - Array de objetos a salvar
		 */
		async putMany(aba, items) {
			if (!instance.data[aba]) instance.data[aba] = {};

			// 1. Atualiza o estado local imediatamente
			items.forEach(({ key, values }) => {
				instance.data[aba][key] = {
					...(instance.data[aba][key] || {}),
					...values
				};
			});

			// 2. Dispara apenas UMA requisição HTTP enviando todo o lote
			try {
				const response = await fetch(instance.webAppUrl, {
					method: "POST",
					mode: "cors",
					redirect: "follow",
					headers: {
						"Content-Type": "text/plain;charset=utf-8"
					},
					body: JSON.stringify({
						action: "putMany",
						sheetName: aba,
						items: items.map(({ key, values }) => ({
							key,
							// Envia o objeto mesclado do estado local atualizado
							values: instance.data[aba][key]
						}))
					})
				});

				const resJson = await response.json();
				if (resJson.status !== "success") {
					throw new Error(resJson.message || "Erro ao salvar o lote.");
				}
			} catch (error) {
				console.error(`SheetDatabase.putMany("${aba}") falhou:`, error);
				throw error;
			}
		}		
	}

	Object.assign(CRX, { db: new SheetDatabase('https://script.google.com/macros/s/AKfycbyD10xPFTq5hDtkR1Y2zHPEJbVfP7S_iQd3RscuMdxhGMrhQ0qjjQYk-NmTYwRw5pD_6w/exec') })
	console.log('[CRX] db starting')
	await CRX.db.load()
	console.log('[CRX] db', CRX.db)
})()
