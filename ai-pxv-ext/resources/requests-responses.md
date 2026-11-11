# Autenticação
## Session Cookie
All authenticated requests require the PHPSESSID cookie. Obtain it by logging in to pixiv.net via browser and extracting the cookie value.

## CSRF Token
Write operations (POST) require an X-CSRF-TOKEN header. The token can be extracted from the homepage HTML:
```html
<script id="__NEXT_DATA__" type="application/json">
  ...
</script>
```
Obtenha com:
```js
JSON.parse(
  JSON.parse(
    document.querySelector('#__NEXT_DATA__').innerHTML
  ).props.pageProps.serverSerializedPreloadedState
).api.token
```

## Required Request Headers
All API requests to www.pixiv.net should include:
- User-Agent - A modern browser UA string
- Referer - https://www.pixiv.net/
- Origin - https://www.pixiv.net
- Accept-Language - e.g. zh-CN,zh;q=0.9,en;q=0.8
- Cookie - PHPSESSID=<session_id>
- X-CSRF-TOKEN - (POST only) CSRF token previously

# Requests e responses
## 1. Ilustração (favoritada)
### Request
```json
fetch("https://www.pixiv.net/ajax/illust/151362929", {
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "omit"
});
```

### Response (com mais de uma ilustração favoritada, basta ver bookmarkData)
```json
{"error":false,"message":"","body":{"illustId":"151362929","illustTitle":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","illustComment":"\u652f\u63f4\u30b5\u30a4\u30c8\u3067\u4e00\u90e8\u3092\u516c\u958b\u4e2d\u3067\u3059\uff01\u003Cbr \/\u003EPatreon:\u003Ca href=\u0022\/jump.php?https%3A%2F%2Fx.gd%2F9Hsj9\u0022 target=\u0022_blank\u0022\u003Ehttps:\/\/x.gd\/9Hsj9\u003C\/a\u003E\u003Cbr \/\u003EUnifans:\u003Ca href=\u0022\/jump.php?https%3A%2F%2Fx.gd%2F1VAls\u0022 target=\u0022_blank\u0022\u003Ehttps:\/\/x.gd\/1VAls\u003C\/a\u003E","id":"151362929","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","description":"\u652f\u63f4\u30b5\u30a4\u30c8\u3067\u4e00\u90e8\u3092\u516c\u958b\u4e2d\u3067\u3059\uff01\u003Cbr \/\u003EPatreon:\u003Ca href=\u0022\/jump.php?https%3A%2F%2Fx.gd%2F9Hsj9\u0022 target=\u0022_blank\u0022\u003Ehttps:\/\/x.gd\/9Hsj9\u003C\/a\u003E\u003Cbr \/\u003EUnifans:\u003Ca href=\u0022\/jump.php?https%3A%2F%2Fx.gd%2F1VAls\u0022 target=\u0022_blank\u0022\u003Ehttps:\/\/x.gd\/1VAls\u003C\/a\u003E","illustType":2,"createDate":"2026-10-27T17:00:00+00:00","uploadDate":"2026-10-27T17:00:00+00:00","restrict":0,"xRestrict":1,"sl":6,"urls":{"mini":"https:\/\/i.pximg.net\/c\/48x48\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_square1200.jpg","thumb":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_square1200.jpg","small":"https:\/\/i.pximg.net\/c\/540x540_70\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_master1200.jpg","regular":"https:\/\/i.pximg.net\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_master1200.jpg","original":"https:\/\/i.pximg.net\/img-original\/img\/2026\/10\/28\/02\/00\/57\/151362929_ugoira0.jpg"},"tags":{"authorId":"111533228","isLocked":false,"tags":[{"tag":"R-18","locked":true,"deletable":false,"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d"},{"tag":"\u52a8\u56fe","locked":true,"deletable":false,"userId":"111533228","romaji":"chuugokudenougoira","userName":"\u304a\u304d\u305f\u3064\u304d"},{"tag":"\u8abf\u6708\u30ea\u30aa","locked":true,"deletable":false,"userId":"111533228","romaji":"tsukatsukirio","translation":{"en":"Rio Tsukatsuki"},"userName":"\u304a\u304d\u305f\u3064\u304d"},{"tag":"\u8c03\u6708\u8389\u97f3","locked":true,"deletable":false,"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d"},{"tag":"\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","locked":true,"deletable":false,"userId":"111533228","romaji":"buru-a-kaibu","translation":{"en":"Blue Archive"},"userName":"\u304a\u304d\u305f\u3064\u304d"},{"tag":"\u30d6\u30eb\u30a2\u30ab","locked":true,"deletable":false,"userId":"111533228","romaji":"buruaka","userName":"\u304a\u304d\u305f\u3064\u304d"},{"tag":"BlueArchive","locked":true,"deletable":false,"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d"}],"writable":true},"alt":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ \u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d","userAccount":"okitatsuki","userIllusts":{"151533051":{"id":"151533051","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/11\/01\/01\/51\/09\/151533051_square1200.jpg","description":"","tags":["R-18","\u52a8\u56fe","\u8abf\u6708\u30ea\u30aa","\u8c03\u6708\u8389\u97f3","\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","\u30d6\u30eb\u30a2\u30ab","BlueArchive"],"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d","pixivId":"okitatsuki","width":300,"height":168,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ \u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-11-01T01:51:09+09:00","updateDate":"2026-11-01T01:51:00+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/04\/21\/11\/39\/13\/27262486_f0fc906cca75e7f9b58a7246d1ebb59f_50.png"},"151362929":{"id":"151362929","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_square1200.jpg","description":"\u652f\u63f4\u30b5\u30a4\u30c8\u3067\u4e00\u90e8\u3092\u516c\u958b\u4e2d\u3067\u3059\uff01\u003Cbr \/\u003EPatreon:\u003Ca href=\u0022\/jump.php?https%3A%2F%2Fx.gd%2F9Hsj9\u0022 target=\u0022_blank\u0022\u003Ehttps:\/\/x.gd\/9Hsj9\u003C\/a\u003E\u003Cbr \/\u003EUnifans:\u003Ca href=\u0022\/jump.php?https%3A%2F%2Fx.gd%2F1VAls\u0022 target=\u0022_blank\u0022\u003Ehttps:\/\/x.gd\/1VAls\u003C\/a\u003E","tags":["R-18","\u52a8\u56fe","\u8abf\u6708\u30ea\u30aa","\u8c03\u6708\u8389\u97f3","\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","\u30d6\u30eb\u30a2\u30ab","BlueArchive"],"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d","pixivId":"okitatsuki","width":308,"height":172,"pageCount":1,"isBookmarkable":true,"bookmarkData":{"id":"39529322505","private":false},"alt":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ \u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-28T02:00:57+09:00","updateDate":"2026-10-28T02:00:00+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"isOriginal":true,"is_howto":false},"151199353":{"id":"151199353","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/24\/02\/33\/15\/151199353_square1200.jpg","description":"","tags":["R-18","\u52a8\u56fe","\u8abf\u6708\u30ea\u30aa","\u8c03\u6708\u8389\u97f3","\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","\u30d6\u30eb\u30a2\u30ab"],"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d","pixivId":"okitatsuki","width":336,"height":188,"pageCount":1,"isBookmarkable":true,"bookmarkData":{"id":"39529291462","private":false},"alt":"Rio Tsukatsuki, Blue Archive \/ \u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb \/ October 24th, 2026","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-24T02:33:15+09:00","updateDate":"2026-10-24T02:33:00+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/04\/21\/11\/39\/13\/27262486_f0fc906cca75e7f9b58a7246d1ebb59f_50.png"},"151058580":null,"150826952":null/* mais vários [id]: null */,"129542511":null},"likeData":false,"width":308,"height":172,"pageCount":1,"bookmarkCount":816,"likeCount":516,"commentCount":5,"responseCount":0,"viewCount":8822,"bookStyle":0,"isHowto":false,"isOriginal":true,"imageResponseOutData":[],"imageResponseData":[],"imageResponseCount":0,"pollData":null,"seriesNavData":null,"descriptionBoothId":null,"descriptionYoutubeId":null,"comicPromotion":null,"fanboxPromotion":null,"contestBanners":[],"isBookmarkable":true,"bookmarkData":{"id":"39529322505","private":false},"contestData":null,"zoneConfig":{/* informações de ADs irrelevantes */},"extraData":{"meta":{"title":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ October 28th, 2026 - pixiv","description":"\u3053\u306e\u4f5c\u54c1 \u300c\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb\u300d \u306f \u300cR-18\u300d\u300c\u52a8\u56fe\u300d \u7b49\u306e\u30bf\u30b0\u304c\u3064\u3051\u3089\u308c\u305f\u300c\u304a\u304d\u305f\u3064\u304d\u300d\u3055\u3093\u306e\u3046\u3054\u30a4\u30e9\u3067\u3059\u3002 \u300c\u652f\u63f4\u30b5\u30a4\u30c8\u3067\u4e00\u90e8\u3092\u516c\u958b\u4e2d\u3067\u3059\uff01Patreon:https:\/\/x.gd\/9Hsj9Unifans:https:\/\/x.gd\/1VAls\u300d","canonical":"https:\/\/www.pixiv.net\/en\/artworks\/151362929","alternateLanguages":{"ja":"https:\/\/www.pixiv.net\/artworks\/151362929","en":"https:\/\/www.pixiv.net\/en\/artworks\/151362929"},"descriptionHeader":"Rio Tsukatsuki, Blue Archive, BlueArchive are the most prominent tags for this work posted on October 28th, 2026.","ogp":{"description":"\u652f\u63f4\u30b5\u30a4\u30c8\u3067\u4e00\u90e8\u3092\u516c\u958b\u4e2d\u3067\u3059\uff01Patreon:https:\/\/x.gd\/9Hsj9Unifans:https:\/\/x.gd\/1VAls","image":"https:\/\/s.pximg.net\/www\/images\/pixiv_logo20250128.png","title":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ October 28th, 2026 - pixiv","type":"article"},"twitter":{"description":"\u652f\u63f4\u30b5\u30a4\u30c8\u3067\u4e00\u90e8\u3092\u516c\u958b\u4e2d\u3067\u3059\uff01\r\nPatreon:https:\/\/x.gd\/9Hsj9\r\nUnifans:https:\/\/x.gd\/1VAls","image":"https:\/\/s.pximg.net\/www\/images\/pixiv_logo20250128.png","title":"[R-18]\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","card":"summary"}}},"titleCaptionTranslation":{"workTitle":null,"workCaption":null},"translation":null,"isUnlisted":false,"request":null,"commentOff":0,"aiType":2,"reuploadDate":null,"locationMask":false,"commissionLinkHidden":false,"isLoginOnly":false,"isCitableInCollection":true}}
```

## 2. Ilustração (não favoritada)
### Request
```js
fetch("https://www.pixiv.net/ajax/illust/151438685", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "priority": "u=1, i"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151438685",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"illustId":"151438685","illustTitle":"\u7121\u984c","illustComment":"","id":"151438685","title":"\u7121\u984c","description":"","illustType":0,"createDate":"2026-10-29T21:30:00+00:00","uploadDate":"2026-10-29T21:30:00+00:00","restrict":0,"xRestrict":0,"sl":2,"urls":{"mini":"https:\/\/i.pximg.net\/c\/48x48\/img-master\/img\/2026\/10\/30\/06\/30\/07\/151438685_p0_square1200.jpg","thumb":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/30\/06\/30\/07\/151438685_p0_square1200.jpg","small":"https:\/\/i.pximg.net\/c\/540x540_70\/img-master\/img\/2026\/10\/30\/06\/30\/07\/151438685_p0_master1200.jpg","regular":"https:\/\/i.pximg.net\/img-master\/img\/2026\/10\/30\/06\/30\/07\/151438685_p0_master1200.jpg","original":"https:\/\/i.pximg.net\/img-original\/img\/2026\/10\/30\/06\/30\/07\/151438685_p0.png"},"tags":{"authorId":"42168225","isLocked":true,"tags":[{"tag":"pixivHalloweenEffect","locked":true,"deletable":false,"userId":"42168225","userName":"\u307b\u3057\u3075\u308b"},{"tag":"\u30aa\u30ea\u30b8\u30ca\u30eb","locked":true,"deletable":false,"userId":"42168225","romaji":"orijinaru","translation":{"en":"original"},"userName":"\u307b\u3057\u3075\u308b"},{"tag":"\u7f8e\u5c11\u5973","locked":true,"deletable":false,"userId":"42168225","romaji":"bishoujo","translation":{"en":"Beautiful Girl"},"userName":"\u307b\u3057\u3075\u308b"}/* máximo de 10 registros */],"writable":false},"alt":"pixivHalloweenEffect, original, Beautiful Girl \/ \u7121\u984c","userId":"42168225","userName":"\u307b\u3057\u3075\u308b","userAccount":"user_fzga3783","userIllusts":{/* no caso desse usuário, tem mais de 1000 registros, a maior parte inicializada com null, apenas 3 valores preenchidos inicialmente: o da ilustração em foco, a anterior e a posterior */"151938611":null,"151935480":null,"151926787":null,/* mais vários [id]: null */"151457543":{"id":"151457543","title":"\u7121\u984c","illustType":0,"xRestrict":0,"restrict":0,"sl":2,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/30\/20\/14\/41\/151457543_p0_square1200.jpg","description":"","tags":["pixivHalloweenEffect","\u7f8e\u5c11\u5973","\u30aa\u30ea\u30b8\u30ca\u30eb","\u53ef\u611b\u3044","\u9280\u9aea","\u30cf\u30ed\u30a6\u30a3\u30f3","\u30df\u30cb\u30b9\u30ab\u30fc\u30c8","\u9b54\u6cd5\u5c11\u5973","\u3075\u3068\u3082\u3082","\u30b4\u30b9\u30ed\u30ea"],"userId":"42168225","userName":"\u307b\u3057\u3075\u308b","pixivId":"user_fzga3783","width":1280,"height":1856,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"pixivHalloweenEffect, Beautiful Girl, original \/ \u7121\u984c","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-30T20:14:41+09:00","updateDate":"2026-10-30T20:14:00+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/05\/25\/18\/46\/57\/27406599_23b72380c7d281673a9a7dc0028f3a62_50.jpg"},"151438685":{"id":"151438685","title":"\u7121\u984c","illustType":0,"xRestrict":0,"restrict":0,"sl":2,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/30\/06\/30\/07\/151438685_p0_square1200.jpg","description":"","tags":["pixivHalloweenEffect","\u30aa\u30ea\u30b8\u30ca\u30eb","\u7f8e\u5c11\u5973","\u53ef\u611b\u3044","\u30ed\u30f3\u30b0\u30d8\u30a2\u30fc","\u8336\u9aea","\u30df\u30cb\u30b9\u30ab\u30fc\u30c8","\u3075\u3068\u3082\u3082","\u9b54\u6cd5\u5c11\u5973","\u30cf\u30ed\u30a6\u30a3\u30f3"],"userId":"42168225","userName":"\u307b\u3057\u3075\u308b","pixivId":"user_fzga3783","width":1280,"height":1856,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"pixivHalloweenEffect, original, Beautiful Girl \/ \u7121\u984c","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-30T06:30:07+09:00","updateDate":"2026-10-30T06:30:00+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"isOriginal":true,"is_howto":false},"151427477":{"id":"151427477","title":"\u7121\u984c","illustType":0,"xRestrict":0,"restrict":0,"sl":2,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/29\/22\/48\/46\/151427477_p0_square1200.jpg","description":"","tags":["pixivHalloweenEffect","\u7f8e\u5c11\u5973","\u30aa\u30ea\u30b8\u30ca\u30eb","\u53ef\u611b\u3044","\u30ed\u30f3\u30b0\u30d8\u30a2\u30fc","\u8336\u9aea","\u30aa\u30d5\u30b7\u30e7\u30eb\u30c0\u30fc","\u8c37\u9593","\u9b54\u6cd5\u5c11\u5973","HALLOWEEN"],"userId":"42168225","userName":"\u307b\u3057\u3075\u308b","pixivId":"user_fzga3783","width":1376,"height":768,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"pixivHalloweenEffect, Beautiful Girl, original \/ \u7121\u984c","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-29T22:48:46+09:00","updateDate":"2026-10-29T22:48:00+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/05\/25\/18\/46\/57\/27406599_23b72380c7d281673a9a7dc0028f3a62_50.jpg"},"151403021":null,/* mais vários [id]: null */"116474735":null},"likeData":false,"width":1280,"height":1856,"pageCount":1,"bookmarkCount":72,"likeCount":32,"commentCount":2,"responseCount":0,"viewCount":338,"bookStyle":0,"isHowto":false,"isOriginal":true,"imageResponseOutData":[],"imageResponseData":[],"imageResponseCount":0,"pollData":null,"seriesNavData":null,"descriptionBoothId":null,"descriptionYoutubeId":null,"comicPromotion":null,"fanboxPromotion":null,"contestBanners":[],"isBookmarkable":true,"bookmarkData":null,"contestData":null,"zoneConfig":{/* informações de ADs irrelevantes */},"extraData":{"meta":{"title":"pixivHalloweenEffect, original, Beautiful Girl \/ October 30th, 2026 - pixiv","description":"\u3053\u306e\u4f5c\u54c1 \u300c\u7121\u984c\u300d \u306f \u300cpixivHalloweenEffect\u300d\u300c\u30aa\u30ea\u30b8\u30ca\u30eb\u300d \u7b49\u306e\u30bf\u30b0\u304c\u3064\u3051\u3089\u308c\u305f\u300c\u307b\u3057\u3075\u308b\u300d\u3055\u3093\u306e\u30a4\u30e9\u30b9\u30c8\u3067\u3059\u3002","canonical":"https:\/\/www.pixiv.net\/en\/artworks\/151438685","alternateLanguages":{"ja":"https:\/\/www.pixiv.net\/artworks\/151438685","en":"https:\/\/www.pixiv.net\/en\/artworks\/151438685"},"descriptionHeader":"pixivHalloweenEffect, original, Beautiful Girl, kawaii are the most prominent tags for this work posted on October 30th, 2026.","ogp":{"description":"","image":"https:\/\/embed.pixiv.net\/artwork.php?illust_id=151438685\u0026mdate=1793309407","title":"pixivHalloweenEffect, original, Beautiful Girl \/ October 30th, 2026 - pixiv","type":"article"},"twitter":{"description":"\u7121\u984c by \u307b\u3057\u3075\u308b","image":"https:\/\/embed.pixiv.net\/artwork.php?illust_id=151438685\u0026mdate=1793309407","title":"\u7121\u984c","card":"summary_large_image"}}},"titleCaptionTranslation":{"workTitle":null,"workCaption":null},"translation":null,"isUnlisted":false,"request":null,"commentOff":0,"aiType":2,"reuploadDate":null,"locationMask":false,"commissionLinkHidden":false,"isLoginOnly":false,"isCitableInCollection":false}}
```

## 3. Ilustrações relacionadas (buscar de maneira lazy)
### Request
```js
fetch("https://www.pixiv.net/ajax/user/42168225/illusts?ids%5B%5D=151463684&ids%5B%5D=151463544&ids%5B%5D=151403021&ids%5B%5D=151379033&ids%5B%5D=151368165&ids%5B%5D=151351575&ids%5B%5D=151330473&ids%5B%5D=151292511&ids%5B%5D=151247578&ids%5B%5D=151204137&ids%5B%5D=151164651&ids%5B%5D=151121325&ids%5B%5D=150755661&ids%5B%5D=150513074&ids%5B%5D=150474623&ids%5B%5D=150435736&ids%5B%5D=150313119&ids%5B%5D=150237205&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=59932f9e4cdc47f5b20e57f395bd257b,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.7946305089038989,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "59932f9e4cdc47f5b20e57f395bd257b-ade6288a1ee9acb7-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151438685",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"151463684":{"id":"151463684","title":"\u7121\u984c","illustType":0,"xRestrict":0,"restrict":0,"sl":2,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/custom-thumb\/img\/2026\/10\/30\/22\/16\/22\/151463684_p0_custom1200.jpg","description":"","tags":["pixivHalloweenEffect","\u7f8e\u5c11\u5973","\u53ef\u611b\u3044","\u9280\u9aea","\u30dc\u30d6\u30ab\u30c3\u30c8","\u30dc\u30d6","\u8c37\u9593","\u30aa\u30d5\u30b7\u30e7\u30eb\u30c0\u30fc","\u30cf\u30ed\u30a6\u30a3\u30f3","\u9b54\u6cd5\u5c11\u5973"],"userId":"42168225","userName":"\u307b\u3057\u3075\u308b","pixivId":"user_fzga3783","width":1672,"height":941,"pageCount":1,"isBookmarkable":true,"bookmarkData":{"id":"39529322505","private":false},"alt":"pixivHalloweenEffect \/ \u7121\u984c \/ October 30th, 2026","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-30T22:16:22+09:00","updateDate":"2026-10-30T22:16:22+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/05\/25\/18\/46\/57\/27406599_23b72380c7d281673a9a7dc0028f3a62_50.jpg"},"151463544":{/* mesma estrutura */},"151403021":{/* mesma estrutura */},"151379033":{/* mesma estrutura */},"151368165":{/* mesma estrutura */},"151351575":{/* mesma estrutura */},"151330473":{/* mesma estrutura */},"151292511":{/* mesma estrutura */},"151247578":{/* mesma estrutura */},"151204137":{/* mesma estrutura */},"151164651":{/* mesma estrutura */},"151121325":{/* mesma estrutura */},"150755661":{/* mesma estrutura */},"150513074":{/* mesma estrutura */},"150474623":{/* mesma estrutura */},"150435736":{/* mesma estrutura */},"150313119":{/* mesma estrutura */},"150237205":{/* mesma estrutura */}}}
```

## 4. Comentários da ilustração
### Request
```js
fetch("https://www.pixiv.net/ajax/illusts/comments/roots?illust_id=151438685&offset=0&limit=3&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=59932f9e4cdc47f5b20e57f395bd257b,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.7946305089038989,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "59932f9e4cdc47f5b20e57f395bd257b-a684653aa863e030-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151438685",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"comments":[{"userId":"1221297","userName":"C-WAVE\uff08\u30ea\u30fc\u30c1\u59eb\uff09","pixivId":"bluewing_littlewing","isDeletedUser":false,"img":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/03\/28\/11\/37\/56\/27158671_787b5ea9142c11af5d75efcf8132984d_170.jpg","id":"237125995","comment":"","stampId":"202","commentDate":"2026-10-30 18:27","commentParentId":null,"commentUserId":"1221297","editable":false,"hasReplies":false},{"userId":"21129614","userName":"\u30ab\u30c3\u30b7\u30f3\u30b0\u30fb\u30e1\u30eb\u30f4\u30a7\u30a4\u30e6","pixivId":"user_dun5770","isDeletedUser":false,"img":"https:\/\/s.pximg.net\/common\/images\/no_profile.png","id":"237108606","comment":"","stampId":"207","commentDate":"2026-10-30 10:28","commentParentId":null,"commentUserId":"21129614","editable":false,"hasReplies":false}],"hasNext":false}}
```

## 5. Dados do usuário (full=0)
### Request
```js
fetch("https://www.pixiv.net/ajax/user/42168225?full=0&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=59932f9e4cdc47f5b20e57f395bd257b,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.7946305089038989,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "59932f9e4cdc47f5b20e57f395bd257b-aeed846f087bb6b4-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151438685",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"userId":"42168225","name":"\u307b\u3057\u3075\u308b","pixivId":"user_fzga3783","image":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/05\/25\/18\/46\/57\/27406599_23b72380c7d281673a9a7dc0028f3a62_50.jpg","imageBig":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/05\/25\/18\/46\/57\/27406599_23b72380c7d281673a9a7dc0028f3a62_170.jpg","premium":true,"isFollowed":false,"isMypixiv":false,"isBlocking":false,"background":{"repeat":null,"color":null,"url":"https:\/\/i.pximg.net\/c\/1920x960_80_a2_g5\/background\/img\/2025\/08\/21\/23\/57\/24\/42168225_22fedd24558abdf8b693ad89252917a6.jpg","isPrivate":false},"sketchLiveId":null,"partial":0,"sketchLives":[],"commission":null}}
```

## 6. Ilustrações recomendadas
### Request
```js
fetch("https://www.pixiv.net/ajax/illust/151438685/recommend/init?limit=18&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=59932f9e4cdc47f5b20e57f395bd257b,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.7946305089038989,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "59932f9e4cdc47f5b20e57f395bd257b-a6b5798a89685a17-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151438685",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"illusts":[{"id":"150826952","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fbWIP","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/360x360_70\/img-master\/img\/2026\/10\/14\/02\/25\/11\/150826952_square1200.jpg","description":"","tags":["R-18","\u52a8\u56fe","\u8abf\u6708\u30ea\u30aa","\u8c03\u6708\u8389\u97f3","\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","\u30d6\u30eb\u30a2\u30ab","BlueArchive"],"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d","pixivId":"okitatsuki","width":366,"height":204,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ \u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fbWIP","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-14T02:25:11+09:00","updateDate":"2026-10-14T02:25:11+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/04\/21\/11\/39\/13\/27262486_f0fc906cca75e7f9b58a7246d1ebb59f_50.png","type":"illust"},{"id":"151631935"/*mesma estrutura*/},{"id":"151669884"/*mesma estrutura*/},{"id":"151365220"/*mesma estrutura*/},{"id":"151803799"/*mesma estrutura*/},{"id":"151465444"/*mesma estrutura*/},{"id":"134508772","title":"\u3010\u30b5\u30f3\u30d7\u30eb\u3011\u59c9\u5f1f\u2463\u5f8c\u7de8","illustType":1,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/360x360_70\/custom-thumb\/img\/2025\/08\/30\/20\/00\/18\/134508772_p0_custom1200.jpg","description":"","tags":["R-18","\u59c9\u5f1f","\u8fd1\u89aa\u76f8\u59e6","\u65ad\u9762\u56f3","\u30b4\u30e0","\u30d0\u30c3\u30af","\u30aa\u30ea\u30b8\u30ca\u30eb","\u5de8\u4e73"],"userId":"24328727","userName":"\u67f5\u91ce14","pixivId":"n_fence14","width":2150,"height":3035,"pageCount":5,"isBookmarkable":true,"bookmarkData":null,"alt":"older sister and younger brother, incest adultery, cross-section view \/ \u3010\u30b5\u30f3\u30d7\u30eb\u3011\u59c9\u5f1f\u2463\u5f8c\u7de8","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2025-08-30T20:00:18+09:00","updateDate":"2025-08-30T20:00:18+09:00","isUnlisted":false,"isMasked":false,"aiType":1,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2021\/05\/21\/22\/07\/54\/20740433_5739d19388e002314b231895f9b60639_50.png","type":"illust"},{"id":"151290864"/*mesma estrutura*/},{"id":"151666517"/*mesma estrutura*/},{"id":"151140218"/*mesma estrutura*/},{"id":"150841438"/*mesma estrutura*/},{"id":"151596135"/*mesma estrutura*/},{"id":"151456298"/*mesma estrutura*/},{"id":"150206078"/*mesma estrutura*/},{"id":"150788692"/*mesma estrutura*/},{"id":"151082138"/*mesma estrutura*/},{"id":"145199459"/*mesma estrutura*/},{"id":"151028510"/*mesma estrutura*/}],"nextIds":["151219475","151326719","151130073","150926221","151116838","150712301","151042885","151616464","151568537","150605489","148437573","141559153","151812563","150262421","151548362","150439546","151646408","149849121","151374305","150856831","151229080","151474705","151158629","150190021","150824525","151380412","150859063","150930825","149966792","151567980","150591052","151571892","150790175","151383395","151478170","151154370","151747306","148733920","151103206","144850079","151563222","151761112","151684814","151094137","147465504","149696648","150857681","151440535","151899367","151309683","150582582","150951573","151237935","151838110","151804813","151863567","149339865","151794730","151925886","151684525","149657400","150511613","151927521","151239960","151918449","149582072","148104296","151917179","148129262","151116912","151728963","147480870","151890091","151928131","151215703","151823596","150046923","147928096","151928066","138497895","140106049","144741958","146133631","148381480","137941397","137661514","150093436","142483165","151921362","139368105","148173916","148169768","150826543","139436547","147962694","138440177","147808973","151398186","149481917","151909772","138914975","142909556","138876749","140017819","150582112","151601982","145841791","141029616","149183839","151778922","138916878","148742206","138839767","132507236","140509862","140474229","145260960","145986808","147800290","151477156","151746209","147822077","147562230","111999442","150475760","124709545","145279917","144416580","139063090","151899049","137347310","137532564","133965072","151547538","151677448","142311930","150822114","149341850","151725724","139086664","151369673","149949657","146225932","141877612","151027357","142542747","129984726","138719494","151637724","145982625","151851910","146541118","151382846","138237204","106037203","147132690","151848735","146594853","151162131","137373572","142559363","150146085"],"details":{"150826952":{"methods":["illust_by_illust_table_bq_recommendation_c","illust_by_illust_table_mf_tda","recommendation_by_illust_tag"],"score":0,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"151631935":{"methods":["illust_by_illust_table_mf_tda"],"score":0.5,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"151669884":{/*mesma estrutura*/},"151365220":{/*mesma estrutura*/},"151803799":{/*mesma estrutura*/},"151465444":{/*mesma estrutura*/},"134508772":{"methods":["illust_by_illust_table_manga_recommendation_original"],"score":0.0043517779558897018,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"151290864":{/*mesma estrutura*/},"151666517":{/*mesma estrutura*/},"151140218":{/*mesma estrutura*/},"150841438":{/*mesma estrutura*/},"151596135":{/*mesma estrutura*/},"151456298":{/*mesma estrutura*/},"150206078":{/*mesma estrutura*/},"150788692":{/*mesma estrutura*/},"151082138":{/*mesma estrutura*/},"145199459":{"methods":["illust_by_illust_table_bq_recommendation_c","illust_by_illust_table_mf_tda"],"score":0,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"151028510":{/*mesma estrutura*/},"151219475":{/*mesma estrutura*/},"151326719":{/*mesma estrutura*/},"151130073":{/*mesma estrutura*/},"150926221":{/*mesma estrutura*/},"151116838":{/*mesma estrutura*/},"150712301":{/*mesma estrutura*/},"151042885":{/*mesma estrutura*/},"151616464":{/*mesma estrutura*/},"151568537":{/*mesma estrutura*/},"150605489":{/*mesma estrutura*/},"148437573":{/*mesma estrutura*/},"141559153":{/*mesma estrutura*/},"151812563":{/*mesma estrutura*/},"150262421":{/*mesma estrutura*/},"151548362":{/*mesma estrutura*/},"150439546":{/*mesma estrutura*/},"151646408":{/*mesma estrutura*/},"149849121":{/*mesma estrutura*/},"151374305":{/*mesma estrutura*/},"150856831":{/*mesma estrutura*/},"151229080":{/*mesma estrutura*/},"151474705":{/*mesma estrutura*/},"151158629":{/*mesma estrutura*/},"150190021":{/*mesma estrutura*/},"150824525":{/*mesma estrutura*/},"151380412":{/*mesma estrutura*/},"150859063":{/*mesma estrutura*/},"150930825":{/*mesma estrutura*/},"149966792":{/*mesma estrutura*/},"151567980":{/*mesma estrutura*/},"150591052":{/*mesma estrutura*/},"151571892":{/*mesma estrutura*/},"150790175":{/*mesma estrutura*/},"151383395":{/*mesma estrutura*/},"151478170":{/*mesma estrutura*/},"151154370":{/*mesma estrutura*/},"151747306":{/*mesma estrutura*/},"148733920":{/*mesma estrutura*/},"151103206":{/*mesma estrutura*/},"144850079":{"methods":["recommendation_by_illust_tag"],"score":0.022834403440356255,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"151563222":{/*mesma estrutura*/},"151761112":{/*mesma estrutura*/},"151684814":{/*mesma estrutura*/},"151094137":{/*mesma estrutura*/},"147465504":{/*mesma estrutura*/},"149696648":{/*mesma estrutura*/},"150857681":{/*mesma estrutura*/},"151440535":{/*mesma estrutura*/},"151899367":{/*mesma estrutura*/},"151309683":{/*mesma estrutura*/},"150582582":{/*mesma estrutura*/},"150951573":{/*mesma estrutura*/},"151237935":{/*mesma estrutura*/},"151838110":{/*mesma estrutura*/},"151804813":{/*mesma estrutura*/},"151863567":{/*mesma estrutura*/},"149339865":{/*mesma estrutura*/},"151794730":{/*mesma estrutura*/},"151925886":{/*mesma estrutura*/},"151684525":{/*mesma estrutura*/},"149657400":{/*mesma estrutura*/},"150511613":{/*mesma estrutura*/},"151927521":{/*mesma estrutura*/},"151239960":{"methods":["illust_by_illust_table_bq_recommendation_c"],"score":0.53743809461593628,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"151918449":{/*mesma estrutura*/},"149582072":{/*mesma estrutura*/},"148104296":{/*mesma estrutura*/},"151917179":{/*mesma estrutura*/},"148129262":{/*mesma estrutura*/},"151116912":{/*mesma estrutura*/},"151728963":{/*mesma estrutura*/},"147480870":{/*mesma estrutura*/},"151890091":{/*mesma estrutura*/},"151928131":{/*mesma estrutura*/},"151215703":{/*mesma estrutura*/},"151823596":{/*mesma estrutura*/},"150046923":{/*mesma estrutura*/},"147928096":{/*mesma estrutura*/},"151928066":{/*mesma estrutura*/},"138497895":{/*mesma estrutura*/},"140106049":{/*mesma estrutura*/},"144741958":{/*mesma estrutura*/},"146133631":{/*mesma estrutura*/},"148381480":{/*mesma estrutura*/},"137941397":{/*mesma estrutura*/},"137661514":{/*mesma estrutura*/},"150093436":{/*mesma estrutura*/},"142483165":{/*mesma estrutura*/},"151921362":{/*mesma estrutura*/},"139368105":{/*mesma estrutura*/},"148173916":{/*mesma estrutura*/},"148169768":{/*mesma estrutura*/},"150826543":{/*mesma estrutura*/},"139436547":{/*mesma estrutura*/},"147962694":{/*mesma estrutura*/},"138440177":{/*mesma estrutura*/},"147808973":{/*mesma estrutura*/},"151398186":{/*mesma estrutura*/},"149481917":{/*mesma estrutura*/},"151909772":{/*mesma estrutura*/},"138914975":{/*mesma estrutura*/},"142909556":{/*mesma estrutura*/},"138876749":{/*mesma estrutura*/},"140017819":{/*mesma estrutura*/},"150582112":{/*mesma estrutura*/},"151601982":{/*mesma estrutura*/},"145841791":{/*mesma estrutura*/},"141029616":{/*mesma estrutura*/},"149183839":{/*mesma estrutura*/},"151778922":{/*mesma estrutura*/},"138916878":{/*mesma estrutura*/},"148742206":{/*mesma estrutura*/},"138839767":{/*mesma estrutura*/},"132507236":{/*mesma estrutura*/},"140509862":{/*mesma estrutura*/},"140474229":{/*mesma estrutura*/},"145260960":{/*mesma estrutura*/},"145986808":{/*mesma estrutura*/},"147800290":{/*mesma estrutura*/},"151477156":{/*mesma estrutura*/},"151746209":{/*mesma estrutura*/},"147822077":{/*mesma estrutura*/},"147562230":{/*mesma estrutura*/},"111999442":{/*mesma estrutura*/},"150475760":{/*mesma estrutura*/},"124709545":{/*mesma estrutura*/},"145279917":{/*mesma estrutura*/},"144416580":{/*mesma estrutura*/},"139063090":{/*mesma estrutura*/},"151899049":{/*mesma estrutura*/},"137347310":{/*mesma estrutura*/},"137532564":{/*mesma estrutura*/},"133965072":{/*mesma estrutura*/},"151547538":{/*mesma estrutura*/},"151677448":{/*mesma estrutura*/},"142311930":{/*mesma estrutura*/},"150822114":{/*mesma estrutura*/},"149341850":{/*mesma estrutura*/},"151725724":{/*mesma estrutura*/},"139086664":{/*mesma estrutura*/},"151369673":{/*mesma estrutura*/},"149949657":{/*mesma estrutura*/},"146225932":{/*mesma estrutura*/},"141877612":{/*mesma estrutura*/},"151027357":{/*mesma estrutura*/},"142542747":{"methods":["illust_by_illust_table_bq_recommendation_c","illust_by_illust_table_manga_recommendation_original"],"score":0,"seedIllustIds":["151362929"],"banditInfo":"","recommendListId":"6af47b70b9d309.82902435"},"129984726":{/*mesma estrutura*/},"138719494":{/*mesma estrutura*/},"151637724":{/*mesma estrutura*/},"145982625":{/*mesma estrutura*/},"151851910":{/*mesma estrutura*/},"146541118":{/*mesma estrutura*/},"151382846":{/*mesma estrutura*/},"138237204":{/*mesma estrutura*/},"106037203":{/*mesma estrutura*/},"147132690":{/*mesma estrutura*/},"151848735":{/*mesma estrutura*/},"146594853":{/*mesma estrutura*/},"151162131":{/*mesma estrutura*/},"137373572":{/*mesma estrutura*/},"142559363":{/*mesma estrutura*/},"150146085":{/*mesma estrutura*/}}}}
```

## 7. Ilustrações recomendadas (continuação após a primeira request, lazy load)
### Request
```js
fetch("https://www.pixiv.net/ajax/illust/recommend/illusts?illust_ids%5B%5D=151219475&illust_ids%5B%5D=151326719&illust_ids%5B%5D=151130073&illust_ids%5B%5D=150926221&illust_ids%5B%5D=151116838&illust_ids%5B%5D=150712301&illust_ids%5B%5D=151042885&illust_ids%5B%5D=151616464&illust_ids%5B%5D=151568537&illust_ids%5B%5D=150605489&illust_ids%5B%5D=148437573&illust_ids%5B%5D=141559153&illust_ids%5B%5D=151812563&illust_ids%5B%5D=150262421&illust_ids%5B%5D=151548362&illust_ids%5B%5D=150439546&illust_ids%5B%5D=151646408&illust_ids%5B%5D=149849121&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=158a4ee70db846548ac2553d0ef7bd29,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.5580012863710263,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "158a4ee70db846548ac2553d0ef7bd29-b38c9eccaa5b4c6d-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"illusts":[{"id":"151219475","title":"video410!","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/360x360_70\/img-master\/img\/2026\/10\/24\/17\/25\/08\/151219475_square1200.jpg","description":"","tags":["R-18","Ugoira","forced","ntr","\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","\u6b63\u7fa9\u5b9f\u73fe\u59d4\u54e1\u4f1a","\u6b63\u7fa9\u5b9f\u73fe\u59d4\u54e1\u4f1a\u306e\u30e2\u30d6","belly","punch","\u8179\u30d1\u30f3"],"userId":"16440527","userName":"lolinyan829","pixivId":"novel-sugoi","width":240,"height":328,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"ugoira, forced, cuckold \/ video410!","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-24T17:25:08+09:00","updateDate":"2026-10-24T17:25:08+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/07\/08\/19\/27\/45\/27586195_c0028c2ee0d931bb6711b36baa2a53e0_50.png","type":"illust"},{"id":"151326719"/*mesma estrutura*/},{"id":"151130073"/*mesma estrutura*/},{"id":"150926221"/*mesma estrutura*/},{"id":"151116838"/*mesma estrutura*/},{"id":"150712301"/*mesma estrutura*/},{"id":"151042885"/*mesma estrutura*/},{"id":"151616464"/*mesma estrutura*/},{"id":"151568537"/*mesma estrutura*/},{"id":"150605489"/*mesma estrutura*/},{"id":"148437573"/*mesma estrutura*/},{"id":"141559153"/*mesma estrutura*/},{"id":"151812563"/*mesma estrutura*/},{"id":"150262421"/*mesma estrutura*/},{"id":"151548362"/*mesma estrutura*/},{"id":"150439546"/*mesma estrutura*/},{"id":"151646408"/*mesma estrutura*/},{"id":"149849121"/*mesma estrutura*/}]}}
```

## 8. Ilustrações recomendadas (continuação após a segunda request, lazy load também)
### URL Request segue a mesma lógica
https://www.pixiv.net/ajax/illust/recommend/illusts?illust_ids%5B%5D=151374305&illust_ids%5B%5D=150856831&illust_ids%5B%5D=151229080&illust_ids%5B%5D=151474705&illust_ids%5B%5D=151158629&illust_ids%5B%5D=150190021&illust_ids%5B%5D=150824525&illust_ids%5B%5D=151380412&illust_ids%5B%5D=150859063&illust_ids%5B%5D=150930825&illust_ids%5B%5D=149966792&illust_ids%5B%5D=151567980&illust_ids%5B%5D=150591052&illust_ids%5B%5D=151571892&illust_ids%5B%5D=150790175&illust_ids%5B%5D=151383395&illust_ids%5B%5D=151478170&illust_ids%5B%5D=151154370&lang=en

### Response deve ser análoga

## 9. Dados do usuário (full=1) - É feita quando faz hover em uma ilustração pra buscar os dados do usuário que não tem carregado na memória
### Request
```js
fetch("https://www.pixiv.net/ajax/user/27627614?full=1&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=158a4ee70db846548ac2553d0ef7bd29,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.5580012863710263,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "158a4ee70db846548ac2553d0ef7bd29-8bda82acd5b44b61-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"userId":"27627614","name":"Jashin-sama","pixivId":"jashin_sama","image":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/08\/24\/19\/01\/31\/27803012_ea3334acfd99bc41b3b9594706ed2e2b_50.jpg","imageBig":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/08\/24\/19\/01\/31\/27803012_ea3334acfd99bc41b3b9594706ed2e2b_170.jpg","premium":false,"isFollowed":true,"isMypixiv":false,"isBlocking":false,"background":{"repeat":null,"color":null,"url":"https:\/\/i.pximg.net\/c\/1920x960_80_a2_g5\/background\/img\/2025\/09\/04\/13\/28\/55\/27627614_486329f5d1265178ca66f02d46f5aa06.jpg","isPrivate":false},"sketchLiveId":null,"partial":1,"sketchLives":[],"commission":null,"publisher":false,"following":56,"mypixivCount":1,"followedBack":false,"comment":"Jashin-sama-sama-sama-sama-sama-sama-sama-sama-sama~!!!","commentHtml":"Jashin-sama-sama-sama-sama-sama-sama-sama-sama-sama~!!!","webpage":"https:\/\/www.patreon.com\/Jashin_sama","social":{"twitter":{"url":"https:\/\/twitter.com\/JashinChanSama"}},"canSendMessage":true,"region":{"name":"Japan","region":"JP","prefecture":null,"privacyLevel":"0"},"age":{"name":null,"privacyLevel":null},"birthDay":{"name":null,"privacyLevel":null},"gender":{"name":"Rather not say","privacyLevel":"0"},"job":{"name":null,"privacyLevel":"0"},"workspace":null,"official":false,"group":null}}
```

## 10. Ilustrações mais recentes do usuário: feito no hover da ilustração, análogo ao 8
### Request
```js
fetch("https://www.pixiv.net/ajax/user/27627614/works/latest?lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=158a4ee70db846548ac2553d0ef7bd29,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.5580012863710263,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "158a4ee70db846548ac2553d0ef7bd29-91bdd4e9739b20d3-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"illusts":{"151818296":{"id":"151818296","title":"\u65b0\u4f5c\u4e88\u544a\uff1a\u30d0\u30cb\u30fc\u30ac\u30fc\u30eb\u30fb\u30eb\u30fc\u30b8\u30e5\u306eVIP\u30c0\u30f3\u30b9","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/11\/08\/12\/09\/27\/151818296_square1200.jpg","description":"","tags":["R-18","NIKKE","\u52dd\u5229\u306e\u5973\u795e:NIKKE","\u30dd\u30fc\u30eb\u30c0\u30f3\u30b9","\u30eb\u30fc\u30b8\u30e5(\u52dd\u5229\u306e\u5973\u795e:NIKKE)","\u30d0\u30cb\u30fc","\u9006\u30d0\u30cb\u30fc","\u30cf\u30fc\u30c8\u30cb\u30d7\u30ec\u30b9","\u3046\u3054\u30a4\u30e9","\u5de8\u4e73"],"userId":"27627614","userName":"Jashin-sama","pixivId":"jashin_sama","width":540,"height":412,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"NIKKE \/ \u65b0\u4f5c\u4e88\u544a\uff1a\u30d0\u30cb\u30fc\u30ac\u30fc\u30eb\u30fb\u30eb\u30fc\u30b8\u30e5\u306eVIP\u30c0\u30f3\u30b9 \/ November 8th, 2026","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-11-08T12:09:27+09:00","updateDate":"2026-11-08T12:09:27+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/08\/24\/19\/01\/31\/27803012_ea3334acfd99bc41b3b9594706ed2e2b_50.jpg"},"151703756":{"id":"151703756","title":"\u81ea\u64ae\u308a","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/11\/05\/12\/16\/45\/151703756_square1200.jpg","description":"","tags":["R-18","\u30d6\u30ec\u30de\u30fc\u30c8\u30f3(\u30a2\u30ba\u30fc\u30eb\u30ec\u30fc\u30f3)","\u30a2\u30ba\u30fc\u30eb\u30ec\u30fc\u30f3","\u30a2\u30ba\u30ec\u30f3","AzurLane","\u30d6\u30ec\u30de\u30fc\u30c8\u30f3","\u5f8c\u80cc\u4f4d","\u5de8\u4e73","\u30d0\u30c3\u30af","\u7acb\u3061\u30d0\u30c3\u30af"],"userId":"27627614","userName":"Jashin-sama","pixivId":"jashin_sama","width":540,"height":486,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"AzurLane \/ \u81ea\u64ae\u308a \/ November 5th, 2026","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-11-05T12:16:45+09:00","updateDate":"2026-11-05T12:16:45+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/08\/24\/19\/01\/31\/27803012_ea3334acfd99bc41b3b9594706ed2e2b_50.jpg"},"151665975":{"id":"151665975","title":"\u30de\u30ea\u30f3\u8239\u9577\u306e\u6fc0\u3057\u3044\u53e3\u5949\u4ed5","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/11\/04\/10\/11\/57\/151665975_square1200.jpg","description":"","tags":["R-18","\u5b9d\u9418\u30de\u30ea\u30f3","hololive","\u30db\u30ed\u30e9\u30a4\u30d6","VTuber","\u30de\u30ea\u30f3\u306e\u304a\u5b9d","\u30a4\u30e9\u30de\u30c1\u30aa","\u30d5\u30a7\u30e9\u30c1\u30aa","\u3046\u3054\u30a4\u30e9","\u30d5\u30a7\u30e9"],"userId":"27627614","userName":"Jashin-sama","pixivId":"jashin_sama","width":600,"height":540,"pageCount":1,"isBookmarkable":true,"bookmarkData":null,"alt":"hololive, VTuber \/ \u30de\u30ea\u30f3\u8239\u9577\u306e\u6fc0\u3057\u3044\u53e3\u5949\u4ed5 \/ November 4th, 2026","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-11-04T10:11:57+09:00","updateDate":"2026-11-04T10:11:57+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/08\/24\/19\/01\/31\/27803012_ea3334acfd99bc41b3b9594706ed2e2b_50.jpg"},"151365220":null,"151355355":null,"151297631":null,"151229080":null,"150997362":null,"150961851":null,"150718169":null,"150712162":null,"150605489":null,"150522427":null/* mais vários [id]: null */},"novels":[]}}
```

## 11. Info de bookmark da ilustração (apenas mobile) com tags do bookmark separadas por espaço + comentário do bookmark
### Request
```js
fetch("https://www.pixiv.net/touch/ajax_api/ajax_api.php?mode=get_bookmark_details&work_type=illust&work_id=151362929&lang=en", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "priority": "u=1, i",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"work":{"tag":[{"tag":"R-18","is_myself":true},{"tag":"\u52a8\u56fe","is_myself":true},{"tag":"\u8abf\u6708\u30ea\u30aa","is_myself":true},{"tag":"\u8c03\u6708\u8389\u97f3","is_myself":true},{"tag":"\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","is_myself":true},{"tag":"\u30d6\u30eb\u30a2\u30ab","is_myself":true},{"tag":"BlueArchive","is_myself":true}],"type":"illust","id":"151362929","url":"https:\/\/i.pximg.net\/c\/360x360_70\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_square1200.jpg","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","user":{"name":"\u304a\u304d\u305f\u3064\u304d","id":"111533228"},"isAccessBlock":false},"isBookmarked":true,"bookmark":{"restrict":"0","comment":"coment\u00e1rio do bookmark, m\u00e1ximo 140 caracteres","tag":"BlueArchive paizuri"}}
```

## 12. Adicionar bookmark
### Request
```js
fetch("https://www.pixiv.net/ajax/illusts/bookmarks/add", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=cdf4934c2e0b4ef0a4298213c570918e,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.845013655199118,sentry-sample_rate=0",
    "content-type": "application/json; charset=utf-8",
    "priority": "u=1, i",
    "sentry-trace": "cdf4934c2e0b4ef0a4298213c570918e-9e927d58a1d1a4d8-0",
    "x-csrf-token": "2055df08331e08f7adec449637b262a3"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": "{\"illust_id\":\"151362929\",\"restrict\":0,\"comment\":\"\",\"tags\":[]}",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```
### Response
```json
{"error":false,"message":"","body":{"last_bookmark_id":"39709686337","stacc_status_id":"22621829327"}}
```

## 13. Remover bookmark
### Request
```js
fetch("https://www.pixiv.net/ajax/illusts/bookmarks/delete", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=4332eb6f17ee4d75bbf6f2ae37bab6dc,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.136564779010799,sentry-sample_rate=0",
    "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
    "priority": "u=1, i",
    "sentry-trace": "4332eb6f17ee4d75bbf6f2ae37bab6dc-a8744adaebd40a72-0",
    "x-csrf-token": "2055df08331e08f7adec449637b262a3"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": "bookmark_id=39709686337",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":[]}
```

## 14. Editar bookmark (apenas mobile) com tags do bookmark separadas por espaço + comentário do bookmark
### Request
```js
fetch("https://www.pixiv.net/touch/ajax_api/ajax_api.php", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "content-type": "multipart/form-data; boundary=----WebKitFormBoundaryAUEnorNQCfdh9EpD",
    "priority": "u=1, i",
    "x-csrf-token": "2055df08331e08f7adec449637b262a3"
  },
  "referrer": "https://www.pixiv.net/en/artworks/151362929",
  "body": "------WebKitFormBoundaryAUEnorNQCfdh9EpD\r\nContent-Disposition: form-data; name=\"mode\"\r\n\r\nadd_bookmark_illust\r\n------WebKitFormBoundaryAUEnorNQCfdh9EpD\r\nContent-Disposition: form-data; name=\"restrict\"\r\n\r\n0\r\n------WebKitFormBoundaryAUEnorNQCfdh9EpD\r\nContent-Disposition: form-data; name=\"tag\"\r\n\r\nBlueArchive paizuri\r\n------WebKitFormBoundaryAUEnorNQCfdh9EpD\r\nContent-Disposition: form-data; name=\"id\"\r\n\r\n151362929\r\n------WebKitFormBoundaryAUEnorNQCfdh9EpD\r\nContent-Disposition: form-data; name=\"comment\"\r\n\r\ncomentário do bookmark limitado a 140 caracteres\r\n------WebKitFormBoundaryAUEnorNQCfdh9EpD--\r\n",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"isSucceed":true,"lastBookmarkId":null,"restrict":0}
```

## 15. Meus bookmarks (paginado)
### Request
```js
fetch("https://www.pixiv.net/ajax/user/5986322/illusts/bookmarks?tag=&offset=0&limit=48&rest=show&order=desc&mode=all&lang=en", {
  "headers": {
    "accept": "application/json",
    "accept-language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
    "baggage": "sentry-environment=production,sentry-release=dbd0b2d45c4ce261b867a0cae85c3fa57e16bab3,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=01d83168da1443dabaf1c3c203db346d,sentry-transaction=GET,sentry-sampled=false,sentry-sample_rand=0.07369205031582049,sentry-sample_rate=0",
    "priority": "u=1, i",
    "sentry-trace": "01d83168da1443dabaf1c3c203db346d-8f364cbe3366e3d4-0",
    "x-user-id": "5986322"
  },
  "referrer": "https://www.pixiv.net/en/users/5986322/bookmarks/artworks",
  "body": null,
  "method": "GET",
  "mode": "cors",
  "credentials": "include"
});
```

### Response
```json
{"error":false,"message":"","body":{"works":[{"id":"151362929","title":"\u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","illustType":2,"xRestrict":1,"restrict":0,"sl":6,"url":"https:\/\/i.pximg.net\/c\/250x250_80_a2\/img-master\/img\/2026\/10\/28\/02\/00\/57\/151362929_square1200.jpg","description":"","tags":["R-18","\u52a8\u56fe","\u8abf\u6708\u30ea\u30aa","\u8c03\u6708\u8389\u97f3","\u30d6\u30eb\u30fc\u30a2\u30fc\u30ab\u30a4\u30d6","\u30d6\u30eb\u30a2\u30ab","BlueArchive"],"userId":"111533228","userName":"\u304a\u304d\u305f\u3064\u304d","pixivId":"okitatsuki","width":308,"height":172,"pageCount":1,"isBookmarkable":true,"bookmarkData":{"id":"39529322505","private":false},"alt":"Rio Tsukatsuki, Blue Archive, BlueArchive \/ \u30ea\u30aa\u304b\u3089\u306e\u6027\u6a5f\u80fd\u691c\u67fb","titleCaptionTranslation":{"workTitle":null,"workCaption":null},"createDate":"2026-10-28T02:00:57+09:00","updateDate":"2026-10-28T02:00:57+09:00","isUnlisted":false,"isMasked":false,"aiType":2,"visibilityScope":0,"profileImageUrl":"https:\/\/i.pximg.net\/user-profile\/img\/2025\/04\/21\/11\/39\/13\/27262486_f0fc906cca75e7f9b58a7246d1ebb59f_50.png"}/* mais 47 entradas com a mesma estrutura */ ],"total":12730,"zoneConfig":{/* informações de ADs irrelevantes */},"extraData":{"meta":{"title":"XS\u0027s Bookmarks - pixiv","description":"pixiv","canonical":"https:\/\/www.pixiv.net\/en\/users\/5986322","ogp":{"description":"","image":"https:\/\/i.pximg.net\/c\/200x200\/user-profile\/img\/2016\/01\/11\/09\/47\/02\/10368221_d6e6d0319487fffcb8d149694158532a_170.png","title":"XS\u0027s Bookmarks","type":"article"},"twitter":{"description":"","image":"https:\/\/i.pximg.net\/c\/200x200\/user-profile\/img\/2016\/01\/11\/09\/47\/02\/10368221_d6e6d0319487fffcb8d149694158532a_170.png","title":"XS\u0027s Bookmarks","card":"summary"},"alternateLanguages":{"ja":"https:\/\/www.pixiv.net\/users\/5986322","en":"https:\/\/www.pixiv.net\/en\/users\/5986322"},"descriptionHeader":""}},"bookmarkTags":{"39529322505":[/* Presente as entradas apenas no caso de bookmarks com tags */"BlueArchive","paizuri"]}}}
```

## 16. Seguir / des-seguir usuário
### Seguir
- POST /bookmark_add.php
- Headers: X-CSRF-TOKEN, Content-Type: application/x-www-form-urlencoded
- Body: `mode=add&type=user&user_id=12345&tag=&restrict=0&format=json`
  - restrict: 0 = public, 1 = private.

### Des-seguir
- POST /rpc_group_setting.php
- Headers: X-CSRF-TOKEN, Content-Type: application/x-www-form-urlencoded
- Body: `mode=del&type=bookuser&id=12345`

# Apêndice: sumário de endpoints
# | Method | Endpoint | Auth | Description
-|-|-|-|-
3.1 | GET | /ajax/illust/{id}?full=1 | Optional (R18 req.) | Artwork detail
3.2 | GET | /ajax/illust/{id}/pages | Optional (R18 req.) | Multi-page artwork
3.3 | GET | /ajax/illust/{id}/ugoira_meta | Optional (R18 req.) | Ugoira animation metadata
4.1 | GET | /ajax/discovery/artworks | Required | Artwork discovery (new)
4.1.1 | GET | /ajax/illust/discovery | No | Artwork discovery (legacy)
4.2 | GET | /ajax/discovery/novels | Required | Novel discovery (new)
4.2.1 | GET | /ajax/novel/discovery | No | Novel discovery (legacy)
4.3 | GET | /ajax/illust/{id}/recommend/init | Optional | Artwork recommendations
4.4 | GET | /ajax/illust/recommend/illusts | Optional | More artwork recommendations
4.5 | GET | /ajax/novel/{id}/recommend/init | Optional | Novel recommendations
4.6 | GET | /ajax/novel/recommend/novels | Optional | More novel recommendations
4.7 | GET | /ajax/discovery/users | Required | Recommended users
5.1 | GET | /ajax/search/artworks/{keyword} | Optional | Search artworks (combined)
5.2 | GET | /ajax/search/illustrations/{keyword} | Optional | Search illustrations
5.3 | GET | /ajax/search/manga/{keyword} | Optional | Search manga
5.4 | GET | /ajax/search/novels/{keyword} | Optional | Search novels
6.1 | GET | /ranking.php | Partial (R18 req.) | Artwork ranking
6.2 | GET | /ajax/ranking/novel | Partial (R18 req.) | Novel ranking
7.1 | GET | /ajax/user/{userId}?full=1 | Optional | User profile
7.2 | GET | /ajax/user/{userId}/profile/top | Optional | User featured works
7.3 | GET | /ajax/user/{userId}/profile/all | Optional | All user work IDs
7.4 | GET | /ajax/user/{userId}/profile/illusts | Optional | User works by IDs
8.1 | GET | /ajax/user/{userId}/following | Required | User following list
8.2 | GET | /ajax/follow_latest/illust | Required | Feed from followed users
9.1 | GET | /ajax/user/{userId}/illusts/bookmarks | Optional | User bookmarks
9.2 | POST | /ajax/illusts/bookmarks/add | Required | Add bookmark
9.3 | POST | /ajax/illusts/bookmarks/delete | Required | Remove bookmark
9.4 | POST | /ajax/illusts/like | Required | Like artwork (irreversible)
10.1 | GET | /ajax/illusts/comments/roots | Optional | Artwork comments
10.2 | POST | /ajax/illusts/comments/post | Required | Post comment
11.1 | POST | /bookmark_add.php | Required | Follow user
11.2 | POST | /rpc_group_setting.php | Required | Unfollow user
12.1 | GET | /ajax/novel/{id} | Optional | Novel detail & content
12.2 | GET | /ajax/user/{userId}/novels | Optional | User novels by IDs
12.3 | GET | /ajax/novels/comments/roots | Optional | Novel comments
12.4 | GET | /ajax/novel/series/{id} | Optional | Novel series info
12.5 | GET | /ajax/novel/series_content/{id} | Optional | Novel series content list
12.6 | GET | /ajax/novel/series/{id}/content_titles | Optional | Novel series titles
12.7 | GET | /ajax/user/{userId}/novels/tags | Optional | User novel tags