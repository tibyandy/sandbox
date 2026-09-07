void function main() {
	let DB
	let illustPageData
	let illustPageHref
	let bookmarkingThisPageIllust = false

	Extensor.loadCss('main.css')

	Extensor.Main = async ({ on, loadCss, Module, ...Ext }) => {
		on('fetch-before', ({ url, ...data }) => {
			if (!url.startsWith('/ajax')) return
			console.debug('before', url, data)
			if (url === '/ajax/illusts/bookmarks/add') {
				data = JSON.parse(data.body)
				console.debug('before Body', url, data)
				const illust_id = data?.illust_id
				if (illust_id == location.href.replaceAll(/(\?|\#).*/g, '').split('/').slice(-1)) {
					console.info('Bookmarking this illust!', illust_id)
					bookmarkingThisPageIllust = true
				} else {
					console.info('Bookmarking another illust!', illust_id)
					bookmarkingThisPageIllust = false
				}
			}
		})
		// on('fetch-error', data => console.debug('error', data.url, data.error))
		on('fetch-success', parser)

		await Module.load(
			'extension/router.js',
			'extension/dom-change-listener.js',
			'extension/location-change-listener.js',
			'extension/sheet-db.js',
		)
		DB = Extensor.Module('SheetDatabase')
	}

	async function parser({ url, response, ...eventObject }) {
		if (!url.startsWith('/ajax')) return

		const json = await response.json().catch(e => {
			console.debug('Ext:Parser', 'Not JSON', url, response, e)
			return
		})
		if (!json) return

		try {
			const extractedBookmarkId = extractBookmarkId(url, json)
			const extractedData = extractIllustData(json)
			if (extractedData?.bookmarkId) {
				console.debug('Ext:Parser', 'Saving bookmarked illust')
				await saveDataOnDB(extractedData)
			} else if (extractedBookmarkId && illustPageHref == location.href) {
				console.info('Ext:Parser', 'Saving NEW bookmarked illust')
				await saveDataOnDB(illustPageData)
			} else {
				console.debug('Ext:Parser', 'JSON!', url, json)
			}
		} catch (err) {
			console.error('Ext:Parser', 'Error', url, json, err)
		}
	}

	function extractBookmarkId(url, json) {
		if (url !== '/ajax/illusts/bookmarks/add' || !bookmarkingThisPageIllust) return
		const bookmarkId = json?.body?.last_bookmark_id
		Object.assign(illustPageData?.illustrationItem?.values || {}, { bookmarkId })
		return json?.body?.last_bookmark_id
	}

	async function saveDataOnDB(extractedData) {
		const { illustrationItem, userItem, tagItems, rawTags } = extractedData

		// 1. Salva/Atualiza primeiro as tags na aba 'tags'
		if (tagItems && tagItems.length > 0) {
			await DB.putMany('tags', tagItems)
			console.info('Ext:Parser', `${tagItems.length} tags successfully saved!`)
		}

		// 2. Salva o usuário (se houver)
		if (userItem) {
			await DB.putMany('users', [userItem])
			console.info('Ext:Parser', 'User', (userItem.key * 1), `(${userItem.values.userName}) successfully saved!`)
		}

		// 3. Resolve os valores atualizados de 'enTags' e 'categs' consultando a aba 'tags'
		const { enTags, categs } = await resolveTagsAndCategories(rawTags)

		// 4. Injeta as duas novas colunas nos valores da ilustração
		illustrationItem.values.enTags = enTags
		illustrationItem.values.categs = categs

		// 5. Salva a ilustração completa na aba 'illustrations'
		await DB.putMany('illustrations', [illustrationItem])
		console.info('Ext:Parser', 'Bookmarked illust', (illustrationItem.key * 1), `successfully saved!`)
	}

	function count(arr) {
		const count = arr.reduce((acc, item) => {
			acc[item] = (acc[item] || 0) + 1;
			return acc;
		}, {});

		return Object.entries(count)
			.map(([item, qtd]) => (qtd > 1 ? `${item}*${qtd}` : item))
			.join('  ');
	}

	/**
	 * Consulta a aba 'tags' para cada tag da ilustração e extrai:
	 * 1. enTag: myEn || en || ro || tagOriginal
	 * 2. categ: valor da coluna 'categ' (removendo duplicadas e vazias)
	 */
	async function resolveTagsAndCategories(rawTags = []) {
		const enTags = []
		const categsList = []

		for (const tagObj of rawTags) {
			const tagName = tagObj.tag
			if (!tagName) continue

			const storedTag = await DB.get('tags', tagName)
			const values = storedTag?.values || storedTag || {}

			const resolvedEn = values.myEn || values.en || values.ro || tagObj.translation?.en || tagObj.romaji || tagName
			enTags.push(resolvedEn.replaceAll(' ', '_'))

			const categ = values.categ || tagObj.categ
			if (categ && String(categ).trim()) {
				categ.split(' ').forEach(c => categsList.push(c.trim()))
			} else {
				categsList.push('?')
			}
		}

		return {
			enTags: enTags.join('  '),
			categs: count(categsList.filter(x => x !== 'IGNORE').sort())
		}
	}

	function extractIllustData(json) {
		if (!json || json.error || !json.body || !json.body.illustId) {
			return null
		}
		const { body: b } = json

		// Array bruto de tags recebido do Pixiv
		const rawTags = (b.tags && Array.isArray(b.tags.tags)) ? b.tags.tags : []
		const tagsString = rawTags.map(t => t.tag.replaceAll(' ', '_')).filter(Boolean).join('  ')

		// Mapeia cada tag individual para a aba 'tags'
		const tagItems = rawTags.map(t => {
			if (!t.tag) return null
			return {
				key: t.tag,
				values: {
					en: (t.translation?.en || "").replaceAll(' ', '_'),
					ro: (t.romaji || "").replaceAll(' ', '_')
				}
			}
		}).filter(Boolean)

		const illustId = String(b.illustId)
		const userId = String(b.userId || "")

		illustPageHref = location.href
		illustPageData = {
			illustrationItem: {
				key: illustId,
				values: {
					illustTitle: b.illustTitle || "",
					bookmarkId: b.bookmarkData?.id,
					createDate: b.createDate || "",
					xRestrict: b.xRestrict ?? 0,
					sl: b.sl ?? 0,
					aiType: b.aiType ?? 0,
					userId: userId,
					tags: tagsString
				}
			},
			userItem: userId ? {
				key: userId,
				values: {
					userName: b.userName || "",
					userAccount: b.userAccount || ""
				}
			} : null,
			tagItems: tagItems,
			rawTags: rawTags, // Mantém a referência bruta para a busca posterior
			bookmarkId: b.bookmarkData?.id
		}
		return illustPageData
	}

	window.addEventListener("message", (event) => {
		if (event.data && event.data.type === "PXTRA_SW_LOG") {
			const { type, message } = event.data.request.data
			console[type]('Ext:Worker', ...message)
		}
	})
}()