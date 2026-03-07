package com.hyperbench.clients.controller;

import com.hyperbench.clients.domain.Client;
import com.hyperbench.clients.repository.ClientRepository;
import com.hyperbench.halschemaforms.model.FormsRepresentationModel;
import com.hyperbench.halschemaforms.schema.FormBuilder;
import com.hyperbench.halschemaforms.schema.JsonSchemaBuilder;
import org.springframework.hateoas.Link;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

import static com.hyperbench.halschemaforms.schema.JsonSchemaBuilder.option;

@RestController
@RequestMapping("/ui")
public class ClientUiController {

    private final ClientRepository clientRepository;

    public ClientUiController(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @GetMapping("/clients")
    public FormsRepresentationModel clientList() {
        List<Client> clients = clientRepository.findAll();
        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/clients", "self"));
        model.add(Link.of("/ui/clients/form").withRel("create").withTitle("New Client"));
        model.addProperty("items", toItems(clients));
        return model;
    }

    @GetMapping("/clients/top")
    public FormsRepresentationModel topClients() {
        List<Client> clients = clientRepository.findTop10ByOrderByAccountValueDesc();
        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/clients/top", "self"));
        model.addProperty("items", toItems(clients));
        return model;
    }

    @GetMapping("/clients/recent")
    public FormsRepresentationModel recentClients() {
        List<Client> clients = clientRepository.findTop10ByOrderByLastActivityDateDesc();
        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/clients/recent", "self"));
        model.addProperty("items", toItems(clients));
        return model;
    }

    @GetMapping("/clients/search")
    public FormsRepresentationModel searchClients(@RequestParam(defaultValue = "") String q) {
        List<Client> clients;
        if (q.isBlank()) {
            clients = List.of();
        } else {
            clients = clientRepository.findByNameContainingIgnoreCase(q);
            if (clients.size() > 10) {
                clients = clients.subList(0, 10);
            }
        }
        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/clients/search?q=" + q, "self"));
        model.addProperty("items", toItems(clients));
        return model;
    }

    @GetMapping("/clients/form")
    public FormsRepresentationModel clientForm() {
        return buildClientForm(null);
    }

    @GetMapping("/clients/{id}/form")
    public ResponseEntity<FormsRepresentationModel> clientFormEdit(@PathVariable Long id) {
        return clientRepository.findById(id)
                .map(client -> ResponseEntity.ok(buildClientForm(client)))
                .orElse(ResponseEntity.notFound().build());
    }

    private FormsRepresentationModel buildClientForm(Client client) {
        boolean isEdit = client != null && client.getId() != null;
        String action = isEdit ? "/api/clients/" + client.getId() : "/api/clients";
        String method = isEdit ? "PUT" : "POST";

        JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .stringPropertyWithPlaceholder("name", "Full Name", "e.g. Chen Wei")
                .stringPropertyWithPlaceholder("initials", "Initials", "e.g. CW")
                .stringPropertyWithPlaceholder("email", "Email", "email", "e.g. chen.wei@example.com")
                .stringPropertyWithPlaceholder("phone", "Phone", "e.g. +41 79 123 4567")
                .enumProperty("riskProfile", "Risk Profile", List.of(
                        option("CONSERVATIVE", "Conservative"),
                        option("BALANCED", "Balanced"),
                        option("GROWTH", "Growth"),
                        option("AGGRESSIVE", "Aggressive")))
                .numberProperty("accountValue", "Account Value (CHF)")
                .stringPropertyWithPlaceholder("color", "Avatar Color", "e.g. #2563eb")
                .required("name", "initials");

        if (client != null) {
            if (client.getName() != null) schema.defaultValue("name", client.getName());
            if (client.getInitials() != null) schema.defaultValue("initials", client.getInitials());
            if (client.getEmail() != null) schema.defaultValue("email", client.getEmail());
            if (client.getPhone() != null) schema.defaultValue("phone", client.getPhone());
            if (client.getRiskProfile() != null) schema.defaultValue("riskProfile", client.getRiskProfile().name());
            if (client.getAccountValue() != null) schema.defaultValue("accountValue", client.getAccountValue());
            if (client.getColor() != null) schema.defaultValue("color", client.getColor());
        }

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of(isEdit ? "/ui/clients/" + client.getId() + "/form" : "/ui/clients/form", "self"));
        model.addForm("default", new FormBuilder()
                .target(action)
                .method(method)
                .schema(schema)
                .build());
        return model;
    }

    private List<Map<String, Object>> toItems(List<Client> clients) {
        List<Map<String, Object>> items = new ArrayList<>();
        for (Client c : clients) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", c.getId());
            item.put("name", nullSafe(c.getName()));
            item.put("initials", nullSafe(c.getInitials()));
            item.put("detail", formatDetail(c));
            item.put("color", nullSafe(c.getColor()));
            item.put("email", nullSafe(c.getEmail()));
            item.put("phone", nullSafe(c.getPhone()));
            item.put("riskProfile", c.getRiskProfile() != null ? c.getRiskProfile().name() : "");
            item.put("accountValue", c.getAccountValue());
            item.put("lastActivityDate", nullSafe(c.getLastActivityDate()));
            item.put("lastActivityNote", nullSafe(c.getLastActivityNote()));
            items.add(item);
        }
        return items;
    }

    private String formatDetail(Client c) {
        String aum = c.getAccountValue() != null
                ? String.format("CHF %.1fM AUM", c.getAccountValue() / 1_000_000.0)
                : "No AUM";
        String profile = c.getRiskProfile() != null
                ? c.getRiskProfile().name().charAt(0) + c.getRiskProfile().name().substring(1).toLowerCase()
                : "";
        return profile.isEmpty() ? aum : aum + " \u00b7 " + profile;
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
    }
}
