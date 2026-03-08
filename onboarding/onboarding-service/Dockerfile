FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY onboarding/onboarding-service/target/*.jar app.jar
EXPOSE 8082
CMD ["-jar", "app.jar"]
