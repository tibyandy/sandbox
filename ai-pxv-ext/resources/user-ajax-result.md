# View User Result
- URL: https://www.pixiv.net/ajax/user/92809474?full=0&lang=en

```sh
curl --url 'https://www.pixiv.net/ajax/user/92809474?full=0&lang=en' \
  -H 'accept: application/json' \
  -H 'accept-language: en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7' \
  -H 'baggage: sentry-environment=production,sentry-public_key=1bce6ddb909da69b0efb68a4785c448c,sentry-trace_id=bbf70f4417ff4e9e9ba60a0b9510ae52,sentry-sampled=false,sentry-sample_rand=0.9902083407406301,sentry-sample_rate=0.0001' \
  -b 'p_ab_d_id=1042341718; privacy_policy_notification=0; b_type=1; privacy_policy_agreement=7; c_type=43; auto_view_enabled=1; PHPSESSID=5986322_gNJBV7zkpdCzMXkusrclugBajhFUyCoh; _ga_MZ1NL4PHH0=GS2.1.s1776547199$o2$g0$t1776547205$j54$l0$h0; login_ever=yes; _gcl_au=1.1.47121536.1778959046; first_visit_datetime=2026-05-22%2011%3A54%3A13; cto_bundle=LZMwdl96TlZNZURSdE9xMllpSllPMHpFZm9UYXRlMG1HV0x2cURqbiUyRkhaZ1I4RGQ5eiUyQjViVjhvcUJoYmRjRThrT1hySkExU0xseGE2TzJ1bzVwZlBJN293dXZDektMTFhBbVpIYkY1MlFlJTJGUnR4T1NrbHJwckZUUjNQQkhrRDAlMkJScFF1OG5UJTJCY2Z4NEp2Q2FBbk5WWVd5eHZ3JTNEJTNE; cto_bundle=wHjAhF96TlZNZURSdE9xMllpSllPMHpFZm9RNVpPQ1ElMkZhRHIlMkY3M0pDcHhIQVF1RjZ0V2NUUTVnSG03aXh2dCUyRjBYdzVlS3klMkZSMWowM20yNnJvaDN5RlF5Rnh3Qm1HcTFMZ2d4MEhJUlhMS2UlMkZDcTdmclBkdVEzR3Y1RllZNW5aOGxMQlNpRjhOeWx3TVJFS3ROVDZidEdJZiUyQkElM0QlM0Q; _ga_75BBYNYN9J=deleted; FCCDCF=%5Bnull%2Cnull%2Cnull%2Cnull%2Cnull%2Cnull%2C%5B%5B32%2C%22%5B%5C%229c70617b-2209-4d1b-9a51-667b189cb42e%5C%22%2C%5B1762007640%2C497000000%5D%5D%22%5D%5D%5D; FCNEC=%5B%5B%22AKsRol-btFJc7Wbv1UFhXuF0R75_KhJ-JQbY0VZ04q1xe4qGXS2Vrl9RPE7gXk278zDG0DkQyqY5PWYnvzeVL-nGuxxVKmpD7_bc98YRR_WCQfWE6_NzSn9CJr0nUoq_p1wU-gA6IcsSRC7C_UFdeINkP3x-R8QGew%3D%3D%22%5D%5D; _ga_3WKBFJLFCP=GS2.1.s1781053542$o2$g1$t1781054607$j32$l0$h0; _ga_75BBYNYN9J=deleted; __utmz=235335808.1781455677.100.25.utmcsr=dic.pixiv.net|utmccn=(referral)|utmcmd=referral|utmcct=/; __utmv=235335808.|2=login%20ever=yes=1^3=plan=normal=1^5=gender=male=1^9=p_ab_id=1=1^10=p_ab_id_2=0=1^20=webp_available=yes=1; first_visit_datetime_pc=2026-08-09%2008%3A32%3A12; a_type=1; p_ab_id=5; p_ab_id_2=7; __utmc=235335808; yuid_b=ECIDmAA; default_service_is_touch=no; _gid=GA1.2.473271237.1786310952; sharedid=5b5a6c12-b6f6-4637-b324-d21b58286034; sharedid_cst=znv0HA%3D%3D; __utma=235335808.1043909785.1760059042.1786310733.1786294290.124; _ga_ZQEKG3EF2C=GS2.1.s1786314447$o31$g1$t1786318163$j60$l0$h0; __utmt=1; _ga=GA1.1.1043909785.1760059042; cf_clearance=M5jZqNjfvpZ70e1RVxc8YJh67ReBRo2FM3Xc7pRiMEU-1786318769-1.2.1.1-5dSnoEeeEY6_oQHRwUBmtK_SRCJoA8tfCz04cwDl1NNEVHMPhQEX2KWZAK47ltMTB_zj3hwTkvskl0J9sJS0QfxCIHKD8aDC00_qDg7y2pitgPfARkag6wtJKda5N5O43iI18eH1yZebi1wPPlSWVkZanMDlNCPgeJLmlct2S9s1xJIuoLXScgNX7ya0uhBoIY4DgcdX5csfWwWnKi2cTkANgubHvbl1XXPEw9HoCE8NC5SzXfm64rg.3d0ytiKfTrGjdzy8PCC.00rwz80Kz72jsh5RltTRF6Z6SiHSXBbM5OaSXwOLfO68u7UJdjSuSPOTwsU8OsGD4.bI.3qYjmWJEdfxC0xRX.G6LAGpUdYiI89Lw_I6Q1jIQE1e0ZTVFEZhbofkX3hdKsQOSNZNsCJSetI_oC0Oyy4w9TfTnG_FakV3q1Oqn6CLyFZBFA5Gm1w1P1qTQ05s4RV_PDtgAs4j8u6eI9BY4MYQRDoxaYj.MOI0rslVeAEfQLDf3jvk7DJry8cqU4llJjEZCdcQI2POihzU92o2hVpKSq0XUVg; __cf_bm=5iawPr9ibmEHN97XpW2y4g9ueZ1ohiOw_YadVOjoC6g-1786318769.7314541-1.0.1.1-fpnVNT1DFt4hOMWK2K0G62Naxg8FbbWPZWx1xyKahu7dw3BQLsvJg4aYamSxEgMI_ZeKR_ck0TxPq53X8K60GrNmqT1GRyH0dLGtYYf3zcSqdve4660LGaRoqSFrw38XTkXmNdNr21zmDSYVr9zU.Q; _ga_75BBYNYN9J=GS2.1.s1786313732$o106$g1$t1786318817$j60$l0$h0; __utmb=235335808.65.10.1786294290' \
  -H 'priority: u=1, i' \
  -H 'referer: https://www.pixiv.net/en/artworks/144567866' \
  -H 'sec-ch-ua: "Not=A?Brand";v="99", "Brave";v="151", "Chromium";v="151"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: same-origin' \
  -H 'sentry-trace: bbf70f4417ff4e9e9ba60a0b9510ae52-94a42b13c9fdd3fb-0' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36' \
  -H 'x-user-id: 5986322'
```

```json
{
  "error": false,
  "message": "",
  "body": {
    "userId": "92809474",
    "name": "果宝@桃満界AIart",
    "image": "https://i.pximg.net/user-profile/img/2023/05/25/00/44/00/24461786_ee9f655c5adc788056df614b1de0c246_50.jpg",
    "imageBig": "https://i.pximg.net/user-profile/img/2023/05/25/00/44/00/24461786_ee9f655c5adc788056df614b1de0c246_170.jpg",
    "premium": true,
    "isFollowed": false,
    "isMypixiv": false,
    "isBlocking": false,
    "background": {
      "repeat": null,
      "color": null,
      "url": "https://i.pximg.net/c/1920x960_80_a2_g5/background/img/2025/11/05/11/36/02/92809474_41f4562b6b296206e50965bbfa9b3d5c.jpg",
      "isPrivate": false
    },
    "sketchLiveId": null,
    "partial": 0,
    "sketchLives": [],
    "commission": null
  }
}
```