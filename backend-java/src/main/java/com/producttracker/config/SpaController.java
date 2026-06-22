package com.producttracker.config;

import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

import javax.servlet.RequestDispatcher;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

/**
 * Forwards all non-API 404s to index.html so React Router handles client-side routing.
 */
@Controller
@RequestMapping("/error")
public class SpaController implements ErrorController {

    @GetMapping
    public String handleError(HttpServletRequest request, HttpServletResponse response) {
        Object status = request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (status != null && Integer.parseInt(status.toString()) == HttpStatus.NOT_FOUND.value()) {
            Object uri = request.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
            if (uri == null || !uri.toString().startsWith("/api/")) {
                response.setStatus(HttpStatus.OK.value());
                return "forward:/index.html";
            }
        }
        return "forward:/index.html";
    }
}
