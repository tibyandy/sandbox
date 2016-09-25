package org.otuka.pixint.apiclient;

/**
 * @author Anderson Otuka (anderson.otuka@dextra-sw.com)
 */
public class PixivConnection {

    private static final String URL = "https://public-api.secure.pixiv.net/";
    private String apiReferer = "http://spapi.pixiv.net/";
    private String apiUseragent = "User-Agent: PixivIOSApp/5.8.3";
    private String apiHost = "Host: public-api.secure.pixiv.net";
    private String apiAuthorization = "Bearer WHDWCGnwWA2C8PRfQSdXJxjXp0G6ULRaRkkd6t5B6h8";
    private String oauthClientId = "bYGKuGVw91e0NMfPGp44euvGt59s";
    private String oauthClientSecret = "HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK";
    private String oauthUrl = "https://oauth.secure.pixiv.net/auth/token";
    private String oauthReferer = "http://www.pixiv.net/";
    private String accessToken = "";

    private final String token;

    public PixivConnection(String username, String password) {
        // final String post = Request.post(username, password);
        // System.out.println(post);
        this.token = "Q0W14KKIFRXtnwlg29zZqgrxFXhatL_GpPbsHZSXwVw";
    }

    public String users(int id) {
        return Request.get(token, URL + "v1/users/" + id + ".json"
                + "?profile_image_sizes=px_170x170,px_50x50"
                + "&image_sizes=px_128x128,small,medium,large,px_480mw"
                + "&include_stats=1"
                + "&include_profile=1"
                + "&include_workspace=1"
                + "&include_contacts=1"
        );
    }

    public String works(int id) {
        return Request.get(token, URL + "v1/works/" + id + ".json");
    }

    public String myFeeds(boolean r18, Integer maxId) {
        return Request.get(token, URL + "v1/me/feeds.json"
                + "?show_r18=" + r18
                + (maxId == null ? "" : "max_id=" + maxId)
                + "&type=touch_nottext"
                + "&relation=all"
        );
    }

    public String myFavWorks(boolean privacy, int page) {
        return Request.get(token, URL + "v1/me/favorite_works.json"
                + "?publicity=" + (privacy ? "private" : "public")
                + "&page" + page
                + "&image_sizes=px_128x128,px_480mw,large"
                + "&per_page=50"
        );
    }
}
