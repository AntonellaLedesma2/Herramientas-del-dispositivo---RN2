# Explora Dispositivo

Aplicación de ejemplo en Expo para demostrar funciones nativas del teléfono: cámara, lectura de QR, ubicación GPS en primer plano, acelerómetro, giroscopio y autenticación biométrica.

## Preparar el entorno

Instala Node.js LTS y abre una terminal en esta carpeta. Luego instala las dependencias compatibles con el SDK de Expo:

```bash
npm install
npx expo install --fix
```

Inicia el servidor de desarrollo:

```bash
npx expo start --clear
```

Escanea el QR de Expo Go o abre el proyecto en un emulador Android. El proyecto usa Expo SDK 57 para ser compatible con Expo Go disponible en iOS. Para cámara, QR, GPS y sensores es preferible probar en un teléfono real; el dispositivo debe tener esos sensores y permisos habilitados. Face ID no está disponible en Expo Go para iOS; para probarlo hace falta un development build.

## Generar el APK con EAS

1. Inicia sesión o crea una cuenta en Expo: `npx eas-cli login`.
2. Vincula esta app con tu cuenta una sola vez: `npx eas-cli build:configure`.
3. Genera el APK de prueba:

```bash
npx eas-cli build --platform android --profile preview
```

Cuando la compilación remota termine, Expo mostrará un enlace para descargar el archivo `.apk`. Ábrelo en Android para instalarlo. La primera compilación puede pedir que EAS cree las credenciales de firma.

El perfil `preview` de `eas.json` está configurado para APK de distribución interna. Para volver a compilar, ejecuta el mismo comando. Si el docente solicita un identificador único, cambia `android.package` en `app.json` antes de vincular EAS.

## Qué demuestra cada módulo

- **Cámara:** solicita permiso y muestra la cámara trasera.
- **Lector QR:** usa la vista de cámara y devuelve el texto del código detectado.
- **GPS:** solicita ubicación mientras se usa la app y muestra latitud, longitud y precisión.
- **Acelerómetro y giroscopio:** presenta los valores de los tres ejes en tiempo real; deja de escuchar sensores al salir del módulo.
- **Biometría:** verifica que haya hardware y biometría registrada, luego abre el diálogo nativo del dispositivo.

Los permisos se solicitan al abrir la herramienta correspondiente. No se guardan coordenadas ni datos biométricos.

## Biometría en Expo Go

La app se puede abrir normalmente con Expo Go. En iOS, Expo Go no permite probar Face ID; ese módulo muestra su resultado, pero la autenticación Face ID real requiere una app nativa de desarrollo. En Android, prueba el módulo con la biometría configurada en el dispositivo.
