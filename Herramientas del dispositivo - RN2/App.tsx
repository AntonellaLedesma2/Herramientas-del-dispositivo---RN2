import { useEffect, useRef, useState } from 'react';
import { Alert, Image, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as LocalAuthentication from 'expo-local-authentication';

type Tool = 'home' | 'camera' | 'qr' | 'gps' | 'sensors' | 'biometric';
const tools: { id: Tool; icon: string; title: string; subtitle: string }[] = [
  { id: 'camera', icon: '📷', title: 'Cámara', subtitle: 'Vista previa en vivo' },
  { id: 'qr', icon: '▦', title: 'Lector QR', subtitle: 'Detecta códigos QR' },
  { id: 'gps', icon: '⌖', title: 'Ubicación GPS', subtitle: 'Coordenadas actuales' },
  { id: 'sensors', icon: '〰', title: 'Sensores', subtitle: 'Acelerómetro y giroscopio' },
  { id: 'biometric', icon: '◉', title: 'Biometría', subtitle: 'Huella o reconocimiento facial' },
];

export default function App() {
  const [screen, setScreen] = useState<Tool>('home');
  const cameraRef = useRef<CameraView>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [coords, setCoords] = useState<Location.LocationObjectCoords | null>(null);
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });
  const [gyro, setGyro] = useState({ x: 0, y: 0, z: 0 });
  const [scanned, setScanned] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [bioModal, setBioModal] = useState({ visible: false, success: false, title: '', message: '' });

  useEffect(() => {
    if (screen !== 'sensors') return;
    Accelerometer.setUpdateInterval(250);
    Gyroscope.setUpdateInterval(250);
    const a = Accelerometer.addListener(setAccel);
    const g = Gyroscope.addListener(setGyro);
    return () => { a.remove(); g.remove(); };
  }, [screen]);

  async function openCamera(mode: 'camera' | 'qr') {
    if (!cameraPermission?.granted) {
      const result = await requestCameraPermission();
      if (!result.granted) { Alert.alert('Permiso requerido', 'Activa el acceso a la cámara para continuar.'); return; }
    }
    setPhotoUri(null);
    setScreen(mode);
  }

  async function takePhoto() {
    try {
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.85 });
      if (photo?.uri) setPhotoUri(photo.uri);
    } catch {
      Alert.alert('No se pudo tomar la foto', 'Comprueba que la cámara esté disponible e inténtalo de nuevo.');
    }
  }

  async function getLocation() {
    setBusy(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permiso requerido', 'Activa la ubicación para consultar el GPS.'); return; }
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords(position.coords);
      setScreen('gps');
    } catch { Alert.alert('GPS no disponible', 'No se pudo obtener la ubicación. Revisa el GPS del dispositivo.'); }
    finally { setBusy(false); }
  }

  async function authenticate() {
    setBusy(true);
    try {
      const hardware = await LocalAuthentication.hasHardwareAsync();
      if (!hardware) { setBioModal({ visible: true, success: false, title: 'No disponible', message: 'Este dispositivo no tiene biometría compatible.' }); return; }
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) { setBioModal({ visible: true, success: false, title: 'Configura biometría', message: 'Registra tu huella o rostro en los ajustes del dispositivo.' }); return; }
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Verifica tu identidad', cancelLabel: 'Cancelar', fallbackLabel: 'Usar código del dispositivo' });
      setBioModal({ visible: true, success: result.success, title: result.success ? 'Verificación correcta' : 'Verificación cancelada', message: result.success ? 'La autenticación biométrica funcionó.' : 'No se pudo verificar la identidad.' });
    } catch {
      setBioModal({ visible: true, success: false, title: 'Error de verificación', message: 'No se pudo iniciar la autenticación biométrica.' });
    } finally { setBusy(false); }
  }

  const go = (id: Tool) => {
    if (id === 'camera' || id === 'qr') { setScanned(''); void openCamera(id); }
    else if (id === 'gps') void getLocation();
    else if (id === 'biometric') setScreen('biometric');
    else setScreen(id);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.header}><Text style={styles.brand}>EXPLORA<Text style={styles.brandAccent}>/</Text></Text><Text style={styles.headerTag}>LABORATORIO MÓVIL</Text></View>
      {screen !== 'home' && <Pressable style={styles.back} onPress={() => setScreen('home')}><Text style={styles.backText}>‹  Todos los módulos</Text></Pressable>}
      <ScrollView contentContainerStyle={styles.content}>
        {screen === 'home' ? <>
          <View style={styles.hero}><Text style={styles.kicker}>PROYECTO · SENSORES DEL DISPOSITIVO</Text><Text style={styles.title}>Tu teléfono,{ '\n' }por dentro.</Text><Text style={styles.description}>Explora las herramientas que convierten un móvil en un laboratorio interactivo.</Text><View style={styles.heroFoot}><View style={styles.dot}/><Text style={styles.live}>5 HERRAMIENTAS LISTAS</Text></View></View>
          <Text style={styles.section}>MÓDULOS <Text style={styles.muted}>/ TOCA PARA PROBAR</Text></Text>
          <View style={styles.grid}>{tools.map((tool, i) => <Pressable key={tool.id} style={[styles.card, i === 0 && styles.cardWide]} onPress={() => go(tool.id)}><View style={styles.cardTop}><Text style={styles.icon}>{tool.icon}</Text><Text style={styles.arrow}>↗</Text></View><Text style={styles.cardTitle}>{tool.title}</Text><Text style={styles.cardSubtitle}>{tool.subtitle}</Text></Pressable>)}</View>
          <Text style={styles.note}>Algunas funciones solicitan permiso cuando las abres. Tus datos se quedan en el dispositivo.</Text>
        </> : <>
          <Text style={styles.kicker}>MÓDULO ACTIVO</Text>
          {screen === 'camera' && <><Text style={styles.pageTitle}>Cámara</Text><Text style={styles.description}>Vista previa de la cámara trasera del dispositivo.</Text>{photoUri ? <Image source={{ uri: photoUri }} style={styles.camera} /> : <CameraView ref={cameraRef} style={styles.camera} facing="back" />}{photoUri ? <Button label="Tomar otra foto" onPress={() => setPhotoUri(null)} /> : <Button label="Sacar foto" onPress={() => void takePhoto()} />}</>}
          {screen === 'qr' && <><Text style={styles.pageTitle}>Lector QR</Text><Text style={styles.description}>Apunta al código para leer su contenido.</Text><CameraView ref={cameraRef} style={styles.camera} facing="back" barcodeScannerSettings={{ barcodeTypes: ['qr'] }} onBarcodeScanned={({ data }) => setScanned(data)} /><View style={styles.result}><Text style={styles.resultLabel}>RESULTADO</Text><Text style={styles.resultValue}>{scanned || 'Esperando un código QR…'}</Text></View></>}
          {screen === 'gps' && <><Text style={styles.pageTitle}>Ubicación GPS</Text><Text style={styles.description}>Posición obtenida con el permiso en primer plano.</Text><View style={styles.panel}><Text style={styles.resultLabel}>LATITUD</Text><Text style={styles.coordinate}>{coords?.latitude.toFixed(6) ?? '—'}</Text><Text style={styles.resultLabel}>LONGITUD</Text><Text style={styles.coordinate}>{coords?.longitude.toFixed(6) ?? '—'}</Text><Text style={styles.description}>Precisión aproximada: {coords?.accuracy ? `${Math.round(coords.accuracy)} m` : '—'}</Text></View><Button label={busy ? 'Consultando…' : 'Actualizar ubicación'} onPress={() => void getLocation()} /></>}
          {screen === 'sensors' && <><Text style={styles.pageTitle}>Movimiento</Text><Text style={styles.description}>Datos en vivo del acelerómetro y el giroscopio.</Text><SensorPanel title="ACELERÓMETRO · m/s²" value={accel} /><SensorPanel title="GIROSCOPIO · rad/s" value={gyro} /></>}
          {screen === 'biometric' && <><Text style={styles.pageTitle}>Biometría</Text><Text style={styles.description}>Autentícate con la huella o el rostro configurados en tu teléfono.</Text><View style={styles.panel}><Text style={styles.bioIcon}>◉</Text><Text style={styles.cardTitle}>Identidad del dispositivo</Text><Text style={styles.cardSubtitle}>La app no almacena datos biométricos.</Text></View><Button label={busy ? 'Verificando…' : 'Iniciar verificación'} onPress={() => void authenticate()} /></>}
        </>}
      </ScrollView>
      <View style={styles.footer}><Text style={styles.footerText}>EXPO · HERRAMIENTAS NATIVAS</Text><Text style={styles.footerText}>01 / 05</Text></View>
      <Modal transparent visible={bioModal.visible} animationType="fade" onRequestClose={() => setBioModal(current => ({ ...current, visible: false }))}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><Text style={styles.modalIcon}>{bioModal.success ? '✓' : '◉'}</Text><Text style={styles.modalTitle}>{bioModal.title}</Text><Text style={styles.modalMessage}>{bioModal.message}</Text><Pressable style={styles.button} onPress={() => setBioModal(current => ({ ...current, visible: false }))}><Text style={styles.buttonText}>Entendido</Text></Pressable></View></View>
      </Modal>
    </SafeAreaView>
  );
}

function Button({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={styles.button}><Text style={styles.buttonText}>{label}  ↗</Text></Pressable>; }
function SensorPanel({ title, value }: { title: string; value: { x: number; y: number; z: number } }) { return <View style={styles.panel}><Text style={styles.resultLabel}>{title}</Text><View style={styles.axisRow}>{(['x', 'y', 'z'] as const).map(axis => <View key={axis} style={styles.axis}><Text style={styles.axisName}>{axis.toUpperCase()}</Text><Text style={styles.axisValue}>{value[axis].toFixed(2)}</Text></View>)}</View></View>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0D0C' }, header: { height: 64, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#202724' }, brand: { color: '#F3F4EF', fontSize: 16, fontWeight: '900', letterSpacing: 2 }, brandAccent: { color: '#C6F36A' }, headerTag: { color: '#77817B', fontSize: 9, letterSpacing: 1.5, fontWeight: '700' }, content: { padding: 22, paddingBottom: 30 }, hero: { padding: 22, backgroundColor: '#151B17', borderWidth: 1, borderColor: '#29342C', borderRadius: 20, marginBottom: 30 }, kicker: { color: '#C6F36A', fontSize: 9, fontWeight: '800', letterSpacing: 1.4, marginBottom: 16 }, title: { color: '#F3F4EF', fontSize: 38, lineHeight: 41, letterSpacing: -1.6, fontWeight: '800' }, description: { color: '#A1AAA4', fontSize: 13, lineHeight: 20, marginTop: 11, marginBottom: 18 }, heroFoot: { marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 8 }, dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#C6F36A' }, live: { color: '#C6F36A', fontSize: 9, letterSpacing: 1.2, fontWeight: '800' }, section: { color: '#F3F4EF', fontSize: 10, letterSpacing: 1.4, fontWeight: '800', marginBottom: 12 }, muted: { color: '#657069', fontWeight: '600' }, grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, card: { width: '48%', minHeight: 132, padding: 15, borderRadius: 15, backgroundColor: '#141916', borderWidth: 1, borderColor: '#242D27', flexGrow: 1 }, cardWide: { width: '100%', minHeight: 118 }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }, icon: { fontSize: 23, color: '#C6F36A' }, arrow: { color: '#68736C', fontSize: 16 }, cardTitle: { color: '#F3F4EF', fontSize: 15, fontWeight: '700' }, cardSubtitle: { color: '#839088', fontSize: 10, marginTop: 5 }, note: { color: '#6E7972', fontSize: 10, lineHeight: 15, marginTop: 20 }, footer: { height: 42, borderTopWidth: 1, borderTopColor: '#202724', paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, footerText: { color: '#647069', fontSize: 8, letterSpacing: 1.1, fontWeight: '700' }, back: { paddingHorizontal: 22, paddingTop: 16 }, backText: { color: '#C6F36A', fontSize: 12, fontWeight: '700' }, pageTitle: { color: '#F3F4EF', fontSize: 31, fontWeight: '800', letterSpacing: -1, marginTop: 2 }, camera: { width: '100%', height: 370, borderRadius: 18, overflow: 'hidden', backgroundColor: '#151B17' }, result: { backgroundColor: '#151B17', borderRadius: 14, padding: 16, marginTop: 14 }, resultLabel: { color: '#91A097', fontSize: 9, letterSpacing: 1.3, fontWeight: '800' }, resultValue: { color: '#F3F4EF', fontSize: 14, marginTop: 8 }, panel: { padding: 18, borderRadius: 16, backgroundColor: '#151B17', borderWidth: 1, borderColor: '#29342C', marginTop: 12, marginBottom: 12 }, coordinate: { color: '#C6F36A', fontSize: 27, fontWeight: '800', marginTop: 5, marginBottom: 15 }, button: { padding: 16, backgroundColor: '#C6F36A', borderRadius: 13, alignItems: 'center', marginTop: 8 }, buttonText: { color: '#11150F', fontSize: 13, fontWeight: '800' }, axisRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }, axis: { alignItems: 'center', flex: 1 }, axisName: { color: '#829087', fontSize: 10, fontWeight: '800' }, axisValue: { color: '#F3F4EF', fontSize: 20, fontWeight: '700', marginTop: 7 }, bioIcon: { color: '#C6F36A', fontSize: 34, marginBottom: 12 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 28 }, modalCard: { width: '100%', padding: 24, borderRadius: 20, backgroundColor: '#151B17', borderWidth: 1, borderColor: '#39463C', alignItems: 'center' }, modalIcon: { color: '#C6F36A', fontSize: 34, fontWeight: '800', marginBottom: 12 }, modalTitle: { color: '#F3F4EF', fontSize: 20, fontWeight: '800', textAlign: 'center' }, modalMessage: { color: '#A1AAA4', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, marginBottom: 14 } });
