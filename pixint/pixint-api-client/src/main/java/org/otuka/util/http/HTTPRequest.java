package org.otuka.util.http;

import org.otuka.util.VMUtil;

public class HTTPRequest {

	private String method = "GET";

	private String url;

	private String mediaType;

	private String charset;

	private byte[] body;

	private HTTPHeaders headers = new HTTPHeaders();

	public HTTPHeaders headers() {
		return headers;
	}

	public String getUrl() {
		return url;
	}

	public String getMethod() {
		return method;
	}

	public HTTPRequest url(String url) {
		this.url = url;
		return this;
	}

	public HTTPRequest method(String method) {
		this.method = method;
		return this;
	}

	public HTTPRequest body(String json) {
		body(VMUtil.toBytes(json, charset));
		return this;
	}

	public HTTPRequest body(byte[] body) {
		this.body = body;
		return this;
	}

	public byte[] body() {
		return body;
	}

	public HTTPRequest contentType(String mediaType, String charset) {
		contentType(mediaType);
		charset(charset);
		return this;
	}

	public HTTPRequest contentType(String mediaType) {
		this.mediaType = mediaType;
		return this;
	}

	public HTTPRequest charset(String charset) {
		this.charset = charset;
		return this;
	}

	public String getMediaType() {
		return mediaType;
	}

	public String getCharset() {
		return charset;
	}

	@Override
	public String toString() {
		StringBuilder ret = new StringBuilder();
		ret.append("[Request ").append(method).append(" ").append(url);
		if (body != null) {
			ret.append(" ").append(mediaType).append(" ").append(charset).append(" ").append(body.length);
		}
		return ret.append("]").toString();
	}

	public HTTPRequest header(String name, String value) {
		headers.set(name, value);
		return this;
	}
}
