# syntax=docker/dockerfile:1.7
FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN --mount=type=cache,target=/root/.m2 mvn -pl config-server -am package -DskipTests

FROM eclipse-temurin:17-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /workspace/config-server/target/*.jar app.jar
EXPOSE 8888
ENTRYPOINT ["java", "-jar", "app.jar"]
