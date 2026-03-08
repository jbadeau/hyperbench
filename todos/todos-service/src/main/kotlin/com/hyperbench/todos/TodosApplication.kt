package com.hyperbench.todos

import com.hyperbench.halschemaforms.mediatype.HalSchemaFormsConfiguration
import com.hyperbench.shared.context.WorkbenchContextFilter
import com.hyperbench.todos.config.HalFormsConfig
import com.hyperbench.todos.config.WebConfig
import com.hyperbench.todos.controller.UiSpecController
import org.springframework.boot.autoconfigure.EnableAutoConfiguration
import org.springframework.boot.SpringBootConfiguration
import org.springframework.boot.runApplication
import org.springframework.context.support.beans

@SpringBootConfiguration(proxyBeanMethods = false)
@EnableAutoConfiguration
class TodosApplication

val beans = beans {
    bean<WorkbenchContextFilter>()
    bean<HalSchemaFormsConfiguration>()
    bean<WebConfig>()
    bean<HalFormsConfig>()
    bean<UiSpecController>()
}

fun main(args: Array<String>) {
    runApplication<TodosApplication>(*args) {
        addInitializers(beans)
    }
}
