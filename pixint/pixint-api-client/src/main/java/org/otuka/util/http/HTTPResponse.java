package org.otuka.util.http;

import java.util.HashMap;
import java.util.Map;

import org.otuka.util.VMUtil;

public class HTTPResponse {

	private int code;

	private String mediaType;

	private String charset;

	private byte[] body;

	private Map<String, String> headers = new HashMap<String, String>();

	public Map<String, String> getHeaders() {
		return headers;
	}

	public HTTPResponse setHeaders(Map<String, String> headers) {
		this.headers = headers;
		return this;
	}

	public int getCode() {
		return code;
	}

	public HTTPResponse setCode(int code) {
		this.code = code;
		return this;
	}

	public String getMediaType() {
		return mediaType;
	}

	public HTTPResponse setMediaType(String mediaType) {
		this.mediaType = mediaType;
		return this;
	}

	public String getCharset() {
		return charset;
	}

	public HTTPResponse setCharset(String charset) {
		this.charset = charset;
		return this;
	}

	public byte[] getBody() {
		return body;
	}

	public HTTPResponse setBody(byte[] body) {
		this.body = body;
		return this;
	}

	public String bodyText() {
		return VMUtil.toString(body, charset == null ? "UTF-8" : charset);
	}

	public HTTPResponse header(String name, String value) {
		headers.put(name, value);
		return this;
	}

	public String getContentType() {
		if (charset == null) {
			return mediaType;
		}
		return VMUtil.format("{0}; charset={1}", mediaType, charset);
	}

	public String header(String name) {
		return getHeaders().get(name);
	}

}
