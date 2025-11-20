# ---------- Backend (Spring Boot) multi-stage Dockerfile ----------

# Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /workspace

# Cache dependencies first
COPY backend/pom.xml backend/pom.xml
RUN --mount=type=cache,target=/root/.m2 mvn -q -f backend/pom.xml -DskipTests dependency:go-offline

# Copy sources and build
COPY backend/src backend/src
RUN --mount=type=cache,target=/root/.m2 mvn -q -f backend/pom.xml -DskipTests package

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
ENV TZ=UTC \
    JAVA_OPTS=""
WORKDIR /app

# Create a data directory for H2 file-based DB
VOLUME ["/data"]

# Copy built jar
COPY --from=builder /workspace/backend/target/*.jar /app/app.jar

EXPOSE 8080

# Use exec form to allow signals; allow JAVA_OPTS overrides
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-8080} -jar /app/app.jar"]
