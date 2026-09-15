# NEXO — Sistema de Préstamos Bancarios

Proyecto escolar realizado únicamente con **HTML, CSS y JavaScript**. No utiliza base de datos, frameworks ni backend.

## Cambios de esta versión

- En PC NEXO ocupa toda la pantalla.
- La navegación inferior aparece únicamente en celulares.
- En PC se usa navegación superior.
- Cada cliente tiene su propia cuenta y solo puede ver sus propios datos.
- El empleado tiene una cuenta separada.
- Datos de cliente solicitados al registrarse: nombre, DNI, correo, situación laboral, ingresos, antigüedad y documentación de ingresos.
- La solicitud de préstamo ya no vuelve a pedir DNI ni documentación: usa los datos registrados en la cuenta.
- El préstamo solicita tipo, monto, plazo y destino.
- Se agregan validaciones básicas para que no se pueda enviar cualquier valor.
- Se puede pagar una cuota o cancelar el préstamo de contado.

## Cuenta escolar de empleado

Correo: `empleado@nexo.com`

Contraseña: `nexo1234`

## Cliente de demostración

Correo: `demo@nexo.com`

Contraseña: `demo1234`

## Publicar en GitHub Pages

Subir `index.html`, `style.css` y `script.js` al repositorio y activar GitHub Pages desde Settings → Pages → Deploy from branch → rama principal → `/root`.

Los datos se guardan en `localStorage` del navegador. Para una aplicación real se necesitaría un backend y una base de datos.
