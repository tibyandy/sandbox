package org.otuka.pixint.apiclient;

import org.junit.Test;

/**
 * @author Anderson Otuka (anderson.otuka@dextra-sw.com)
 */
public class PixivConnectionTest {

    @Test
    public void testUsers() {
        System.out.println(new PixivConnection("", "").users(140263));
    }

    @Test
    public void testWorks() {
        System.out.println(new PixivConnection("", "").works(59062090));
    }
}
