package org.otuka.pixint.apiclient;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.UnsupportedCharsetException;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.ParseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.util.EntityUtils;
import org.otuka.util.http.HTTPResponse;

/**
 * @author Anderson Otuka (anderson.otuka@dextra-sw.com)
 */
public class Request {

    private final String result;

    public static String get(String token, String url) {
        return new Request(url, token, null).getResult();
    }

    public static String post(String user, String pass) {
        return new Request("https://oauth.secure.pixiv.net/auth/token", null, "grant_type=password&username=" + user + "&password=" + pass + "&client_id=bYGKuGVw91e0NMfPGp44euvGt59s&client_secret=HP3RmkgAmEGro0gn1x9ioawQE8WMfvLXDz3ZqxpK").getResult();
    }

    private Request(String url, String token, String body) {
        HttpRequestBase req = body == null ? new HttpGet() : new HttpPost();
        try {
            if (token != null) {
                req.addHeader("Authorization", "Bearer " + token);
            }
            req.setURI(new URI(url));
            ByteArrayEntity entity;
            if (body == null) {
                entity = new ByteArrayEntity(new byte[0]);
            } else {
                entity = new ByteArrayEntity(body.getBytes());
                ((HttpEntityEnclosingRequestBase) req).setEntity(entity);
            }
            entity.setContentType("application/x-www-form-urlencoded;charset=UTF-8");
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
            CloseableHttpResponse hcResp = builder.build().execute(req);
            HTTPResponse ret = fromHCResp(hcResp);
            hcResp.close();
            result = ret.bodyText();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
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

    public String getResult() {
        return result;
    }
}
