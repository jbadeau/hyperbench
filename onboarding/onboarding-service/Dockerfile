FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
COPY hyperbench/hyperbench-shared-service/pom.xml hyperbench/hyperbench-shared-service/
COPY hyperbench/hyperbench-hal-schema-forms-service/pom.xml hyperbench/hyperbench-hal-schema-forms-service/
COPY todos/todos-service/pom.xml todos/todos-service/
COPY clients/clients-service/pom.xml clients/clients-service/
COPY onboarding/onboarding-service/pom.xml onboarding/onboarding-service/
RUN mvn dependency:go-offline -pl onboarding/onboarding-service -am
COPY hyperbench/hyperbench-shared-service/ hyperbench/hyperbench-shared-service/
COPY hyperbench/hyperbench-hal-schema-forms-service/ hyperbench/hyperbench-hal-schema-forms-service/
COPY onboarding/onboarding-service/ onboarding/onboarding-service/
RUN mvn clean package -pl onboarding/onboarding-service -am -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=builder /app/onboarding/onboarding-service/target/*.jar app.jar
EXPOSE 8082
CMD ["java", "-jar", "app.jar"]
