package com.producttracker.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private JdbcTemplate jdbc;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT u.id, u.email, u.password_hash, r.name AS role_name " +
            "FROM users u JOIN roles r ON u.role_id = r.id " +
            "WHERE u.email = ? AND u.is_active = true",
            email
        );
        if (rows.isEmpty()) throw new UsernameNotFoundException("User not found: " + email);
        Map<String, Object> row = rows.get(0);
        return User.builder()
                .username(email)
                .password((String) row.get("password_hash"))
                .authorities(List.of(new SimpleGrantedAuthority(
                    "ROLE_" + row.get("role_name").toString().toUpperCase()
                )))
                .build();
    }
}
