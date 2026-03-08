package com.hyperbench.onboarding

import com.hyperbench.halschemaforms.mediatype.HalSchemaFormsConfiguration
import com.hyperbench.shared.context.WorkbenchContextFilter
import com.hyperbench.onboarding.config.WebConfig
import com.hyperbench.onboarding.controller.OnboardingUiController
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.SpringBootConfiguration
import org.springframework.boot.runApplication
import org.springframework.context.support.beans

@SpringBootConfiguration(proxyBeanMethods = false)
@EnableAutoConfiguration
class OnboardingApplication

val beans = beans {
    bean<WorkbenchContextFilter>()
    bean<HalSchemaFormsConfiguration>()
    bean<WebConfig>()
    bean<OnboardingUiController>()
}

fun main(args: Array<String>) {
    runApplication<OnboardingApplication>(*args) {
        addInitializers(beans)
    }
}
