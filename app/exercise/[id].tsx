import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type Serie = { id: string; peso: string; reps: string; };
// 1. Agregamos el flag opcional 'faltado'
type Sesion = { id: string; fechaFormateada: string; series: Serie[]; faltado?: boolean; };

const screenWidth = Dimensions.get("window").width;

const NOMBRES_EJERCICIOS: Record<string, string> = {
  press_inclinado: 'Press Inclinado',
  press_plano: 'Press Plano',
  sentadillas: 'Sentadillas',
  dominadas: 'Dominadas',
};

export default function ExerciseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');
  const [historial, setHistorial] = useState<Sesion[]>([]);
  
  const hoyIso = new Date().toISOString().split('T')[0];
  const [fechaInput, setFechaInput] = useState(hoyIso);

  const storageKey = `@historial_v3_${id}`;
  const nombreMostrar = id && NOMBRES_EJERCICIOS[id] ? NOMBRES_EJERCICIOS[id] : (id as string).toUpperCase().replace('_', ' ');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const datos = await AsyncStorage.getItem(storageKey);
        if (datos) setHistorial(JSON.parse(datos));
      } catch (e) {}
    };
    cargarDatos();
  }, [id]);

  const guardarSerie = async () => {
    if (!peso || !reps || !fechaInput) return;

    const idSesion = fechaInput; 
    const dateObj = new Date(`${fechaInput}T12:00:00`); 
    const fechaLinda = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
    const nuevaSerie: Serie = { id: Date.now().toString(), peso, reps };

    let nuevoHistorial = [...historial];
    const indice = nuevoHistorial.findIndex(s => s.id === idSesion);

    if (indice >= 0) {
      // Si existía y estaba marcado como falta, lo "desmarcamos" porque ahora sí entrenó
      if (nuevoHistorial[indice].faltado) {
        nuevoHistorial[indice].faltado = false;
      }
      nuevoHistorial[indice].series.push(nuevaSerie);
    } else {
      nuevoHistorial.push({ id: idSesion, fechaFormateada: fechaLinda, series: [nuevaSerie] });
      nuevoHistorial.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
    }

    setHistorial(nuevoHistorial);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nuevoHistorial));
    setPeso(''); setReps(''); Keyboard.dismiss();
  };

  // 2. Nueva función para registrar la inasistencia
  const marcarComoFaltado = async () => {
    if (!fechaInput) return;

    const idSesion = fechaInput;
    const dateObj = new Date(`${fechaInput}T12:00:00`);
    const fechaLinda = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

    let nuevoHistorial = [...historial];
    const indice = nuevoHistorial.findIndex(s => s.id === idSesion);

    if (indice >= 0) {
      // Si ya tenía series anotadas ese día, le preguntamos si quiere sobreescribirlas con una falta
      Alert.alert(
        "Ya entrenaste este día",
        "Tenés series anotadas en esta fecha. ¿Querés borrarlas y marcar el día como faltado?",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Sí, falté", 
            style: "destructive", 
            onPress: async () => {
              nuevoHistorial[indice] = { id: idSesion, fechaFormateada: fechaLinda, series: [], faltado: true };
              setHistorial(nuevoHistorial);
              await AsyncStorage.setItem(storageKey, JSON.stringify(nuevoHistorial));
            }
          }
        ]
      );
      return;
    } else {
      // Registramos la falta directamente
      nuevoHistorial.push({ id: idSesion, fechaFormateada: fechaLinda, series: [], faltado: true });
      nuevoHistorial.sort((a, b) => new Date(b.id).getTime() - new Date(a.id).getTime());
      
      setHistorial(nuevoHistorial);
      await AsyncStorage.setItem(storageKey, JSON.stringify(nuevoHistorial));
    }
    Keyboard.dismiss();
  };

  const confirmarBorrado = (idSesion: string, idSerie: string) => {
    Alert.alert("Eliminar serie", "¿Seguro que querés borrar este registro?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar", style: "destructive", onPress: () => ejecutarBorrado(idSesion, idSerie) }
    ]);
  };

  const ejecutarBorrado = async (idSesion: string, idSerie: string) => {
    let nuevoHistorial = historial.map(sesion => {
      if (sesion.id === idSesion) {
        return { ...sesion, series: sesion.series.filter(s => s.id !== idSerie) };
      }
      return sesion;
    }).filter(sesion => sesion.series.length > 0 || sesion.faltado); // Evitamos borrar la sesión si es una inasistencia

    setHistorial(nuevoHistorial);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nuevoHistorial));
  };

  // El gráfico automáticamente procesará 0 si la serie está vacía gracias al .reduce
  const historialAscendente = [...historial].reverse();
  const chartLabels = historialAscendente.map(s => s.fechaFormateada.split(' ')[0]); 
  const chartData = historialAscendente.map(sesion => {
    if (sesion.faltado) return 0; // Si faltó, el volumen es 0
    return sesion.series.reduce((total, serie) => total + ((parseFloat(serie.peso) || 0) * (parseInt(serie.reps) || 0)), 0);
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{nombreMostrar}</Text>
      </View>

      {chartData.length > 0 && (
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Volumen Total (kg × reps)</Text>
          <LineChart
            data={{ labels: chartLabels.length > 0 ? chartLabels : [''], datasets: [{ data: chartData.length > 0 ? chartData : [0] }] }}
            width={screenWidth - 48} height={180} withInnerLines={false} withOuterLines={false}
            chartConfig={{
              backgroundColor: '#0A0A0A', backgroundGradientFrom: '#0A0A0A', backgroundGradientTo: '#0A0A0A', decimalPlaces: 0,
              color: (opacity = 1) => `rgba(187, 134, 252, ${opacity})`, labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
              style: { borderRadius: 16 }, propsForDots: { r: "5", strokeWidth: "2", stroke: "#0A0A0A" }
            }}
            bezier style={styles.chart}
          />
        </View>
      )}

      {/* Selector de fecha y botón de Faltar */}
      <View style={styles.dateSelector}>
        <Text style={styles.dateLabel}>Fecha:</Text>
        <TextInput style={styles.dateInput} value={fechaInput} onChangeText={setFechaInput} placeholder="YYYY-MM-DD" placeholderTextColor="#666" />
        
        <TouchableOpacity style={styles.missButton} onPress={marcarComoFaltado}>
          <Text style={styles.missButtonText}>Falté</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputSection}>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#444" keyboardType="numeric" value={peso} onChangeText={setPeso} />
          <Text style={styles.inputLabel}>kg</Text>
        </View>
        <Text style={styles.divider}>×</Text>
        <View style={styles.inputWrapper}>
          <TextInput style={styles.input} placeholder="0" placeholderTextColor="#444" keyboardType="numeric" value={reps} onChangeText={setReps} />
          <Text style={styles.inputLabel}>reps</Text>
        </View>
        <TouchableOpacity style={styles.saveButton} onPress={guardarSerie}><Text style={styles.saveButtonText}>+</Text></TouchableOpacity>
      </View>

      <FlatList
        data={historial}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.timelineContainer}
        renderItem={({ item, index }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timelineGraphic}>
              {/* Si faltó, cambiamos el color del puntito del timeline a rojo */}
              <View style={[styles.dot, item.faltado && { backgroundColor: '#CF6679' }]} />
              {index !== historial.length - 1 && <View style={styles.line} />}
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.dateText}>{item.fechaFormateada}</Text>
              
              {/* 3. Lógica visual: ¿Faltó o Entrenó? */}
              {item.faltado ? (
                <View style={[styles.sessionCard, styles.missedCard]}>
                  <Text style={styles.missedText}>❌ Día salteado</Text>
                </View>
              ) : (
                <View style={styles.sessionCard}>
                  {item.series?.map((serie, i) => (
                    <TouchableOpacity key={serie.id} style={styles.serieRow} onLongPress={() => confirmarBorrado(item.id, serie.id)} delayLongPress={400} activeOpacity={0.6}>
                      <Text style={styles.serieNumber}>{i + 1}</Text>
                      <Text style={styles.weightText}>{serie.peso} kg</Text>
                      <Text style={styles.repsText}>× {serie.reps}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (los estilos anteriores se mantienen y agregamos los de abajo)
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  backButton: { marginRight: 16 },
  backText: { color: '#888', fontSize: 28, fontWeight: '300', marginTop: -4 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#FFF', letterSpacing: 0.5, textTransform: 'capitalize' },
  
  chartContainer: { paddingHorizontal: 24, marginBottom: 15 },
  chartTitle: { color: '#888', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: '600' },
  chart: { borderRadius: 16, marginLeft: -15 },

  dateSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  dateLabel: { color: '#888', fontSize: 14, marginRight: 8, fontWeight: '600' },
  dateInput: { backgroundColor: '#1A1A1A', color: '#BB86FC', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, fontSize: 14, borderWidth: 1, borderColor: '#333' },
  
  // Estilo del botón de faltar
  missButton: { marginLeft: 15, backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#CF6679' },
  missButtonText: { color: '#CF6679', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  inputSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  input: { color: '#FFF', fontSize: 32, fontWeight: '600', minWidth: 60, textAlign: 'center' },
  inputLabel: { color: '#666', fontSize: 16, marginLeft: 4, fontWeight: '500' },
  divider: { color: '#444', fontSize: 24, marginHorizontal: 20 },
  saveButton: { backgroundColor: '#FFF', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginLeft: 20 },
  saveButtonText: { color: '#0A0A0A', fontSize: 28, fontWeight: '400', marginTop: -2 },

  timelineContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  timelineItem: { flexDirection: 'row' },
  timelineGraphic: { alignItems: 'center', width: 20, marginRight: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#BB86FC', marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: '#222', marginTop: 4, marginBottom: -6 },
  
  timelineContent: { flex: 1, paddingBottom: 30 },
  dateText: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: '600' },
  
  sessionCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1F1F1F' },
  
  // Estilo para la tarjeta de cuando faltaste
  missedCard: { borderColor: '#331111', backgroundColor: '#1A0505', alignItems: 'center', paddingVertical: 20 },
  missedText: { color: '#CF6679', fontSize: 16, fontWeight: '600' },

  serieRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  serieNumber: { color: '#555', fontSize: 14, fontWeight: '700', width: 24 },
  weightText: { color: '#E5E5E5', fontSize: 18, fontWeight: '600', width: 80 },
  repsText: { color: '#AAA', fontSize: 16, fontWeight: '500' },
});