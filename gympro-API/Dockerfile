# Etapa 1: Build (Construcción)
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
# Descarga las dependencias de Maven
RUN mvn dependency:go-offline

COPY src ./src
# Compila el proyecto saltando los tests para un despliegue más rápido
RUN mvn clean package -DskipTests

# Etapa 2: Run (Ejecución)
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Copia el archivo .jar compilado desde la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Expone el puerto que usa Spring Boot (8080)
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
