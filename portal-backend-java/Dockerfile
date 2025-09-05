FROM maven:3.9-openjdk-17 AS build

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

FROM openjdk:17-jdk-slim

WORKDIR /app

# Create data directory
RUN mkdir -p data

# Copy the JAR file
COPY --from=build /app/target/portal-backend-1.0.0.jar app.jar

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]