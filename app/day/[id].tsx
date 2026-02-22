import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image, ImageSourcePropType, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Diccionario de ejercicios según el día
// Reemplazá solo esta parte en tu app/day/[id].tsx
const EJERCICIOS_POR_DIA: Record<string, { id: string; nombre: string; imagen: ImageSourcePropType }[]> = {
  push1: [
    { id: 'press_inclinado', nombre: 'Press Pecho Inclinado', imagen: require('../../assets/images/1_press_inclinado.png') },
    { id: 'press_plano', nombre: 'Press Pecho Acostado', imagen: require('../../assets/images/1_press_plano.png') },
    { id: 'laterales', nombre: 'Elevaciones Laterales', imagen: require('../../assets/images/1_laterales.png') },
    { id: 'press_militar', nombre: 'Press Militar', imagen: require('../../assets/images/1_press_militar.png') },
    { id: 'tricep_polea', nombre: 'Extensión Tríceps Polea', imagen: require('../../assets/images/1_tricep_polea_cuerda.png') },
    { id: 'tricep_mancuerna', nombre: 'Extensión Tríceps Mancuerna', imagen: require('../../assets/images/1_tricep_mancuerna_trasnuca.png') },
  ],
  pull1: [
    { id: 'jalon_pecho', nombre: 'Jalón al Pecho', imagen: require('../../assets/images/2_jalon_pecho.png') },
    { id: 'remo_barra', nombre: 'Remo con Barra', imagen: require('../../assets/images/2_remo_cerrado.png') },
    { id: 'encogimiento_hombros', nombre: 'Encogimiento de Hombros', imagen: require('../../assets/images/2_encogimiento_hombros.png') },
    { id: 'curl_barra', nombre: 'Curl de Bíceps con Barra', imagen: require('../../assets/images/2_curl_barra.png') },
    { id: 'curl_martillo', nombre: 'Curl Martillo', imagen: require('../../assets/images/2_curl_martillo.png') },
  ],
  legs: [
    { id: 'prensa', nombre: 'Prensa Inclinada', imagen: require('../../assets/images/3_prensa_inclinada.png') },
    { id: 'sentadillas', nombre: 'Sentadillas', imagen: require('../../assets/images/3_prensa_sentadilla.png') },
    { id: 'extension_cuadriceps', nombre: 'Extensión de Cuádriceps', imagen: require('../../assets/images/3_curl_cuadriceps.png') },
    { id: 'curl_isquios', nombre: 'Curl de Femorales', imagen: require('../../assets/images/3_curl_femorales.png') },
    { id: 'gemelos', nombre: 'Elevación de Gemelos', imagen: require('../../assets/images/3_gemelos.png') },
  ],
  push2: [
    { id: 'press_inclinado', nombre: 'Press Pecho Inclinado', imagen: require('../../assets/images/1_press_inclinado.png') },
    { id: 'press_plano', nombre: 'Press Pecho Acostado', imagen: require('../../assets/images/1_press_plano.png') },
    { id: 'laterales', nombre: 'Elevaciones Laterales', imagen: require('../../assets/images/1_laterales.png') },
    { id: 'press_militar', nombre: 'Press Militar', imagen: require('../../assets/images/1_press_inclinado.png') },
    { id: 'tricep_polea', nombre: 'Extensión Tríceps Polea', imagen: require('../../assets/images/1_tricep_polea_cuerda.png') },
    { id: 'tricep_mancuerna', nombre: 'Extensión Tríceps Mancuerna', imagen: require('../../assets/images/1_tricep_mancuerna_trasnuca.png') },
  ],
  pull2: [
    { id: 'jalon_pecho', nombre: 'Jalón al Pecho', imagen: require('../../assets/images/2_jalon_pecho.png') },
    { id: 'remo_barra', nombre: 'Remo con Barra', imagen: require('../../assets/images/2_remo_cerrado.png') },
    { id: 'encogimiento_hombros', nombre: 'Encogimiento de Hombros', imagen: require('../../assets/images/2_encogimiento_hombros.png') },
    { id: 'curl_barra', nombre: 'Curl de Bíceps con Barra', imagen: require('../../assets/images/2_curl_barra.png') },
    { id: 'curl_martillo', nombre: 'Curl Martillo', imagen: require('../../assets/images/2_curl_martillo.png') },
  ],
};
export default function DayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const router = useRouter();
  
  const ejercicios = id ? EJERCICIOS_POR_DIA[id] : [];
  const nombreDia = id ? id.toUpperCase() : 'DÍA';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{nombreDia}</Text>

      {ejercicios?.map((ejercicio) => (
        <TouchableOpacity 
          key={ejercicio.id} 
          style={styles.exerciseCard}
          activeOpacity={0.7}
          onPress={() => router.push(`/exercise/${ejercicio.id}`)}
        >
          <View style={styles.cardTextContainer}>
            <Text style={styles.exerciseName}>{ejercicio.nombre}</Text>
            <Text style={styles.viewHistory}>Ver historial →</Text>
          </View>

          <View style={styles.imageContainer}>
             {/* 2. Le pasamos el "require" directamente al source, sin las llaves de { uri: ... } */}
             <Image 
               source={ejercicio.imagen} 
               style={styles.exerciseImage} 
               resizeMode="cover"
             />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  backButton: { marginBottom: 20 },
  backText: { color: '#888', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 30, letterSpacing: 1 },
  
  exerciseCard: { 
    backgroundColor: '#171717', 
    borderRadius: 16, 
    marginBottom: 16, 
    flexDirection: 'row', 
    overflow: 'hidden', 
    borderWidth: 1,
    borderColor: '#222'
  },
  
  cardTextContainer: { flex: 1, padding: 20, justifyContent: 'center' },
  exerciseName: { color: '#E5E5E5', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  viewHistory: { color: '#BB86FC', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  imageContainer: { width: 100, backgroundColor: '#111' },
  exerciseImage: { width: '100%', height: '100%' },
});