package org.otuka.pixint.gae.api;

import java.util.Date;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;

import com.google.gson.Gson;

/**
 * @author Anderson Otuka (anderson.otuka@dextra-sw.com)
 */
@Path("")
@Produces("application/json;charset=utf-8")
public class PixivApi {

    @GET
    @Path("/ping")
    public String ping() {
        return new Gson().toJson(new Date());
    }
}
