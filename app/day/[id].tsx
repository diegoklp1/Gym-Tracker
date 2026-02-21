import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// Diccionario de ejercicios según el día
// Reemplazá solo esta parte en tu app/day/[id].tsx
const EJERCICIOS_POR_DIA: Record<string, { id: string; nombre: string }[]> = {
  push1: [
    { id: 'press_inclinado', nombre: 'Press Pecho Inclinado' },
    { id: 'press_plano', nombre: 'Press Pecho Acostado' },
    { id: 'laterales', nombre: 'Elevaciones Laterales' },
    { id: 'frontales', nombre: 'Elevaciones Frontales' },
    { id: 'tricep_polea', nombre: 'Extensión Tríceps Polea' },
    { id: 'tricep_mancuerna', nombre: 'Extensión Tríceps Mancuerna' },
  ],
  pull1: [
    { id: 'dominadas', nombre: 'Dominadas' },
    { id: 'remo_barra', nombre: 'Remo con Barra' },
    { id: 'jalon_pecho', nombre: 'Jalón al Pecho' },
    { id: 'curl_barra', nombre: 'Curl de Bíceps con Barra' },
    { id: 'curl_martillo', nombre: 'Curl Martillo' },
  ],
  legs: [
    { id: 'sentadillas', nombre: 'Sentadillas' },
    { id: 'prensa', nombre: 'Prensa Inclinada' },
    { id: 'peso_muerto_rumano', nombre: 'Peso Muerto Rumano' },
    { id: 'extension_cuadriceps', nombre: 'Extensión de Cuádriceps' },
    { id: 'curl_isquios', nombre: 'Curl de Isquiotibiales' },
    { id: 'gemelos', nombre: 'Elevación de Gemelos' },
  ],
  push2: [
    { id: 'press_militar', nombre: 'Press Militar con Barra' },
    { id: 'fondos', nombre: 'Fondos en Paralelas' },
    { id: 'cruces_polea', nombre: 'Cruces en Polea' },
    { id: 'laterales_polea', nombre: 'Laterales en Polea' },
    { id: 'tricep_copa', nombre: 'Tríceps Copa' },
  ],
  pull2: [
    { id: 'dominadas_supinas', nombre: 'Dominadas Supinas (Chin-ups)' },
    { id: 'remo_polea_baja', nombre: 'Remo en Polea Baja' },
    { id: 'pullover_polea', nombre: 'Pullover en Polea' },
    { id: 'curl_predicador', nombre: 'Curl Predicador' },
    { id: 'face_pulls', nombre: 'Face Pulls' },
  ],
};

export default function DayScreen() {
  // Capturamos el ID de la URL (ej: "push1")
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
          // Próximo paso: navegar al historial del ejercicio
          onPress={() => router.push(`../exercise/${ejercicio.id}`)}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.exerciseName}>{ejercicio.nombre}</Text>
            <Text style={styles.arrow}>→</Text>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 20 },
  backText: { color: '#888', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 30, letterSpacing: 1 },
  exerciseCard: { backgroundColor: '#171717', padding: 20, borderRadius: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  exerciseName: { color: '#E5E5E5', fontSize: 18, fontWeight: '600' },
  arrow: { color: '#BB86FC', fontSize: 20 },
});