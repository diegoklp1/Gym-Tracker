import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const RUTINAS = [
  { id: 'push1', nombre: 'Push 1', subtitulo: 'Pecho, Hombros, Tríceps' },
  { id: 'pull1', nombre: 'Pull 1', subtitulo: 'Espalda, Bíceps' },
  { id: 'legs', nombre: 'Legs', subtitulo: 'Piernas completas' },
  { id: 'push2', nombre: 'Push 2', subtitulo: 'Enfoque secundario' },
  { id: 'pull2', nombre: 'Pull 2', subtitulo: 'Enfoque secundario' },
];

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* NUEVO ENCABEZADO CON BOTÓN DE CALENDARIO */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Rutina</Text>
        <TouchableOpacity onPress={() => router.push('./calendar')} style={styles.calendarButton}>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={RUTINAS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={styles.card} 
            activeOpacity={0.7}
            // Acá le decimos a la app que navegue a la ruta del día
            onPress={() => router.push(`../day/${item.id}`)}
          >
            <Text style={styles.cardTitle}>{item.nombre}</Text>
            <Text style={styles.cardSub}>{item.subtitulo}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginBottom: 20 },
  calendarButton: { backgroundColor: '#1E1E1E', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  calendarIcon: { fontSize: 20 },
  container: { flex: 1, backgroundColor: '#0A0A0A', paddingTop: 60 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF',letterSpacing: 1 },
  listContainer: { paddingHorizontal: 20 },
  card: { backgroundColor: '#171717', padding: 24, borderRadius: 16, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#BB86FC' },
  cardTitle: { color: '#FFF', fontSize: 22, fontWeight: '700', marginBottom: 4 },
  cardSub: { color: '#888', fontSize: 14, fontWeight: '500' },
});