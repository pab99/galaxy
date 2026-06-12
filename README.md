# Galaxias de Catamarca
**Sistema interactivo multiusuario — Tecnoincas**

## Archivos

| Archivo | Descripción |
|---------|-------------|
| `public/main.html` | Pantalla del proyector / pantalla grande |
| `public/usuario.html` | App del celular (acceso por QR) |
| `public/control.html` | Panel del operador |
| `server.js` | Backend Node.js + Socket.io |

---

## Instalación local

```bash
npm install
npm start
# → http://localhost:3000
```

---

## Deploy en Render.com

1. Crear nuevo **Web Service** en [render.com](https://render.com)
2. Conectar el repo de GitHub
3. Configurar:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Environment:** Node
4. Una vez deployado, la URL será algo como `https://galaxias-catamarca.onrender.com`

### URLs del sistema
- Proyector: `https://tu-app.onrender.com/main.html`
- Visitantes: `https://tu-app.onrender.com/usuario.html`
- Control: `https://tu-app.onrender.com/control.html`

El QR en `main.html` se genera automáticamente apuntando a `/usuario.html`.

---

## Flujo de uso en un evento

1. Abrir `main.html` en la PC conectada al proyector (fullscreen con F11)
2. El QR aparece en la esquina inferior derecha
3. Los visitantes escanean el QR con su celular
4. Ingresan su Instagram y acceden al pad táctil
5. Al tocar cualquier punto del pad, el proyector hace warp hacia ese punto
6. Aparecen planetas y nebulosas con nombres de ciudades de Catamarca
7. El operador puede ajustar velocidad, colores y ver la lista de visitantes en `control.html`
8. Exportar CSV con los Instagrams desde el panel de control

---

## Variables de entorno opcionales

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto del servidor (default: 3000) |
| `RENDER_EXTERNAL_URL` | URL pública (Render lo setea automáticamente, se usa para keep-alive) |
