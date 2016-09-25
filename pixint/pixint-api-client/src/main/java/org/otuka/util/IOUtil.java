package org.otuka.util;

import java.io.BufferedInputStream;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.CharArrayWriter;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.Reader;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.URL;
import java.util.Properties;
import java.util.zip.GZIPInputStream;

import org.apache.commons.io.IOUtils;

public class IOUtil {

	public static String extention(String path) {
		path = VMUtil.str(path);
		String ret = path.replaceAll("^.*\\.([^//.]*)$", "$1");
		return VMUtil.str(ret);
	}

	public static String readAll(URL url, String charset) {
		Reader in = null;
		try {
			in = new InputStreamReader(new BufferedInputStream(url.openStream()), charset);
			return readAll(in);
		} catch (IOException e) {
			throw new RuntimeException(e);
		} finally {
			close(in);
		}
	}

	public static byte[] readAll(URL url) {
		InputStream in = null;
		try {
			in = new BufferedInputStream(url.openStream());
			return readAll(in);
		} catch (IOException e) {
			throw new RuntimeException(e);
		} finally {
			close(in);
		}
	}

	public static String readAll(Reader in) {
		CharArrayWriter writer = new CharArrayWriter();
		copyAll(in, writer);
		return writer.toString();
	}

	public static byte[] readAll(InputStream in) {
		ByteArrayOutputStream out = new ByteArrayOutputStream();
		copyAll(in, out);
		return out.toByteArray();
	}

	public static void copyAll(Reader in, Writer out) {
		try {
			IOUtils.copyLarge(in, out);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public static long copyAll(InputStream in, OutputStream out) {
		try {
			return IOUtils.copyLarge(in, out);
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

	public static String readFile(String file, String charset) {
		Reader in = null;
		try {
			in = new InputStreamReader(new BufferedInputStream(new FileInputStream(file)), charset);
			return readAll(in);
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		} catch (FileNotFoundException e) {
			throw new RuntimeException(e);
		} finally {
			close(in);
		}
	}

	public static void close(AutoCloseable o) {
		try {
			if (o != null) {
				o.close();
			}
		} catch (Exception e) {
			VMUtil.LOG.error("error closing", e);
		}

	}

	public static String readAll(InputStream in, String charset) {
		try {
			InputStreamReader nin = new InputStreamReader(new BufferedInputStream(in), charset);
			return readAll(nin);
		} catch (UnsupportedEncodingException e) {
			throw new RuntimeException(e);
		}
	}

	public static Properties readProperties(URL url) {
		Reader in = null;
		try {
			in = new InputStreamReader(new BufferedInputStream(url.openStream()), "UTF-8");
			Properties ret = new Properties();
			ret.load(in);
			return ret;
		} catch (IOException e) {
			throw new RuntimeException(e);
		} finally {
			close(in);
		}
	}


	public static byte[] gunzip(byte[] compressed) {
		InputStream in = null;
		try {
			in = new GZIPInputStream(new ByteArrayInputStream(compressed));
			return readAll(in);
		} catch (IOException e) {
			throw new RuntimeException(e);
		} finally {
			IOUtil.close(in);
		}
	}
	
}
