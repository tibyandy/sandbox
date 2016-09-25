package org.otuka.util.http;

public class HTTP {

	private HTTPRequest request = new HTTPRequest();
	private HTTPResponse response;

	private HTTP() {}

	public static HTTP create() {
		return new HTTP();
	}

	public HTTPRequest request() {
		return request;
	}

	public HTTP execute() {
		final HTTPService httpService = new HTTPService();
		response = httpService.execute(request);
		httpService.close();
		return this;
	}

	public int responseCode() {
		return response.getCode();
	}

	public HTTPResponse response() {
		return response;
	}

}
