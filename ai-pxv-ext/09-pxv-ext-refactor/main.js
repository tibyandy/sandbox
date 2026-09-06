void function main() {
	let DB
	let illustPageData
	let illustPageHref

	Extensor.loadCss('main.css')

	Extensor.Main = async ({ on, loadCss, Module, ...Ext }) => {
		// on('fetch-before', data => console.debug('before', data));
		// on('fetch-error', data => console.debug('error', data.url, data.error));
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
				saveDataOnDB(extractedData)
			} else if (extractedBookmarkId && illustPageHref == location.href) {
				console.info('Ext:Parser', 'Saving NEW bookmarked illust')
				saveDataOnDB(illustPageData)
			} else {
				console.debug('Ext:Parser', 'JSON!', url, json)
			}
		} catch (err) {
			console.error('Ext:Parser', 'Error', url, json, err)
		}
	}

	function extractBookmarkId(url, json) {
		if (url !== '/ajax/illusts/bookmarks/add') return
		const bookmarkId = json?.body?.last_bookmark_id
		Object.assign(illustPageData?.illustrationItem?.values || {}, { bookmarkId })
		return json?.body?.last_bookmark_id
	}

	async function saveDataOnDB(extractedData) {
		const { illustrationItem, userItem, tagItems } = extractedData

		// 1. Salva a ilustração
		await DB.putMany('illustrations', [illustrationItem])
		console.info('Ext:Parser', 'Bookmarked illust', (illustrationItem.key * 1), `successfully saved!`)

		// 2. Salva o usuário (se houver)
		if (userItem) {
			await DB.putMany('users', [userItem])
			console.info('Ext:Parser', 'User', (userItem.key * 1), `(${userItem.values.userName}) successfully saved!`)
		}

		// 3. Salva as tags na aba 'tags' (se houver)
		if (tagItems && tagItems.length > 0) {
			await DB.putMany('tags', tagItems)
			console.info('Ext:Parser', tagItems.length, 'tags successfully saved!')
		}
	}

	function extractIllustData(json) {
		if (!json || json.error || !json.body || !json.body.illustId) {
			return null
		}
		const { body: b } = json

		// Extração das tags para o campo 'tags' da ilustração (JSON com os nomes)
		const tagsArray = (b.tags && Array.isArray(b.tags.tags)) ? b.tags.tags : []
		const tagsString = JSON.stringify(tagsArray.map(t => t.tag).filter(Boolean))

		// Mapeia cada tag individual para salvar na aba 'tags'
		const tagItems = tagsArray.map(t => {
			if (!t.tag) return null
			return {
				key: t.tag,
				values: {
					en: t.translation?.en || "",
					ro: t.romaji || ""
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
			// Objeto formatado para a aba 'users'
			userItem: userId ? {
				key: userId,
				values: {
					userName: b.userName || "",
					userAccount: b.userAccount || ""
				}
			} : null,
			// Array de objetos formatados para a aba 'tags'
			tagItems: tagItems,
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