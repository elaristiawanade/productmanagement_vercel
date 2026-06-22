package com.producttracker.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private JdbcTemplate jdbc;

    @GetMapping
    public ResponseEntity<?> list(@AuthenticationPrincipal Object principal) {
        Long userId = currentUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT id, type, title, message, link, is_read, created_at " +
            "FROM notifications WHERE user_id = ? " +
            "ORDER BY is_read ASC, created_at DESC LIMIT 50",
            userId
        );
        return ResponseEntity.ok(rows);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(@AuthenticationPrincipal Object principal) {
        Long userId = currentUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        Long count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = false",
            Long.class, userId
        );
        return ResponseEntity.ok(Map.of("count", count != null ? count : 0));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id,
                                       @AuthenticationPrincipal Object principal) {
        Long userId = currentUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        jdbc.update(
            "UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?",
            id, userId
        );
        return ResponseEntity.ok(Map.of("ok", true));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<?> markAllRead(@AuthenticationPrincipal Object principal) {
        Long userId = currentUserId(principal);
        if (userId == null) return ResponseEntity.status(401).build();
        int updated = jdbc.update(
            "UPDATE notifications SET is_read = true WHERE user_id = ? AND is_read = false",
            userId
        );
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    @SuppressWarnings("unchecked")
    private Long currentUserId(Object principal) {
        if (!(principal instanceof Map)) return null;
        Object id = ((Map<String, Object>) principal).get("id");
        if (id instanceof Number) return ((Number) id).longValue();
        try { return Long.parseLong(id.toString()); } catch (Exception e) { return null; }
    }
}
