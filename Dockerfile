# ---- Stage 1: build the React front end ----
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY lootvault-frontend/package*.json ./
RUN npm install
COPY lootvault-frontend/ ./
RUN npm run build
# Output lands in /frontend/dist

# ---- Stage 2: build the Spring Boot jar ----
# Match this to whatever JDK your pom.xml targets (check <java.version> in pom.xml).
FROM eclipse-temurin:21-jdk AS backend-build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B
COPY src ./src
# Serve the React build as Spring's static content.
COPY --from=frontend-build /frontend/dist ./src/main/resources/static
RUN ./mvnw clean package -DskipTests -B

# ---- Stage 3: runtime ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app
COPY --from=backend-build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
 