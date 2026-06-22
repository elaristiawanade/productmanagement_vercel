package com.producttracker.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;

@Service
public class TeamsService {

    @Value("${app.teams.webhook-url:}")
    private String webhookUrl;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    public void sendTaskCreated(Map<String, Object> item, String actorName) {
        if (!isEnabled()) return;
        String code     = str(item.get("code"));
        String title    = str(item.get("title"));
        String type     = str(item.get("type"));
        String priority = str(item.get("priority"));
        String status   = str(item.get("status"));
        String assignee = str(item.get("assignee_name"));
        String product  = str(item.get("product_name"));

        post(buildCard("Backlog Item Dibuat", "0078D4", code + " — " + title, new String[][]{
            {"Produk", product},
            {"Tipe", type},
            {"Prioritas", priority},
            {"Status", status},
            {"Assignee", assignee.isBlank() ? "Unassigned" : assignee},
            {"Dibuat oleh", actorName},
        }));
    }

    public void sendTaskUpdated(Map<String, Object> item, String actorName, String changes) {
        if (!isEnabled()) return;
        post(buildCard("Backlog Item Diperbarui", "F7630C",
            str(item.get("code")) + " — " + str(item.get("title")), new String[][]{
                {"Perubahan", changes},
                {"Diperbarui oleh", actorName},
            }));
    }

    public void sendStatusChanged(Map<String, Object> item, String actorName,
                                  String oldStatus, String newStatus) {
        if (!isEnabled()) return;
        post(buildCard("Status Item Berubah", "107C10",
            str(item.get("code")) + " — " + str(item.get("title")), new String[][]{
                {"Status lama", oldStatus},
                {"Status baru", newStatus},
                {"Diubah oleh", actorName},
            }));
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    private boolean isEnabled() {
        return webhookUrl != null && !webhookUrl.isBlank();
    }

    private String str(Object v) { return v == null ? "" : v.toString(); }

    private String buildCard(String title, String color, String subtitle, String[][] facts) {
        StringBuilder factsJson = new StringBuilder();
        for (String[] f : facts) {
            if (factsJson.length() > 0) factsJson.append(",");
            factsJson.append("{\"name\":\"").append(escape(f[0]))
                     .append("\",\"value\":\"").append(escape(f[1])).append("\"}");
        }
        return "{\"@type\":\"MessageCard\",\"@context\":\"http://schema.org/extensions\","
            + "\"themeColor\":\"" + color + "\","
            + "\"summary\":\"" + escape(title) + "\","
            + "\"sections\":[{\"activityTitle\":\"" + escape(title) + "\","
            + "\"activitySubtitle\":\"" + escape(subtitle) + "\","
            + "\"facts\":[" + factsJson + "],\"markdown\":false}]}";
    }

    private String escape(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"")
                .replace("\n", " ").replace("\r", "");
    }

    private void post(String jsonBody) {
        try {
            HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(webhookUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();
            httpClient.sendAsync(req, HttpResponse.BodyHandlers.discarding());
        } catch (Exception e) {
            // best-effort; never propagate failure
        }
    }
}
