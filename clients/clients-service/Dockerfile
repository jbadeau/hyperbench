FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY clients/clients-service/target/*.jar app.jar
EXPOSE 8083
CMD ["-jar", "app.jar"]
