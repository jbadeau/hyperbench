package com.hyperbench.clients

import com.hyperbench.halschemaforms.mediatype.HalSchemaFormsConfiguration
import com.hyperbench.shared.context.WorkbenchContextFilter
import com.hyperbench.clients.config.HalFormsConfig
import com.hyperbench.clients.config.WebConfig
import com.hyperbench.clients.controller.ClientUiController
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.SpringBootConfiguration
import org.springframework.boot.runApplication
import org.springframework.context.support.beans

@SpringBootConfiguration(proxyBeanMethods = false)
@EnableAutoConfiguration
class ClientsApplication

val beans = beans {
    bean<WorkbenchContextFilter>()
    bean<HalSchemaFormsConfiguration>()
    bean<WebConfig>()
    bean<HalFormsConfig>()
    bean<ClientUiController>()
}

fun main(args: Array<String>) {
    runApplication<ClientsApplication>(*args) {
        addInitializers(beans)
    }
}
