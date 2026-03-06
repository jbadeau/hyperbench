package com.hyperbench.onboarding.controller;

import com.hyperbench.halschemaforms.model.FormsRepresentationModel;
import com.hyperbench.halschemaforms.schema.FormBuilder;
import com.hyperbench.halschemaforms.schema.JsonSchemaBuilder;
import com.hyperbench.onboarding.domain.OnboardingDraft;
import com.hyperbench.onboarding.repository.OnboardingDraftRepository;
import org.springframework.hateoas.Link;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static com.hyperbench.halschemaforms.schema.JsonSchemaBuilder.option;

@RestController
@RequestMapping("/ui/onboarding")
public class OnboardingUiController {

    private final OnboardingDraftRepository repository;

    private static final List<Map<String, String>> COUNTRIES = List.of(
            option("US", "United States"),
            option("UK", "United Kingdom"),
            option("DE", "Germany"),
            option("CH", "Switzerland"),
            option("SG", "Singapore"),
            option("HK", "Hong Kong")
    );

    private static final List<Map<String, String>> CLIENT_TYPES = List.of(
            option("INDIVIDUAL", "Individual"),
            option("BUSINESS", "Business")
    );

    public OnboardingUiController(OnboardingDraftRepository repository) {
        this.repository = repository;
    }

    // GET /ui/onboarding/step1 — new empty form
    @GetMapping("/step1")
    public FormsRepresentationModel step1New() {
        JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .stringPropertyWithPlaceholder("fullName", "Full Name", "e.g. Jane Smith")
                .stringPropertyWithPlaceholder("email", "Email Address", "email", "jane@example.com")
                .stringPropertyWithPlaceholder("phone", "Phone Number", "+1 (555) 123-4567")
                .enumProperty("clientType", "Client Type", CLIENT_TYPES)
                .enumProperty("country", "Country", COUNTRIES)
                .required("fullName", "email");

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/onboarding/step1", "self"));
        model.addProperty("step", 1);
        model.addProperty("totalSteps", 5);
        model.addProperty("stepLabel", "Client Info");
        model.addForm("default", new FormBuilder()
                .target("/ui/onboarding")
                .method("POST")
                .schema(schema)
                .build());
        return model;
    }

    // GET /ui/onboarding/{id}/step1 — load draft, render step 1
    @GetMapping("/{id}/step1")
    public ResponseEntity<FormsRepresentationModel> step1Edit(@PathVariable String id) {
        return repository.findById(id).map(draft -> {
            JsonSchemaBuilder schema = new JsonSchemaBuilder()
                    .stringPropertyWithPlaceholder("fullName", "Full Name", "e.g. Jane Smith")
                    .stringPropertyWithPlaceholder("email", "Email Address", "email", "jane@example.com")
                    .stringPropertyWithPlaceholder("phone", "Phone Number", "+1 (555) 123-4567")
                    .enumProperty("clientType", "Client Type", CLIENT_TYPES)
                    .enumProperty("country", "Country", COUNTRIES)
                    .required("fullName", "email");

            setDefaults(schema, draft);

            FormsRepresentationModel model = new FormsRepresentationModel();
            model.add(Link.of("/ui/onboarding/" + id + "/step1", "self"));
            model.addProperty("step", 1);
            model.addProperty("totalSteps", 5);
            model.addProperty("stepLabel", "Client Info");
            model.addForm("default", new FormBuilder()
                    .target("/ui/onboarding/" + id + "/step1")
                    .method("POST")
                    .schema(schema)
                    .build());
            return ResponseEntity.ok(model);
        }).orElse(ResponseEntity.notFound().build());
    }

    // POST /ui/onboarding — create draft in H2, return step 2
    @PostMapping
    public FormsRepresentationModel create(@RequestBody Map<String, Object> body) {
        OnboardingDraft draft = new OnboardingDraft();
        applyStep1(draft, body);
        repository.save(draft);
        return buildStep2(draft, str(body, "country", "US"));
    }

    // POST /ui/onboarding/{id}/step1 — update step 1, return step 2
    @PostMapping("/{id}/step1")
    public ResponseEntity<FormsRepresentationModel> updateStep1(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            applyStep1(draft, body);
            repository.save(draft);
            return ResponseEntity.ok(buildStep2(draft, str(body, "country", "US")));
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET /ui/onboarding/{id}/step2 — load draft, render step 2
    @GetMapping("/{id}/step2")
    public ResponseEntity<FormsRepresentationModel> step2(@PathVariable String id,
                                                          @RequestParam(required = false) String country) {
        return repository.findById(id).map(draft -> {
            String c = country != null ? country : (draft.getCountry() != null ? draft.getCountry() : "US");
            return ResponseEntity.ok(buildStep2(draft, c));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PATCH /ui/onboarding/{id}/step2 — save fields, re-render same step
    @PatchMapping("/{id}/step2")
    public ResponseEntity<FormsRepresentationModel> patchStep2(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            if (body.containsKey("country")) draft.setCountry(str(body, "country", draft.getCountry()));
            if (body.containsKey("street")) draft.setStreet(str(body, "street", ""));
            if (body.containsKey("city")) draft.setCity(str(body, "city", ""));
            if (body.containsKey("state")) draft.setState(str(body, "state", ""));
            if (body.containsKey("postalCode")) draft.setPostalCode(str(body, "postalCode", ""));
            repository.save(draft);
            String c = draft.getCountry() != null ? draft.getCountry() : "US";
            return ResponseEntity.ok(buildStep2(draft, c));
        }).orElse(ResponseEntity.notFound().build());
    }

    // POST /ui/onboarding/{id}/step2 — save address, return step 3
    @PostMapping("/{id}/step2")
    public ResponseEntity<FormsRepresentationModel> saveStep2(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            draft.setStreet(str(body, "street", ""));
            draft.setCity(str(body, "city", ""));
            draft.setState(str(body, "state", ""));
            draft.setPostalCode(str(body, "postalCode", ""));
            if (body.containsKey("country")) {
                draft.setCountry(str(body, "country", draft.getCountry()));
            }
            repository.save(draft);
            String rt = draft.getRiskTolerance() != null ? draft.getRiskTolerance() : "MODERATE";
            return ResponseEntity.ok(buildStep3RiskSuitability(draft, rt));
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET /ui/onboarding/{id}/step3 — load draft, render step 3
    @GetMapping("/{id}/step3")
    public ResponseEntity<FormsRepresentationModel> step3(@PathVariable String id,
                                                          @RequestParam(required = false) String riskTolerance) {
        return repository.findById(id).map(draft -> {
            String rt = riskTolerance != null ? riskTolerance : (draft.getRiskTolerance() != null ? draft.getRiskTolerance() : "MODERATE");
            return ResponseEntity.ok(buildStep3RiskSuitability(draft, rt));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PATCH /ui/onboarding/{id}/step3 — save fields, re-render same step
    @PatchMapping("/{id}/step3")
    public ResponseEntity<FormsRepresentationModel> patchStep3(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            if (body.containsKey("riskTolerance")) draft.setRiskTolerance(str(body, "riskTolerance", draft.getRiskTolerance()));
            if (body.containsKey("investmentExperience")) draft.setInvestmentExperience(str(body, "investmentExperience", ""));
            if (body.containsKey("investmentObjective")) draft.setInvestmentObjective(str(body, "investmentObjective", ""));
            if (body.containsKey("annualIncome")) draft.setAnnualIncome(str(body, "annualIncome", ""));
            if (body.containsKey("netWorth")) draft.setNetWorth(str(body, "netWorth", ""));
            if (body.containsKey("sourceOfWealth")) draft.setSourceOfWealth(str(body, "sourceOfWealth", ""));
            repository.save(draft);
            String rt = draft.getRiskTolerance() != null ? draft.getRiskTolerance() : "MODERATE";
            return ResponseEntity.ok(buildStep3RiskSuitability(draft, rt));
        }).orElse(ResponseEntity.notFound().build());
    }

    // POST /ui/onboarding/{id}/step3 — save risk & suitability, return step 4
    @PostMapping("/{id}/step3")
    public ResponseEntity<FormsRepresentationModel> saveStep3(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            applyStep3RiskSuitability(draft, body);
            repository.save(draft);
            String dt = draft.getDocumentType() != null ? draft.getDocumentType() : "PASSPORT";
            return ResponseEntity.ok(buildStep4KycVerification(draft, dt));
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET /ui/onboarding/{id}/step4 — load draft, render step 4
    @GetMapping("/{id}/step4")
    public ResponseEntity<FormsRepresentationModel> step4(@PathVariable String id,
                                                          @RequestParam(required = false) String documentType) {
        return repository.findById(id).map(draft -> {
            String dt = documentType != null ? documentType : (draft.getDocumentType() != null ? draft.getDocumentType() : "PASSPORT");
            return ResponseEntity.ok(buildStep4KycVerification(draft, dt));
        }).orElse(ResponseEntity.notFound().build());
    }

    // PATCH /ui/onboarding/{id}/step4 — save fields, re-render same step
    @PatchMapping("/{id}/step4")
    public ResponseEntity<FormsRepresentationModel> patchStep4(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            if (body.containsKey("documentType")) draft.setDocumentType(str(body, "documentType", draft.getDocumentType()));
            if (body.containsKey("documentNumber")) draft.setDocumentNumber(str(body, "documentNumber", ""));
            if (body.containsKey("issuingCountry")) draft.setIssuingCountry(str(body, "issuingCountry", ""));
            if (body.containsKey("documentExpiry")) draft.setDocumentExpiry(str(body, "documentExpiry", ""));
            if (body.containsKey("verificationStatus")) draft.setVerificationStatus(str(body, "verificationStatus", ""));
            if (body.containsKey("occupation")) draft.setOccupation(str(body, "occupation", ""));
            repository.save(draft);
            String dt = draft.getDocumentType() != null ? draft.getDocumentType() : "PASSPORT";
            return ResponseEntity.ok(buildStep4KycVerification(draft, dt));
        }).orElse(ResponseEntity.notFound().build());
    }

    // POST /ui/onboarding/{id}/step4 — save KYC verification, return confirmation
    @PostMapping("/{id}/step4")
    public ResponseEntity<FormsRepresentationModel> saveStep4(@PathVariable String id, @RequestBody Map<String, Object> body) {
        return repository.findById(id).map(draft -> {
            applyStep4KycVerification(draft, body);
            repository.save(draft);
            return ResponseEntity.ok(buildConfirmation(draft));
        }).orElse(ResponseEntity.notFound().build());
    }

    // GET /ui/onboarding/{id}/confirmation
    @GetMapping("/{id}/confirmation")
    public ResponseEntity<FormsRepresentationModel> confirmation(@PathVariable String id) {
        return repository.findById(id).map(draft ->
                ResponseEntity.ok(buildConfirmation(draft))
        ).orElse(ResponseEntity.notFound().build());
    }

    // ── Step builders ──

    private FormsRepresentationModel buildStep2(OnboardingDraft draft, String country) {
        String id = draft.getId();

        JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .enumProperty("country", "Country", COUNTRIES)
                .required("street", "city");

        // Set country default
        schema.defaultValue("country", country);

        // Country-specific address fields
        switch (country) {
            case "UK" -> schema
                    .stringPropertyWithPlaceholder("street", "Street Address", "10 Downing Street")
                    .stringPropertyWithPlaceholder("city", "City / Town", "London")
                    .stringPropertyWithPlaceholder("state", "County", "Greater London")
                    .stringPropertyWithPlaceholder("postalCode", "Postcode", "SW1A 2AA")
                    .required("postalCode");
            case "DE" -> schema
                    .stringPropertyWithPlaceholder("street", "Straße und Hausnummer", "Unter den Linden 77")
                    .stringPropertyWithPlaceholder("city", "Ort", "Berlin")
                    .enumProperty("state", "Bundesland", List.of(
                            option("BW", "Baden-Württemberg"), option("BY", "Bayern"),
                            option("BE", "Berlin"), option("HH", "Hamburg"),
                            option("HE", "Hessen"), option("NW", "Nordrhein-Westfalen"),
                            option("SN", "Sachsen")))
                    .stringPropertyWithPlaceholder("postalCode", "Postleitzahl", "10117")
                    .required("postalCode");
            case "CH" -> schema
                    .stringPropertyWithPlaceholder("street", "Straße", "Bahnhofstrasse 1")
                    .stringPropertyWithPlaceholder("city", "Ort", "Zürich")
                    .enumProperty("state", "Canton", List.of(
                            option("ZH", "Zürich"), option("BE", "Bern"),
                            option("GE", "Geneva"), option("VD", "Vaud"),
                            option("BS", "Basel-Stadt")))
                    .stringPropertyWithPlaceholder("postalCode", "Postleitzahl", "8001")
                    .required("postalCode");
            case "SG" -> schema
                    .stringPropertyWithPlaceholder("street", "Block/Street", "1 Raffles Place")
                    .stringPropertyWithPlaceholder("city", "Unit Number", "#01-01")
                    .stringPropertyWithPlaceholder("postalCode", "Postal Code", "018956")
                    .required("postalCode");
            case "HK" -> schema
                    .stringPropertyWithPlaceholder("street", "Flat/Floor/Block", "Flat A, 12/F")
                    .stringPropertyWithPlaceholder("city", "Building/Estate", "Tower 1, Lippo Centre")
                    .enumProperty("state", "District", List.of(
                            option("Central", "Central"), option("Wan Chai", "Wan Chai"),
                            option("Kowloon", "Kowloon"), option("Tsim Sha Tsui", "Tsim Sha Tsui"),
                            option("Sha Tin", "Sha Tin"), option("Tai Po", "Tai Po")));
            default -> schema // US
                    .stringPropertyWithPlaceholder("street", "Street Address", "123 Main Street")
                    .stringPropertyWithPlaceholder("city", "City", "San Francisco")
                    .enumProperty("state", "State", List.of(
                            option("CA", "California"), option("NY", "New York"),
                            option("TX", "Texas"), option("FL", "Florida"),
                            option("IL", "Illinois"), option("WA", "Washington"),
                            option("MA", "Massachusetts"), option("CO", "Colorado")))
                    .stringPropertyWithPlaceholder("postalCode", "ZIP Code", "94102")
                    .required("postalCode");
        }

        // Pre-fill from DB
        if (draft.getStreet() != null) schema.defaultValue("street", draft.getStreet());
        if (draft.getCity() != null) schema.defaultValue("city", draft.getCity());
        if (draft.getState() != null) schema.defaultValue("state", draft.getState());
        if (draft.getPostalCode() != null) schema.defaultValue("postalCode", draft.getPostalCode());

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/onboarding/" + id + "/step2{?country}", "self").withTitle("Address & Tax — " + countryLabel(country)));
        model.add(Link.of("/ui/onboarding/" + id + "/step1", "prev"));
        model.addProperty("step", 2);
        model.addProperty("totalSteps", 5);
        model.addProperty("stepLabel", "Address & Tax — " + countryLabel(country));
        model.addForm("default", new FormBuilder()
                .target("/ui/onboarding/" + id + "/step2")
                .method("POST")
                .schema(schema)
                .build());
        return model;
    }

    private FormsRepresentationModel buildStep3RiskSuitability(OnboardingDraft draft, String riskTolerance) {
        String id = draft.getId();

        JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .enumProperty("riskTolerance", "Risk Tolerance", List.of(
                        option("LOW", "Low"),
                        option("MODERATE", "Moderate"),
                        option("HIGH", "High"),
                        option("VERY_HIGH", "Very High")));

        // Set riskTolerance default
        schema.defaultValue("riskTolerance", riskTolerance);

        // Experience options vary by risk level
        switch (riskTolerance) {
            case "LOW" -> {
                schema.enumProperty("investmentExperience", "Investment Experience", List.of(
                        option("NONE", "None"),
                        option("LIMITED", "Limited"),
                        option("MODERATE", "Moderate")));
                schema.enumProperty("investmentObjective", "Investment Objective", List.of(
                        option("CAPITAL_PRESERVATION", "Capital Preservation"),
                        option("INCOME", "Income")));
                schema.enumProperty("annualIncome", "Annual Income (CHF)", List.of(
                        option("UNDER_100K", "Under CHF 100K"),
                        option("100K_500K", "CHF 100K - 500K"),
                        option("500K_1M", "CHF 500K - 1M"),
                        option("OVER_1M", "Over CHF 1M")));
                schema.enumProperty("netWorth", "Net Worth (CHF)", List.of(
                        option("UNDER_500K", "Under CHF 500K"),
                        option("500K_2M", "CHF 500K - 2M"),
                        option("2M_10M", "CHF 2M - 10M"),
                        option("OVER_10M", "Over CHF 10M")));
                schema.required("riskTolerance", "investmentExperience", "investmentObjective");
            }
            case "MODERATE" -> {
                schema.enumProperty("investmentExperience", "Investment Experience", List.of(
                        option("NONE", "None"),
                        option("LIMITED", "Limited"),
                        option("MODERATE", "Moderate"),
                        option("EXTENSIVE", "Extensive")));
                schema.enumProperty("investmentObjective", "Investment Objective", List.of(
                        option("CAPITAL_PRESERVATION", "Capital Preservation"),
                        option("INCOME", "Income"),
                        option("GROWTH", "Growth")));
                schema.enumProperty("annualIncome", "Annual Income (CHF)", List.of(
                        option("UNDER_100K", "Under CHF 100K"),
                        option("100K_500K", "CHF 100K - 500K"),
                        option("500K_1M", "CHF 500K - 1M"),
                        option("OVER_1M", "Over CHF 1M")));
                schema.enumProperty("netWorth", "Net Worth (CHF)", List.of(
                        option("UNDER_500K", "Under CHF 500K"),
                        option("500K_2M", "CHF 500K - 2M"),
                        option("2M_10M", "CHF 2M - 10M"),
                        option("OVER_10M", "Over CHF 10M")));
                schema.enumProperty("sourceOfWealth", "Source of Wealth", List.of(
                        option("EMPLOYMENT", "Employment"),
                        option("BUSINESS", "Business"),
                        option("INHERITANCE", "Inheritance"),
                        option("INVESTMENTS", "Investments"),
                        option("OTHER", "Other")));
                schema.required("riskTolerance", "investmentExperience", "investmentObjective");
            }
            case "HIGH" -> {
                schema.enumProperty("investmentExperience", "Investment Experience", List.of(
                        option("LIMITED", "Limited"),
                        option("MODERATE", "Moderate"),
                        option("EXTENSIVE", "Extensive")));
                schema.enumProperty("investmentObjective", "Investment Objective", List.of(
                        option("INCOME", "Income"),
                        option("GROWTH", "Growth"),
                        option("SPECULATION", "Speculation")));
                schema.enumProperty("annualIncome", "Annual Income (CHF)", List.of(
                        option("100K_500K", "CHF 100K - 500K"),
                        option("500K_1M", "CHF 500K - 1M"),
                        option("OVER_1M", "Over CHF 1M")));
                schema.enumProperty("netWorth", "Net Worth (CHF)", List.of(
                        option("500K_2M", "CHF 500K - 2M"),
                        option("2M_10M", "CHF 2M - 10M"),
                        option("OVER_10M", "Over CHF 10M")));
                schema.enumProperty("sourceOfWealth", "Source of Wealth", List.of(
                        option("EMPLOYMENT", "Employment"),
                        option("BUSINESS", "Business"),
                        option("INHERITANCE", "Inheritance"),
                        option("INVESTMENTS", "Investments"),
                        option("OTHER", "Other")));
                schema.required("riskTolerance", "investmentExperience", "investmentObjective", "sourceOfWealth", "annualIncome");
            }
            default -> { // VERY_HIGH
                schema.enumProperty("investmentExperience", "Investment Experience", List.of(
                        option("MODERATE", "Moderate"),
                        option("EXTENSIVE", "Extensive")));
                schema.enumProperty("investmentObjective", "Investment Objective", List.of(
                        option("GROWTH", "Growth"),
                        option("SPECULATION", "Speculation")));
                schema.enumProperty("annualIncome", "Annual Income (CHF)", List.of(
                        option("500K_1M", "CHF 500K - 1M"),
                        option("OVER_1M", "Over CHF 1M")));
                schema.enumProperty("netWorth", "Net Worth (CHF)", List.of(
                        option("2M_10M", "CHF 2M - 10M"),
                        option("OVER_10M", "Over CHF 10M")));
                schema.enumProperty("sourceOfWealth", "Source of Wealth", List.of(
                        option("EMPLOYMENT", "Employment"),
                        option("BUSINESS", "Business"),
                        option("INHERITANCE", "Inheritance"),
                        option("INVESTMENTS", "Investments"),
                        option("OTHER", "Other")));
                schema.stringPropertyWithPlaceholder("riskAcknowledgment", "Risk Acknowledgment",
                        "I understand the risks of aggressive investment strategies");
                schema.required("riskTolerance", "investmentExperience", "investmentObjective",
                        "sourceOfWealth", "annualIncome", "netWorth");
            }
        }

        // Pre-fill from DB
        if (draft.getInvestmentExperience() != null) schema.defaultValue("investmentExperience", draft.getInvestmentExperience());
        if (draft.getInvestmentObjective() != null) schema.defaultValue("investmentObjective", draft.getInvestmentObjective());
        if (draft.getAnnualIncome() != null) schema.defaultValue("annualIncome", draft.getAnnualIncome());
        if (draft.getNetWorth() != null) schema.defaultValue("netWorth", draft.getNetWorth());
        if (draft.getSourceOfWealth() != null) schema.defaultValue("sourceOfWealth", draft.getSourceOfWealth());

        String riskLabel = switch (riskTolerance) {
            case "LOW" -> "Low";
            case "HIGH" -> "High";
            case "VERY_HIGH" -> "Very High";
            default -> "Moderate";
        };

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/onboarding/" + id + "/step3{?riskTolerance}", "self")
                .withTitle("Risk & Suitability — " + riskLabel));
        model.add(Link.of("/ui/onboarding/" + id + "/step2", "prev"));
        model.addProperty("step", 3);
        model.addProperty("totalSteps", 5);
        model.addProperty("stepLabel", "Risk & Suitability — " + riskLabel);
        model.addForm("default", new FormBuilder()
                .target("/ui/onboarding/" + id + "/step3")
                .method("POST")
                .schema(schema)
                .build());
        return model;
    }

    private FormsRepresentationModel buildStep4KycVerification(OnboardingDraft draft, String documentType) {
        String id = draft.getId();

        JsonSchemaBuilder schema = new JsonSchemaBuilder()
                .enumProperty("documentType", "Document Type", List.of(
                        option("PASSPORT", "Passport"),
                        option("NATIONAL_ID", "National ID"),
                        option("DRIVERS_LICENSE", "Driver's License")));

        // Set documentType default
        schema.defaultValue("documentType", documentType);

        // Document-specific fields
        switch (documentType) {
            case "PASSPORT" -> {
                schema.stringPropertyWithPlaceholder("documentNumber", "Passport Number", "e.g. X12345678")
                        .enumProperty("issuingCountry", "Issuing Country", COUNTRIES)
                        .stringProperty("documentExpiry", "Expiry Date", "date")
                        .stringPropertyWithPlaceholder("occupation", "Occupation", "e.g. Relationship Manager")
                        .enumProperty("verificationStatus", "Verification Status", List.of(
                                option("PENDING", "Pending"),
                                option("VERIFIED", "Verified"),
                                option("REQUIRES_REVIEW", "Requires Review")))
                        .required("documentType", "documentNumber", "issuingCountry", "documentExpiry");
            }
            case "NATIONAL_ID" -> {
                schema.stringPropertyWithPlaceholder("documentNumber", "National ID Number", "e.g. 756.1234.5678.90")
                        .enumProperty("issuingCountry", "Issuing Country", COUNTRIES)
                        .stringProperty("documentExpiry", "Expiry Date", "date")
                        .stringPropertyWithPlaceholder("occupation", "Occupation", "e.g. Relationship Manager")
                        .enumProperty("verificationStatus", "Verification Status", List.of(
                                option("PENDING", "Pending"),
                                option("VERIFIED", "Verified"),
                                option("REQUIRES_REVIEW", "Requires Review")))
                        .required("documentType", "documentNumber", "issuingCountry");
            }
            default -> { // DRIVERS_LICENSE
                schema.stringPropertyWithPlaceholder("documentNumber", "License Number", "e.g. DL-987654321")
                        .enumProperty("issuingCountry", "Issuing Country / State", COUNTRIES)
                        .stringProperty("documentExpiry", "Expiry Date", "date")
                        .enumProperty("licenseClass", "License Class", List.of(
                                option("A", "Class A — Motorcycle"),
                                option("B", "Class B — Passenger Vehicle"),
                                option("C", "Class C — Commercial"),
                                option("D", "Class D — Bus / Heavy")))
                        .stringPropertyWithPlaceholder("occupation", "Occupation", "e.g. Relationship Manager")
                        .enumProperty("verificationStatus", "Verification Status", List.of(
                                option("PENDING", "Pending"),
                                option("VERIFIED", "Verified"),
                                option("REQUIRES_REVIEW", "Requires Review")))
                        .required("documentType", "documentNumber", "documentExpiry");
            }
        }

        // Pre-fill from DB
        if (draft.getDocumentNumber() != null) schema.defaultValue("documentNumber", draft.getDocumentNumber());
        if (draft.getIssuingCountry() != null) schema.defaultValue("issuingCountry", draft.getIssuingCountry());
        if (draft.getDocumentExpiry() != null) schema.defaultValue("documentExpiry", draft.getDocumentExpiry());
        if (draft.getVerificationStatus() != null) schema.defaultValue("verificationStatus", draft.getVerificationStatus());
        if (draft.getOccupation() != null) schema.defaultValue("occupation", draft.getOccupation());

        String docLabel = switch (documentType) {
            case "PASSPORT" -> "Passport";
            case "NATIONAL_ID" -> "National ID";
            default -> "Driver's License";
        };

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/onboarding/" + id + "/step4{?documentType}", "self")
                .withTitle("KYC Verification — " + docLabel));
        model.add(Link.of("/ui/onboarding/" + id + "/step3", "prev"));
        model.addProperty("step", 4);
        model.addProperty("totalSteps", 5);
        model.addProperty("stepLabel", "KYC Verification — " + docLabel);
        model.addForm("default", new FormBuilder()
                .target("/ui/onboarding/" + id + "/step4")
                .method("POST")
                .schema(schema)
                .build());
        return model;
    }

    private FormsRepresentationModel buildConfirmation(OnboardingDraft draft) {
        String id = draft.getId();
        String clientLabel = "BUSINESS".equals(draft.getClientType()) ? "Business" : "Individual";

        Map<String, String> summary = new LinkedHashMap<>();
        summary.put("Name", nullSafe(draft.getFullName()));
        summary.put("Email", nullSafe(draft.getEmail()));
        summary.put("Client Type", clientLabel);
        summary.put("Country", countryLabel(nullSafe(draft.getCountry())));
        summary.put("Location", nullSafe(draft.getCity()) +
                (draft.getState() != null && !draft.getState().isEmpty() ? ", " + draft.getState() : ""));
        summary.put("Risk Tolerance", nullSafe(draft.getRiskTolerance()));
        summary.put("Investment Objective", nullSafe(draft.getInvestmentObjective()));
        summary.put("Document Type", nullSafe(draft.getDocumentType()));
        summary.put("Document Number", nullSafe(draft.getDocumentNumber()));
        summary.put("Verification Status", nullSafe(draft.getVerificationStatus()));

        FormsRepresentationModel model = new FormsRepresentationModel();
        model.add(Link.of("/ui/onboarding/" + id + "/confirmation", "self"));
        model.add(Link.of("/ui/dashboard").withRel("home").withTitle("Back to Dashboard"));
        model.add(Link.of("/ui/onboarding/step1").withRel("create").withTitle("Start New KYC"));
        model.addProperty("step", 5);
        model.addProperty("totalSteps", 5);
        model.addProperty("alert", Map.of(
                "message", "KYC submission completed! The compliance team will review the documentation.",
                "variant", "success"));
        model.addProperty("summary", summary);
        return model;
    }

    // ── Helpers ──

    private void applyStep1(OnboardingDraft draft, Map<String, Object> body) {
        draft.setFullName(str(body, "fullName", ""));
        draft.setEmail(str(body, "email", ""));
        draft.setPhone(str(body, "phone", ""));
        draft.setClientType(str(body, "clientType", "INDIVIDUAL"));
        draft.setCountry(str(body, "country", "US"));
    }

    private void setDefaults(JsonSchemaBuilder schema, OnboardingDraft draft) {
        if (draft.getFullName() != null) schema.defaultValue("fullName", draft.getFullName());
        if (draft.getEmail() != null) schema.defaultValue("email", draft.getEmail());
        if (draft.getPhone() != null) schema.defaultValue("phone", draft.getPhone());
        if (draft.getClientType() != null) schema.defaultValue("clientType", draft.getClientType());
        if (draft.getCountry() != null) schema.defaultValue("country", draft.getCountry());
    }

    private String countryLabel(String code) {
        if (code == null) return "United States";
        return switch (code) {
            case "UK" -> "United Kingdom";
            case "DE" -> "Germany";
            case "CH" -> "Switzerland";
            case "SG" -> "Singapore";
            case "HK" -> "Hong Kong";
            default -> "United States";
        };
    }

    private void applyStep3RiskSuitability(OnboardingDraft draft, Map<String, Object> body) {
        draft.setRiskTolerance(str(body, "riskTolerance", ""));
        draft.setInvestmentExperience(str(body, "investmentExperience", ""));
        draft.setInvestmentObjective(str(body, "investmentObjective", ""));
        draft.setAnnualIncome(str(body, "annualIncome", ""));
        draft.setNetWorth(str(body, "netWorth", ""));
        draft.setSourceOfWealth(str(body, "sourceOfWealth", ""));
    }

    private void applyStep4KycVerification(OnboardingDraft draft, Map<String, Object> body) {
        draft.setDocumentType(str(body, "documentType", ""));
        draft.setDocumentNumber(str(body, "documentNumber", ""));
        draft.setIssuingCountry(str(body, "issuingCountry", ""));
        draft.setDocumentExpiry(str(body, "documentExpiry", ""));
        draft.setVerificationStatus(str(body, "verificationStatus", "PENDING"));
        draft.setOccupation(str(body, "occupation", ""));
    }

    private static String str(Map<String, Object> map, String key, String defaultValue) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : defaultValue;
    }

    private static Integer intVal(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(val)); } catch (NumberFormatException e) { return null; }
    }

    private static String nullSafe(String value) {
        return value != null ? value : "";
    }
}
