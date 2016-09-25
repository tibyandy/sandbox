package org.otuka.util;

import java.io.ByteArrayOutputStream;
import java.io.PrintStream;
import java.io.UnsupportedEncodingException;
import java.text.MessageFormat;
import java.util.HashMap;
import java.util.Map;

import javax.naming.InitialContext;
import javax.naming.NamingException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class VMUtil {

	static final Logger LOG = LoggerFactory.getLogger(VMUtil.class);

	public static <T> Map<T, T> map(T[] params) {
		if (params.length % 2 != 0) {
			throw new RuntimeException("wrong: " + params.length);
		}

		Map<T, T> ret = new HashMap<T, T>();
		for (int i = 0; i < params.length; i += 2) {
			ret.put(params[i], params[i + 1]);
		}
		return ret;
	}

	@SuppressWarnings("unchecked")
	public static <T> T lookup(String name, Class<T> clazz) {
		try {
			return (T) new InitialContext().lookup(name);
		} catch (NamingException e) {
			throw new RuntimeException(e);
		}
	}

	public static String str(String str) {
		if (str == null) {
			return null;
		}
		str = str.trim();
		return str == null || str.length() == 0 ? null : str;
	}

	@SuppressWarnings("unchecked")
	public static <T> T cause(Throwable exp, Class<T> clazz) {
		Throwable current = exp;
		while (current != null) {
			if (clazz.isInstance(current)) {
				return (T) current;
			}
			current = current.getCause();
		}
		return null;
	}

	public static String stack(Exception exp) {
		try {
			ByteArrayOutputStream bout = new ByteArrayOutputStream();
			PrintStream out = new PrintStream(bout);
			exp.printStackTrace(out);
			out.close();
			byte[] data = bout.toByteArray();
			return toString(data, "UTF-8");
		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public static String toString(byte[] data, String charset) {
		try {
			return data == null ? null : new String(data, charset);
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		}
	}

	public static void sleep(long time) {
		try {
			Thread.sleep(time);
		} catch (InterruptedException e) {
			throw new RuntimeException(e);
		}
	}

	public static byte[] toBytes(String text, String charset) {
		try {
			return text == null ? null : text.getBytes(charset);
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		}
	}

	public static String format(String pattern, Object... args) {
		return MessageFormat.format(pattern, args);
	}

	public static StringBuilder generateString(String str, int size) {
		StringBuilder ret = new StringBuilder(str.length() * size);
		for (int i = 0; i < size; i++) {
			ret.append(str);
		}
		return ret;
	}

}
