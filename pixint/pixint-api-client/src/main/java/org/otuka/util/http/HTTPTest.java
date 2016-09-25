package org.otuka.util.http;


import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.UnsupportedCharsetException;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.ParseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.junit.Test;

/**
 * @author Anderson Otuka (anderson.otuka@dextra-sw.com)
 */
public class HTTPTest {

    @Test
    public void test() {
        final HTTP http = HTTP.create();
        final HTTPRequest request = http.request();
        request.method("POST");
        request.contentType("application/x-www-form-urlencoded", "UTF-8");
        request.url("https://oauth.secure.pixiv.net/auth/token");
        // request.header("User-Agent", "PixivIOSApp/5.8.3");
        // request.header("Referer", "http://www.pixiv.net/");
        // request.header("Host", "public-api.secure.pixiv.net");
        // request.header("Authorization", "Bearer WHDWCGnwWA2C8PRfQSdXJxjXp0G6ULRaRkkd6t5B6h8");
        request.body("grant_type=password&username=hx&password=hn&client_id=bYGKuGVw91e0NMfPGp44euvGt59s&client_secret=HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK");

        // {"response":{"access_token":"AEXAfDhV1OTREi8kmG1g7gMntg3vtbd0Aj0GY-6NVkM","expires_in":3600,"token_type":"bearer",
        // "scope":"unlimited","refresh_token":"61Of1YUeUTxHcgw6nx9eRobprRzddYJUKSJWVnrVh5k","user":{"profile_image_urls":
        // {"px_16x16":"http:\/\/i2.pixiv.net\/user-profile\/img\/2016\/01\/11\/09\/47\/02\/10368221_d6e6d0319487fffcb8d149694158532a_16.png",
        // "px_50x50":"http:\/\/i2.pixiv.net\/user-profile\/img\/2016\/01\/11\/09\/47\/02\/10368221_d6e6d0319487fffcb8d149694158532a_50.png",
        // "px_170x170":"http:\/\/i2.pixiv.net\/user-profile\/img\/2016\/01\/11\/09\/47\/02\/10368221_d6e6d0319487fffcb8d149694158532a_170.png"},
        // "id":"5986322","name":"","account":"","is_premium":false,"x_restrict":2,"is_mail_authorized":true}}}

//         $this->access_token = $object->response->access_token;
//        $this->api_authorization = 'Authorization: Bearer ' . $this->access_token;


        // {"has_error":true,"errors":{"system":{
        // "message":"103:pixiv ID\u3001\u307e\u305f\u306f\u30e1\u30fc\u30eb\u30a2\u30c9\u30ec\u30b9\u3001\u30d1\u30b9\u30ef\u30fc\u30c9\u304c\u6b63\u3057\u3044\u304b\u30c1\u30a7\u30c3\u30af\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
        // "code":1508}}}
        System.out.println(http.execute().response().bodyText());
    }

    @Test
    public void test2() {
        // AEXAfDhV1OTREi8kmG1g7gMntg3vtbd0Aj0GY-6NVkM
        final HTTP http = HTTP.create();
        final HTTPRequest request = http.request();
        request.method("GET");
        request.contentType("application/x-www-form-urlencoded", "UTF-8");
        request.header("Authorization", "Bearer AEXAfDhV1OTREi8kmG1g7gMntg3vtbd0Aj0GY-6NVkM");
        request.url("https://public-api.secure.pixiv.net/v1/users/123323.json"
                + "?profile_image_sizes=" + "px_170x170,px_50x50"
                + "&image_sizes=" + "px_128x128,small,medium,large,px_480mw"
                + "&include_stats=" + 1
                + "&include_profile=" + 1
                + "&include_workspace=" + 1
                + "&include_contacts=" + 1
        );

        // {"status":"success","response":[{"id":123323,"account":"yumemaru",
        // "name":"夢丸","is_following":false,"is_follower":null,"is_friend":false,"is_premium":false,
        // "profile_image_urls":{"px_170x170":"http://i1.pixiv.net/user-profile/img/2010/01/01/21/18/42/1354944_62770e18529e92827198121e45e5c570_170.gif",
        // "px_50x50":"http://i1.pixiv.net/user-profile/img/2010/01/01/21/18/42/1354944_62770e18529e92827198121e45e5c570_50.gif"},
        // "stats":{"works":0,"favorites":4,"following":23,"friends":0},"profile":{"contacts":{"twitter":null},"workspace":{
        // "computer":"","monitor":"","software":"","scanner":"","tablet":"","mouse":"","printer":"","on_table":"","music":"","table":"",
        // "chair":"","other":"","image_url":null,"image_urls":null},"job":"専門職",
        // "introduction":"ゆめまるです(*^^*)\r\n夢に○でゆめまるです。","location":"日本 埼玉県","gender":"male","tags":null,
        // "homepage":"","birth_date":null,"blood_type":null}}],"count":1}

        System.out.println(http.execute().response().bodyText());

    }

    @Test
    public void test3() {
        String url = "https://public-api.secure.pixiv.net/v1/users/123323.json"
                + "?profile_image_sizes=px_170x170,px_50x50"
                + "&image_sizes=px_128x128,small,medium,large,px_480mw"
                + "&include_stats=1&include_profile=1&include_workspace=1&include_contacts=1";
        final String token = "AEXAfDhV1OTREi8kmG1g7gMntg3vtbd0Aj0GY-6NVkM";
        final String result = request(url, token);
        System.out.println(result);


    }

    private String request(String url, String token) {
        final String result;
        HttpRequestBase hcReq;
        try {
            HttpRequestBase ret = new HttpGet();
            ret.addHeader("Authorization", "Bearer " + token);
            ret.setURI(new URI(url));
            ByteArrayEntity entity = new ByteArrayEntity(new byte[0]);
            entity.setContentType("application/x-www-form-urlencoded;charset=UTF-8");
            hcReq = ret;
        } catch (URISyntaxException e) {
            throw new RuntimeException(e);
        }
        try {
            HttpClientBuilder builder = HttpClientBuilder.create();
            builder.disableAuthCaching();
            builder.disableAutomaticRetries();
            builder.disableConnectionState();
            builder.disableContentCompression();
            builder.disableCookieManagement();
            CloseableHttpResponse hcResp = builder.build().execute(hcReq);
            HTTPResponse ret = fromHCResp(hcResp);
            hcResp.close();
            result = ret.bodyText();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return result;
    }

    private HTTPResponse fromHCResp(CloseableHttpResponse hcResp) {
        try {
            HTTPResponse ret = new HTTPResponse();
            ret.setCode(hcResp.getStatusLine().getStatusCode());
            HttpEntity entity = hcResp.getEntity();
            if (entity == null) {
                return ret;
            }
            for (Header header : hcResp.getAllHeaders()) {
                ret.header(header.getName(), header.getValue());
            }
            String charset = null;
            String mediaType = null;
            if (entity.getContentType() != null) {
                ContentType ct = ContentType.parse(entity.getContentType().getValue());
                mediaType = ct.getMimeType();
                if (ct.getCharset() != null) {
                    charset = ct.getParameter("charset");
                }
            }
            ret.setMediaType(mediaType).setCharset(charset);
            ret.setBody(EntityUtils.toByteArray(entity));
            return ret;
        } catch (UnsupportedCharsetException | ParseException | IOException e) {
            throw new RuntimeException(e);
        }
    }

}

