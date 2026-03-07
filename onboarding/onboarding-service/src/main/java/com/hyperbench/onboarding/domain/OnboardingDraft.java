package com.hyperbench.onboarding.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

import java.util.UUID;

@Entity
public class OnboardingDraft {

    @Id
    private String id;

    // Step 1: Basic Information
    private String fullName;
    private String email;
    private String phone;
    private String clientType;
    private String country;

    // Step 2: Address
    private String street;
    private String city;
    private String state;
    private String postalCode;

    // Step 3: Details (Business)
    private String companyName;
    private String taxId;
    private Integer numEmployees;
    private String industry;
    private String annualRevenue;

    // Step 3: Details (Individual)
    private String dateOfBirth;
    private String governmentId;
    private String preferredContact;
    private String occupation;

    // Step 3: Risk & Suitability
    private String riskTolerance;         // LOW, MODERATE, HIGH, VERY_HIGH
    private String investmentExperience;  // NONE, LIMITED, MODERATE, EXTENSIVE
    private String investmentObjective;   // CAPITAL_PRESERVATION, INCOME, GROWTH, SPECULATION
    private String annualIncome;          // UNDER_100K, 100K_500K, 500K_1M, OVER_1M
    private String netWorth;              // UNDER_500K, 500K_2M, 2M_10M, OVER_10M
    private String sourceOfWealth;        // EMPLOYMENT, BUSINESS, INHERITANCE, INVESTMENTS, OTHER

    // Step 4: KYC Verification
    private String documentType;          // PASSPORT, NATIONAL_ID, DRIVERS_LICENSE
    private String documentNumber;
    private String issuingCountry;
    private String documentExpiry;         // date string
    private String verificationStatus;     // PENDING, VERIFIED, REQUIRES_REVIEW

    public OnboardingDraft() {
        this.id = UUID.randomUUID().toString();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getClientType() { return clientType; }
    public void setClientType(String clientType) { this.clientType = clientType; }

    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }

    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }

    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }

    public String getCompanyName() { return companyName; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }

    public String getTaxId() { return taxId; }
    public void setTaxId(String taxId) { this.taxId = taxId; }

    public Integer getNumEmployees() { return numEmployees; }
    public void setNumEmployees(Integer numEmployees) { this.numEmployees = numEmployees; }

    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }

    public String getAnnualRevenue() { return annualRevenue; }
    public void setAnnualRevenue(String annualRevenue) { this.annualRevenue = annualRevenue; }

    public String getDateOfBirth() { return dateOfBirth; }
    public void setDateOfBirth(String dateOfBirth) { this.dateOfBirth = dateOfBirth; }

    public String getGovernmentId() { return governmentId; }
    public void setGovernmentId(String governmentId) { this.governmentId = governmentId; }

    public String getPreferredContact() { return preferredContact; }
    public void setPreferredContact(String preferredContact) { this.preferredContact = preferredContact; }

    public String getOccupation() { return occupation; }
    public void setOccupation(String occupation) { this.occupation = occupation; }

    public String getRiskTolerance() { return riskTolerance; }
    public void setRiskTolerance(String riskTolerance) { this.riskTolerance = riskTolerance; }

    public String getInvestmentExperience() { return investmentExperience; }
    public void setInvestmentExperience(String investmentExperience) { this.investmentExperience = investmentExperience; }

    public String getInvestmentObjective() { return investmentObjective; }
    public void setInvestmentObjective(String investmentObjective) { this.investmentObjective = investmentObjective; }

    public String getAnnualIncome() { return annualIncome; }
    public void setAnnualIncome(String annualIncome) { this.annualIncome = annualIncome; }

    public String getNetWorth() { return netWorth; }
    public void setNetWorth(String netWorth) { this.netWorth = netWorth; }

    public String getSourceOfWealth() { return sourceOfWealth; }
    public void setSourceOfWealth(String sourceOfWealth) { this.sourceOfWealth = sourceOfWealth; }

    public String getDocumentType() { return documentType; }
    public void setDocumentType(String documentType) { this.documentType = documentType; }

    public String getDocumentNumber() { return documentNumber; }
    public void setDocumentNumber(String documentNumber) { this.documentNumber = documentNumber; }

    public String getIssuingCountry() { return issuingCountry; }
    public void setIssuingCountry(String issuingCountry) { this.issuingCountry = issuingCountry; }

    public String getDocumentExpiry() { return documentExpiry; }
    public void setDocumentExpiry(String documentExpiry) { this.documentExpiry = documentExpiry; }

    public String getVerificationStatus() { return verificationStatus; }
    public void setVerificationStatus(String verificationStatus) { this.verificationStatus = verificationStatus; }
}
