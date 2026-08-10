getCurrentPageTags = () => Object.entries(CRX.WorkResults)
	.flatMap( ([illustId, {tags}]) => tags.map(tag => [tag, illustId]) )
	.reduce( (r, [tag, illustId]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }), {});

currentPageTagsSortedByCount = Object.entries(
	Object.entries(CRX.WorkResults)
		.flatMap( ([illustId, {tags}]) => tags.map(tag => [tag, illustId]) )
		.reduce(
			(r, [tag, illustId]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }),
			{}
		)
).sort( ([,a],[,b])=>b.length-a.length )

currentPageTagsWithMultipleOccurrencesSortedByCount = Object.entries(
	Object.entries(CRX.WorkResults)
		.flatMap( ([illustId, {tags}]) => tags.map(tag => [tag, illustId]) )
		.reduce(
			(r, [tag, illustId]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }),
			{}
		)
).sort( ([,a],[,b])=>b.length-a.length )
.filter( ([,b]) => b.length > 1 )

currentPageTagsNotYetTranslated = async () => {
	// CRX.db.load()

	currentPageTagsWithMultipleOccurrencesSortedByCount = Object.entries(
		Object.entries(CRX.WorkResults)
			.flatMap( ([illustId, {tags}]) => tags.map(tag => [tag, illustId]) )
			.reduce(
				(r, [tag, illustId]) => Object.assign(r, { [tag]: (r[tag] || []).concat(illustId) }),
				{}
			)
	).sort( ([,a],[,b])=>b.length-a.length )
	.filter( ([,b]) => b.length > 1 )

	pageTagsWithEnTranslations = currentPageTagsWithMultipleOccurrencesSortedByCount.map(
		([ tag, ids ]) => [tag, CRX.db.get('tags', tag)?.en || CRX.db.get('tags', tag)?.ro, ids])

	pageTagsWithoutTranslations = pageTagsWithEnTranslations.filter(([,b]) => !b)

	illustsWithMostTagsUntranslated = Object.entries(pageTagsWithoutTranslations.flatMap(([,,ids]) => ids).reduce(
				(r, illustId) => Object.assign(r, { [illustId]: (r[illustId] || 0) + 1 }),
				{}
			)).sort(([,a],[,b])=>b-a).slice(0, 6).map(([a])=>a)

	url = 'https://www.pixiv.net/ajax/tags/frequent/illust?lang=en' +
		illustsWithMostTagsUntranslated.map(i => `&ids%5B%5D=${i}`).join('')

	result = await fetch(url, {
		"headers": {
			"accept": "application/json",
			"accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
			"baggage": "sentry-environment=production,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=28cf208e8e054cc9bb99f2b6cae0572c,sentry-sampled=false,sentry-sample_rand=0.6458771114406853,sentry-sample_rate=0.0001",
			"priority": "u=1, i",
			"sec-ch-ua": "\"Not=A?Brand\";v=\"99\", \"Brave\";v=\"151\", \"Chromium\";v=\"151\"",
			"sec-ch-ua-mobile": "?0",
			"sec-ch-ua-platform": "\"Windows\"",
			"sec-fetch-dest": "empty",
			"sec-fetch-mode": "cors",
			"sec-fetch-site": "same-origin",
			"sentry-trace": "28cf208e8e054cc9bb99f2b6cae0572c-8f4f4b5d618bb16b-0",
			"x-user-id": "5986322"
		},
		"referrer": document.URL,
		"body": null,
		"method": "GET",
		"mode": "cors",
		"credentials": "include"
	}).then(x => x.json())

  translations = (result?.body || []).map(o => [o?.tag, o?.tag_translation])

	const itemsToSave = translations.map(([jp, en]) => ({
		key: jp,
		values: { en }
	}));	

	// Salva tudo de uma vez
	await CRX.db.putMany('tags', itemsToSave);

	// Resgata o resultado atualizado do cache local
	const translated = translations.map(([jp]) => CRX.db.get('tags', jp));

	console.log('translations', translations, translated)
}
