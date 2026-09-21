const navKeys = 'hover, then press:|([s]eries|[c]haracter|[f]etish|[g]eneral|[q]:other|[r]eset|[any]:clear)$[(ctrl/alt)+s]ave$'
const commitKeys = '[y]es, commit|[ctrl+r]: no, reload$hover, then press:|([s]eries|[c]haracter|[f]etish|[g]eneral|[q]:other|[r]eset|[any]:clear)$'

function SheetDatabase () {
	return {
		_: { request: _request },
		load: (params = {}) => _request('DB_LOAD', params),
		get: (tab, key) => _request('DB_GET', { tab, key }),
		put: (tab, key, valueObj) => _request('DB_PUT', { tab, key, valueObj }),
		putMany: (tab, items) => _request('DB_PUT_MANY', { tab, items }),
		getSheets: () => _request('DB_GET_SHEETS', null),
		getSheetData: (tab) => _request('DB_GET_SHEET_DATA', { tab }),
	}

	async function _request(action, payload) {
		try {
			const response = await chrome.runtime.sendMessage({ action, payload });
			if (response) {
				console.log("Dados recebidos do background:", response);
				if (response.success) {
					return response.data
				}
			}
			return response
		} catch (error) {
			console.error("Erro ao se comunicar com o background.js:", error);
		}
	}
}

function detectCharacterTypes(str) {
  const hiragana = /\p{Script=Hiragana}/u.test(str);
  const katakana = /\p{Script=Katakana}/u.test(str);
  const han = /\p{Script=Han}/u.test(str);
  const korean = /\p{Script=Hangul}/u.test(str);
  const russian = /\p{Script=Cyrillic}/u.test(str);

  // Remove todos os caracteres das listas especificadas para verificar se sobra algum outro
  const remainingStr = str.replace(
    /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}\p{Script=Hangul}\p{Script=Cyrillic}]/gu,
    ""
  );

  const other = remainingStr.length > 0;

  return [
		han ? ((hiragana || katakana) ? '2 japanese' : '3 chinese')
			: katakana ? (hiragana ? '2 japanese' : '1 katakana')
				: hiragana ? '2 japanese' : [],
		korean ? '4 korean' : [],
		russian ? '5 russian' : [],
		other && !(hiragana || katakana || han || korean || russian) ? '0 english' : []
	].flat().join(' ')
}

function buildCard(k, v, i) {
	return buildCardChars(k, v, i)[0]
}

function buildCardChars(k, v, i) {
		const chars = detectCharacterTypes(k)
		const enTag = v?.myEn ?? v?.en ?? v?.ro ?? v?.jp
		const card = (chars[0] === '0') ? {
			enTag: k,
			i,
			chars: `/${chars.slice(2)}/`,
			group: `(${v?.group || 'no_group'})`,
			categ: `[${v?.categ || 'no_categ'}]`,
			data: '',
		} : {
			tag: k,
			i,
			chars: `/${chars.slice(2)}/`,
			group: `(${v?.group || 'no_group'})`,
			categ: `[${v?.categ || 'no_categ'}]`,
			[enTag ? 'enTag' : 'data']: enTag || (Object.entries(v || {}).length ? JSON.stringify(v) : ''),
		}
		return [card, chars]
}

document.body.innerHTML = '<div class="cardgroup"><span id="loading">Error starting settings</span></div>'
const db = SheetDatabase()

function initialize() {
	const loading = document.getElementById('loading')
	loading.innerHTML = 'Initializing Settings: Connecting to Database...'
	db.load().then(async () => {
		loading.innerHTML += '<br>Getting Data...'
		const tags = Object.entries(await db.get('tags'))
		const count = tags.length
		loading.innerHTML += `<br>Found ${tags.length} entries. Rendering...`

		const cardByGroup = {}
		tags.reverse().forEach(([k, v], i) => {
				if (k.endsWith('00users入り')) return
				const [card, chars] = buildCardChars(k, v, count - i)
				const group = v.group?.split(' ')?.[0] || chars
				;(cardByGroup[group] ||= []).push(card)
		})
		console.log(cardByGroup)
		const divs = Object.entries(cardByGroup).sort(([{0:k1}], [{0:k2}]) => k1 - k2).map(([group, cards]) => {
			console.log(group, cards)
			const cardsHtml = cards.map(
				card => '\n<div>' + Object.entries(card).map(([c, s]) => `<span class="${c}">${s}</span>`).join('') + '</div>').join('')
			return `<details><summary><h1>${group}</h1></summary><div class="cardgroup">${cardsHtml}</div></details>`
		}).join('\n')
		const floater = '<ul id="floater"></ul>'
		document.body.innerHTML = renderKeys(navKeys) + divs + floater
	})
}

initialize()

// Variáveis para guardar a posição atual do mouse
let mouseX = 0;
let mouseY = 0;

// Atualiza a posição do mouse continuamente
document.addEventListener('mousemove', (event) => {
  mouseX = event.clientX;
  mouseY = event.clientY;
});

// Captura a tecla pressionada e identifica o elemento
let altCtrlPressed = false
document.addEventListener('blur', (event) => altCtrlPressed = false)
document.addEventListener('focus', (event) => altCtrlPressed = false)

document.addEventListener('keyup', (event) => {
	if (event.key === 'Alt' || event.key === 'Control') {
		altCtrlPressed = false
	  console.log('AltCtrl Up!');
		return
	}
})

const userCardChanges = {}

let isSaving = false
document.addEventListener('keydown', (event) => {
	if (event.key === 'Alt' || event.key === 'Control') {
		altCtrlPressed = true
	  console.log('AltCtrl Down!');
		return
	}
	if (altCtrlPressed && event.code === 'KeyS') {
		save()
		event.preventDefault()
		return false
	}
	if (isSaving && event.code === 'KeyY') {
		commitSave()
	}

	const card = document.elementFromPoint(mouseX, mouseY).closest('div:not(.cardgroup)');
	if (card) {
		if (event.code === 'KeyS') card.className = 'series'
		else if (event.code === 'KeyC') card.className = 'character'
		else if (event.code === 'KeyF') card.className = 'fetish'
		else if (event.code === 'KeyG') card.className = 'general'
		else if (event.code === 'KeyQ') card.className = 'other'
		else if (event.code === 'KeyR') card.className = 'reset'
		else card.removeAttribute('class')
	}

	const hasTag = card.querySelector('.tag')
	const enTag = card.querySelector('.enTag')?.innerHTML
	const tag = hasTag?.innerHTML || enTag
	const tagString = !hasTag ? `#${enTag}` : (enTag || `#${tag}`)
	const escTag = encodeURIComponent(tag)
	document.querySelector(`[data-tag="${escTag}"]`)?.remove()
	const floater = document.querySelector(`#floater`)
	if (card.className) {
		if (floater)
			floater.innerHTML = `<li data-tag="${escTag}">${card.className}: <span class="${card.className}">${tagString}</span></li>${floater.innerHTML}`
		userCardChanges[tag] = card.className
	} else {
		userCardChanges[tag] = 0
	}
  console.log(`Tecla pressionada: ${event.key}`, event);
  console.log('Elemento sob o mouse:', card);

});

function renderKeys (keys) {
	return '<ul class="keys"><li>' +
		keys.replaceAll('[', '<b>')
			.replaceAll(']', '</b>')
			.replaceAll('$', '<li class="sep"><li>')
			.split('|')
			.join('<li>')
		+ '</ul>\n'
}

async function save() {
	isSaving = true
	window.scrollTo(0, 0);
	const promises = []
	for (const [tag, change] of Object.entries(userCardChanges)) {
		promises.push(db.get('tags', tag).then(dbTag => ({ dbTag, tag, change })));
	}
	const cards = (await Promise.all(promises)).map(
		({ dbTag, tag, change }, i) => ({ change, ...buildCard(tag, dbTag, i) })
	)
	const cardsHtml = cards.map(
		({ change, ...card }) =>
			`\n<div class="${change}">`
			+ Object.entries(card).map(([c, s]) => `<span class="${c}">${s}</span>`).join('')
			+ '</div>'
		).join('')
	const html = `<summary><h1>Commit changes?</h1><details open><div class="change cardgroup">${cardsHtml}</div></details></summary>`
	document.body.innerHTML = renderKeys(commitKeys) + html
}

async function commitSave() {
	isSaving = false
	const itemsToSave = []
	for (const [tag, change] of Object.entries(userCardChanges)) {
		const group = (change === 'reset' || !change) ? '' : change
		itemsToSave.push({
			key: tag,
			values: { group }
		})
	}
	document.body.innerHTML = `<div>Saving...<ul>${itemsToSave.map(i => JSON.stringify(i, null, 1)).map(i => `<li>${i}</li>`).join('\n')}</ul></div>`
	await db.putMany('tags', itemsToSave)
	document.body.innerHTML += `<div>Saved! Press CTRL+R</div>`
}