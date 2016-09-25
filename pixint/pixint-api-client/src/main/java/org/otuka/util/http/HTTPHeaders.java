package org.otuka.util.http;

import java.util.HashMap;
import java.util.Map;

public class HTTPHeaders {

	private Map<String, String> headers = new HashMap<String, String>();

	public Map<String, String> getHeaders() {
		return headers;
	}

	public HTTPHeaders setHeaders(Map<String, String> headers) {
		this.headers = headers;
		return this;
	}

	public void set(String name, String value) {
		headers.put(name, value);
	}

}
