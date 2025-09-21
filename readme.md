````markdown
# 🏥 Backend de Gestión de Citas Médicas

Este proyecto es una **API RESTful** desarrollada con **Node.js**, **Express** y **Prisma ORM**, que permite gestionar citas médicas, usuarios (pacientes, médicos, administradores) y disponibilidad de turnos. La base de datos está alojada en **Supabase (PostgreSQL)**.

---

## 🚀 Características principales

- Autenticación mediante **JWT**.
- Validación de entradas con **express-validator**.
- Gestión de **usuarios** (pacientes, médicos, administradores).
- Creación y consulta de **citas médicas**.
- Disponibilidad de **turnos por hospital**.
- Integración con **Prisma ORM** para consultas optimizadas.
- Arquitectura modular y escalable.
- Conexión con **Supabase** como servicio de base de datos.

---

## 📦 Requerimientos técnicos

- [Node.js](https://nodejs.org/) v18 o superior
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)
- [Prisma](https://www.prisma.io/) v5+
- [Supabase](https://supabase.com/) (PostgreSQL)

---

## ⚙️ Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/tuusuario/tu-repositorio.git
   cd tu-repositorio
````

2. Instalar dependencias:

   ```bash
   npm install
   ```

3. Configurar variables de entorno:

   Crea un archivo `.env` en la raíz del proyecto con la siguiente estructura:

   ```env
   DATABASE_URL="postgresql://usuario:password@host:puerto/base"
   DIRECT_URL="postgresql://usuario:password@host:puerto/base"
   JWT_SECRET="clave_super_segura"
   ```

   > ⚠️ Asegúrate de que la `DATABASE_URL` corresponda a la conexión de Supabase.

4. Generar el cliente de Prisma:

   ```bash
   npx prisma generate
   ```

5. Ejecutar migraciones en la base de datos:

   ```bash
   npx prisma migrate deploy
   ```

---

## ▶️ Uso

1. Iniciar el servidor en modo desarrollo:

   ```bash
   npm run dev
   ```

   El servidor estará disponible en:

   ```
   http://localhost:3000
   ```

2. Endpoints principales:

   * **Autenticación**

     * `POST /api/auth/login` → Iniciar sesión
     * `POST /api/auth/register` → Registrar usuario

   * **Citas**

     * `GET /api/citas/paciente?paciente_id=:id` → Listar citas de un paciente
     * `POST /api/citas` → Crear cita
     * `DELETE /api/citas/:id` → Cancelar cita

   * **Turnos**

     * `GET /api/turnos?hospital_id=:id` → Consultar turnos disponibles

---

## 🛠️ Scripts disponibles

* `npm run dev` → Inicia el servidor en modo desarrollo con **nodemon**.
* `npm run start` → Inicia el servidor en modo producción.
* `npx prisma studio` → Abre el panel gráfico de Prisma para gestionar la base de datos.

---

## 📖 Documentación

Este backend está diseñado siguiendo buenas prácticas de **REST API**, con middlewares de validación y autenticación. Los controladores se encuentran en la carpeta `controllers/`, las rutas en `routes/` y la configuración principal en `app.js`.

---

## 🤝 Contribución

1. Haz un fork del proyecto.
2. Crea una nueva rama: `git checkout -b feature/nueva-funcionalidad`.
3. Realiza tus cambios y haz commit: `git commit -m "Agrego nueva funcionalidad"`.
4. Haz push a tu rama: `git push origin feature/nueva-funcionalidad`.
5. Abre un **Pull Request**.

---

## 📄 Licencia

Este proyecto está bajo la licencia **MIT**. Puedes usarlo y modificarlo libremente.

---

```
```
