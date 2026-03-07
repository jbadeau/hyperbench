package com.hyperbench.shared.context;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.Map;

@Component
public class WorkbenchContextFilter implements Filter {
    private static final String HEADER_PREFIX = "x-context-";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        try {
            if (request instanceof HttpServletRequest httpReq) {
                Map<String, String> props = new HashMap<>();
                Enumeration<String> names = httpReq.getHeaderNames();
                while (names.hasMoreElements()) {
                    String name = names.nextElement();
                    if (name.toLowerCase().startsWith(HEADER_PREFIX)) {
                        String key = name.substring(HEADER_PREFIX.length());
                        props.put(key, httpReq.getHeader(name));
                    }
                }
                WorkbenchContext.set(new WorkbenchContext(props));
            }
            chain.doFilter(request, response);
        } finally {
            WorkbenchContext.clear();
        }
    }
}
