package org.otuka.util.http;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.charset.UnsupportedCharsetException;
import java.util.Map.Entry;

import org.apache.http.Header;
import org.apache.http.HttpEntity;
import org.apache.http.ParseException;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpDelete;
import org.apache.http.client.methods.HttpEntityEnclosingRequestBase;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpHead;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.methods.HttpPut;
import org.apache.http.client.methods.HttpRequestBase;
import org.apache.http.entity.ByteArrayEntity;
import org.apache.http.entity.ContentType;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.apache.http.impl.conn.PoolingHttpClientConnectionManager;
import org.apache.http.util.EntityUtils;
import org.otuka.util.IOUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class HTTPService {

	private static final Logger LOG = LoggerFactory.getLogger(HTTPService.class);

	private CloseableHttpClient client;

	public HTTPService() {
		HttpClientBuilder builder = HttpClientBuilder.create();
		builder.disableAuthCaching();
		builder.disableAutomaticRetries();
		builder.disableConnectionState();
		builder.disableContentCompression();
		builder.disableCookieManagement();
		// builder.disableRedirectHandling();
		builder.setUserAgent("SupplierGroupApplication");

		PoolingHttpClientConnectionManager cm = new PoolingHttpClientConnectionManager();
		cm.setMaxTotal(2000);
		cm.setDefaultMaxPerRoute(1000);
		builder.setConnectionManager(cm);

		client = builder.build();
	}

	public void close() {
		IOUtil.close(client);
	}

	public HTTPResponse execute(HTTPRequest req) {
		CloseableHttpResponse hcResp = null;
		try {
			HttpRequestBase hcReq = toHCRequest(req);
			hcResp = execute(hcReq);
			HTTPResponse ret = fromHCResp(hcResp);
			return ret;
		} finally {
			IOUtil.close(hcResp);
		}
	}

	public CloseableHttpResponse execute(HttpRequestBase req) {
		try {
			long before = System.currentTimeMillis();
			CloseableHttpResponse resp = client.execute(req);
			long time = System.currentTimeMillis() - before;
			int code = resp.getStatusLine().getStatusCode();
			Long len = resp.getEntity() == null ? null : resp.getEntity().getContentLength();
			LOG.debug("HTTP: [code:{} time:{} len:{} {} {}]", new Object[] { code, time, len, req.getMethod(), req.getRequestLine().getUri() });
			return resp;
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
			fromHCRespHeaders(hcResp, ret);
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

	private void fromHCRespHeaders(CloseableHttpResponse hcResp, HTTPResponse ret) {
		Header[] headers = hcResp.getAllHeaders();
		for (Header header : headers) {
			ret.header(header.getName(), header.getValue());
		}
	}

	private HttpRequestBase toHCRequest(HTTPRequest req) {
		try {
			HttpRequestBase ret = createHCRequest(req.getMethod());
			toHCRequestHeaders(req, ret);
			ret.setURI(new URI(req.getUrl()));
			if (ret instanceof HttpEntityEnclosingRequestBase) {
				toHCRequestBody(req, (HttpEntityEnclosingRequestBase) ret);
			}
			return ret;
		} catch (URISyntaxException e) {
			throw new RuntimeException(e);
		}
	}

	private void toHCRequestHeaders(HTTPRequest req, HttpRequestBase ret) {
		for (Entry<String, String> entry : req.headers().getHeaders().entrySet()) {
			ret.addHeader(entry.getKey(), entry.getValue());
		}
	}

	private void toHCRequestBody(HTTPRequest req, HttpEntityEnclosingRequestBase ret) {
		byte[] body = req.body();
		if (body == null) {
			body = new byte[0];
		}
		ByteArrayEntity entity = new ByteArrayEntity(body);
		String contentType = req.getMediaType();
		String charset = req.getCharset();
		if (charset != null) {
			contentType = new StringBuilder().append(contentType).append("; charset=").append(charset).toString();
			entity.setContentEncoding(charset);
		}
		entity.setContentType(contentType);
		ret.setEntity(entity);
	}

	public HttpRequestBase createHCRequest(String method) {
		if ("GET".equals(method)) {
			return new HttpGet();
		} else if ("HEAD".equals(method)) {
			return new HttpHead();
		} else if ("DELETE".equals(method)) {
			return new HttpDelete();
		} else if ("PUT".equals(method)) {
			return new HttpPut();
		} else if ("POST".equals(method)) {
			return new HttpPost();
		}
		throw new RuntimeException("unknown: " + method);
	}

}
