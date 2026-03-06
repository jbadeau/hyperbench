package com.hyperbench.onboarding.repository;

import com.hyperbench.onboarding.domain.OnboardingDraft;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OnboardingDraftRepository extends JpaRepository<OnboardingDraft, String> {
}
