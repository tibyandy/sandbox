void function routeWorkCover () {
	let profileImageUrl
	Q.on('route:work-cover', routeSummary => {
		Q._routeFetchListener = async ({ url, response }) => {
			if (url.startsWith(`/ajax/illust/${routeSummary.workId}`)) {
				Q.info('route/work-cover', 'ajax found!')
				let illustIndex
				const r = (await response.json()).body
				const userIllusts = Object.entries(r.userIllusts)
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
				Q.info('render-route', JSON.stringify(routeSummary)).andLog()
				Q.send('render-route', routeSummary)
			}
		}
	})
}()