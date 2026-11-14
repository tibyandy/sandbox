void function routeWorkCover () {
	const ifFound = (selector, callback) => {
		const e = document.querySelector(selector)
		e && callback(e)
	}

	const route = Q.route.workCover = {}
	route._initialized = false

	route.init = async () => {
		if (route._initialized) {
			Q.debug('routeWorkCover', 'already initialized').andLog()
			return
		}
		route._initialized = true
		Q.debug('routeWorkCover', 'initializing').andLog()
		if (!document.querySelector('#qx-work-div')) {
			await route._addQxWorkDiv()
		}
		await route._assignElementsToQxWorkDiv()
		Q.info('routeWorkCover', 'initialized').andLog()
	}

	route._addQxWorkDiv = async () => {
		const x = await waitFor('.h-64:has(~ .__top_side_menu_body)')
		x.after(JSML({
			div: [
				{ id: 'qx-work-div' },
				{ div: [{ id: 'qx-main' },
					{ div: [{ id: 'qx-work' }] },
					{ div: [{ id: 'qx-preview-images' }] },
					{ div: [{ id: 'qx-artist-works' }] },
					{ div: [{ id: 'qx-related-works' }] },
				]},
				{ div: [{ id: 'qx-aside' },
					{ div: [{ id: 'qx-aside-artist' }] },
					{ div: [{ id: 'qx-aside-artist-works' }] },
					{ div: [{ id: 'qx-aside-title' }] },
					{ div: [{ id: 'qx-aside-tags' }] },
					{ div: [{ id: 'qx-aside-description' }] },
					{ div: [{ id: 'qx-aside-date' }] },
					{ div: [{ id: 'qx-aside-rest' }] },
				]},
			]
		}).asNode)
	}

	route._assignElementsToQxWorkDiv = () => {
		ifFound('#qx-work:empty', qx => waitFor('main section div > div > figure:has(*[role=presentation] a img)')
			.then(e => qx.append(e)))
		ifFound('#qx-aside-artist:empty', qx => waitFor('aside section:has(a[href^="/en/users/"]):has(h2)')
			.then(e => qx.append(e)))
		ifFound('#qx-aside-artist-works:empty', qx => waitFor('aside section:has(a[href^="/en/users/"]):has(header):has(nav)')
			.then(e => qx.append(e)))
		ifFound('#qx-aside-title:empty', qx => waitFor('main h1')
			.then(e => qx.append(e)))
		ifFound('#qx-aside-tags:empty', qx => waitFor('main figcaption footer:not(.qx-tagged)')
			.then(e => qx.append(e)))
	}

	route.fetchListener = async ({ url, response }) => {
			let profileImageUrl
			return
			if (url.startsWith(`/ajax/illust/${routeSummary.workId}`)) {
				Q.info('route/work-cover', 'ajax found!').andLog()
				let illustIndex
				const r = (await response.json()).body
				const userIllusts = Object.entries(r.userIllusts || {})
				const s = {
					illust: {
						id: r.id,
						width: r.width,
						height: r.height,
					},
					imgs: r.urls,
					post: {
						index: -1,
						count: userIllusts.length,
						url: r.extraData.meta.canonical,
						mainTags: [...new Set(r.extraData.meta.descriptionHeader.split(' are the most ')[0].split(', '))].join(', '),
						title: r.illustTitle,
						type: r.illustType,
						ai: r.aiType,
						restrict: r.restrict,
						xRestrict: r.xRestrict,
						sl: r.sl,
						date: (r.updateDate || r.createDate).split('+')[0].replace('T', ' '),
						pageCount: r.pageCount,
						bookmarkCount: r.bookmarkCount,
						likeCount: r.likeCount,
						viewCount: r.viewCount,
					},
					bookmarkData: r.bookmarkData,
					tags: Object.fromEntries((r.tags?.tags || []).map(t => [
						t.tag, {
							romaji: t.romaji,
							english: t.translation?.en
						}
					])),
					userIllusts: userIllusts.map(([id, x], index) => {
						++index
						if (id == r.id) illustIndex = index
						if (!x) return { illust: { id }, index }
						profileImageUrl = x.profileImageUrl || profileImageUrl
						return {
							index,
							illust: {
								id,
								width: x.width,
								height: x.height,
							},
							imgs: {
								thumb: x.url,
							},
							post: {
								mainTags: [...new Set(x.alt.split(' / '))].join(', '),
								title: x.illustTitle,
								type: x.illustType,
								ai: x.aiType,
								restrict: x.restrict,
								xRestrict: x.xRestrict,
								sl: x.sl,
								pageCount: x.pageCount,
							},
							bookmarkData: r.bookmarkData,
							tags: Object.fromEntries(x.tags.map(tag => ([ tag, 0 ])))
						}
					}).reverse(),
					user: {
						id: r.userId,
						name: r.userName,
						account: r.userAccount,
						profileImageUrl: profileImageUrl,
					},
				}
				Object.assign(routeSummary, {
					...JSON.parse(JSON.stringify(s))
				})
				routeSummary.meta.ajaxUrl = url
				routeSummary.post.index = illustIndex
			}
		}
}()