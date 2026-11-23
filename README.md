# Backend — S.A.P.E. (API REST)

API desarrollada en **Node.js** y **Express** con persistencia en **MySQL** (`sape_db`), autenticación mediante **JSON Web Tokens (JWT)** y hash de contraseñas con **bcryptjs**.

## Requisitos previos

* **Node.js** (versión 18 o superior recomendada)
* **npm**
* **MySQL Server** ejecutándose en local (con la base `sape_db` creada desde el script SQL del `README.md` principal)

## Instalación

1. Abrí una terminal en la carpeta del backend e instalá las dependencias:
   ```bash
   npm install
   ```

2. Configurá las variables de entorno:
   * Si existe un archivo como `.env`:
   * Verificá que estén definidas las variables correspondientes a tu entorno (puerto del servidor, host/usuario/contraseña/nombre de base de datos MySQL, clave secreta de JWT y clave de servicio de IA si aplica).

## Ejecución

* **Modo desarrollo:**
  ```bash
  npm run dev
  ```
* **Modo producción / estándar:**
  ```bash
  npm start
  ```

Por defecto, el servidor queda escuchando en `http://localhost:3000`.

## Organización general

* `src/config/`: configuración de conexión a MySQL.
* `src/middlewares/`: validaciones de token JWT y autorización por rol (`administrador` / `empleado`).
* `src/routes/`: definición de endpoints REST.
* `src/controllers/`: lógica de negocio y consultas SQL preparadas (`db.execute`).