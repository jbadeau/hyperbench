package com.hyperbench.clients.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 255)
    private String name;

    @Size(max = 10)
    private String initials;

    @Size(max = 255)
    private String email;

    @Size(max = 50)
    private String phone;

    @Enumerated(EnumType.STRING)
    private RiskProfile riskProfile;

    private Double accountValue;

    @Size(max = 7)
    private String color;

    private String lastActivityDate;

    @Size(max = 500)
    private String lastActivityNote;

    public enum RiskProfile {
        CONSERVATIVE, BALANCED, GROWTH, AGGRESSIVE
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getInitials() { return initials; }
    public void setInitials(String initials) { this.initials = initials; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public RiskProfile getRiskProfile() { return riskProfile; }
    public void setRiskProfile(RiskProfile riskProfile) { this.riskProfile = riskProfile; }

    public Double getAccountValue() { return accountValue; }
    public void setAccountValue(Double accountValue) { this.accountValue = accountValue; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public String getLastActivityDate() { return lastActivityDate; }
    public void setLastActivityDate(String lastActivityDate) { this.lastActivityDate = lastActivityDate; }

    public String getLastActivityNote() { return lastActivityNote; }
    public void setLastActivityNote(String lastActivityNote) { this.lastActivityNote = lastActivityNote; }
}
