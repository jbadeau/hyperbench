FROM gcr.io/distroless/java21-debian12:nonroot
WORKDIR /app
COPY todos/todos-service/target/*.jar app.jar
EXPOSE 8081
CMD ["-jar", "app.jar"]
