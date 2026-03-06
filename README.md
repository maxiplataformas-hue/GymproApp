# Gympro App 🏋️‍♂️

Aplicativo web completo para gimnasios y entrenadores personales (Coach) para gestionar el progreso físico de sus alumnos (Students), rutinas de ejercicio y comunicación mediante un chat con Inteligencia Artificial.


prueba

## Tecnologías Utilizadas 💻

Este repositorio es un **Monorepo** que contiene tanto el Frontend como el Backend de la aplicación.

### **Frontend (`/gympro`)**
*   **Framework:** Angular 19+ (Standalone Components, Señales)
*   **Estilos:** Tailwind CSS
*   **Gestión de Estado:** Señales Nativas (Signals) de Angular
*   **Componentes Adicionales:** ng2-charts (Gráficos), FontAwesome (Iconos)

### **Backend (`/gympro-API`)**
*   **Framework:** Spring Boot 3.4.0 (Java 17)
*   **Base de Datos:** MongoDB Atlas (Cloud)
*   **Características:** RESTful API estructurada en Controladores, Servicios y Repositorios.

---

## 🚀 Cómo ejecutar el proyecto localmente

### 1. Requisitos Previos
*   [Node.js](https://nodejs.org/) (versión 18 o superior)
*   [Java Development Kit (JDK) 17](https://adoptium.net/)
*   [Maven](https://maven.apache.org/) (opcional, Spring Boot incluye un wrapper)

### 2. Ejecutar el Backend (Spring Boot)
Abre una terminal y navega a la carpeta del backend:
```bash
cd gympro-API
```
Ejecuta la aplicación usando Maven:
```bash
./mvnw spring-boot:run
```
*(El servidor se iniciará en `http://localhost:8080`)*

### 3. Ejecutar el Frontend (Angular)
Abre otra pestaña en tu terminal y navega a la carpeta del frontend:
```bash
cd gympro
```
Instala las dependencias y arranca el servidor de desarrollo:
```bash
npm install
npm start
```
*(La aplicación web estará disponible en `http://localhost:4200`)*

---

## 🌍 Cómo desplegar la API en Render (Gratis)

Al ser un monorepo, Render necesita saber que la API está dentro de la subcarpeta `gympro-API`. 

1. Ve a [Render.com](https://render.com) y crea un nuevo **Web Service**.
2. Selecciona **Build and deploy from a Git repository** y conecta este repositorio.
3. En la configuración del servicio, completa los siguientes campos:
    *   **Name:** `gympro-api`
    *   **Root Directory:** `gympro-API` 
    *   **Environment:** `Docker` (Render leerá automáticamente el archivo `Dockerfile` de esa carpeta).
    *   **Instance Type:** Free ($0)
4. En la sección **Advanced**, añade esta Variable de Entorno (Environment Variable):
    *   **Key:** `SPRING_DATA_MONGODB_URI`
    *   **Value:** `TU_URI_DE_MONGODB` (ej: `mongodb+srv://.../gympro?retryWrites=true&w=majority`)
5. Haz clic en **Create Web Service**. ¡Y listo! Espera a que termine de construir la imagen de Docker.

---

## 📝 Reglas de Negocio / Roles

La aplicación funciona con un sistema de login sencillo basado en el correo electrónico.
*   **Coach (Entrenador):** Ingresa con el correo `maxiplataformas@gmail.com` para acceder al panel de administración de estudiantes.
*   **Student (Alumno):** Ingresa con cualquier otro correo electrónico. Si es la primera vez, el sistema solicitará sus datos iniciales (Ficha de Onboarding).
