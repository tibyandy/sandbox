console.log('[CRX] SheetDatabase');

(() => {
	const CRX = window.CRX = window.CRX || { log: console.log.bind(null), error: console.error.bind(null) }

	class SheetDatabase {
		/**
		 * @param {string} webAppUrl - URL do Google Apps Script
		 */
		constructor(webAppUrl) {
			this.webAppUrl = webAppUrl;
			this._data = {};
		}

		get data() {
			return this._data;
		}

		/**
		 * Recarrega todas as abas e registros do Google Sheets para o objeto JS local.
		 * @returns {Promise<Object>}
		 */
		async load() {
			try {
				const response = await fetch(this.webAppUrl);
				if (!response.ok) {
					throw new Error(`Erro ao carregar dados: ${response.statusText}`);
				}
				this._data = await response.json();
				return this._data;
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
			if (!this._data[aba]) {
				this._data[aba] = {};
			}

			// 1. Atualiza o estado local mesclando propriedades existentes (Patch)
			const mergedRecord = {
				...(this._data[aba][chave] || {}),
				...valorObj
			};
			this._data[aba][chave] = mergedRecord;

			// 2. Persiste a alteração na planilha enviando o registro completo mesclado
			try {
				const response = await fetch(this.webAppUrl, {
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
			if (!this._data[aba]) return undefined;
			if (chave === undefined) return this._data[aba];
			return this._data[aba][chave];
		}
	}

	Object.assign(CRX, { db: new SheetDatabase('https://script.google.com/macros/s/AKfycbwORMmKGgCniErjivco8ahYpBU_c6AyoQMfUY8mlseE829D1R58w4G1ogFxqx9v3r_0/exec') })
	console.log('[CRX] db', CRX.db)
})()
