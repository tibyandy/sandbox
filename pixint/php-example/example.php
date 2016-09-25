$api = new PixivAPI;
$api->login("username", "password");

# get origin url
$json_result = $api->works(45455208);
$array = json_decode($json_result, true);
$illust = $array['response'][0];
printf("origin url: %s", $illust['image_urls']['small']);
