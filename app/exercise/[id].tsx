import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, FlatList, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

// 1. Agregamos el flag isDropSet al tipo Serie
type Serie = { id: string; peso: string; reps: string; isDropSet?: boolean; };
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
  
  // 2. Nuevo estado para el botón de Drop Set
  const [isDropSet, setIsDropSet] = useState(false);
  
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
    
    // Guardamos la propiedad si el botón estaba activado
    const nuevaSerie: Serie = { id: Date.now().toString(), peso, reps, isDropSet };

    let nuevoHistorial = [...historial];
    const indice = nuevoHistorial.findIndex(s => s.id === idSesion);

    if (indice >= 0) {
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
    
    // Limpiamos los campos y apagamos el botón de drop set
    setPeso(''); 
    setReps(''); 
    setIsDropSet(false);
    Keyboard.dismiss();
  };

  const marcarComoFaltado = async () => {
    if (!fechaInput) return;

    const idSesion = fechaInput;
    const dateObj = new Date(`${fechaInput}T12:00:00`);
    const fechaLinda = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

    let nuevoHistorial = [...historial];
    const indice = nuevoHistorial.findIndex(s => s.id === idSesion);

    if (indice >= 0) {
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
    }).filter(sesion => sesion.series.length > 0 || sesion.faltado);

    setHistorial(nuevoHistorial);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nuevoHistorial));
  };

  const historialAscendente = [...historial].reverse();
  const chartLabels = historialAscendente.map(s => s.fechaFormateada.split(' ')[0]); 
  const chartData = historialAscendente.map(sesion => {
    if (sesion.faltado) return 0;
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
            width={screenWidth - 48} height={180} withInnerLines={false} withOuterLines={false} yAxisSuffix="k"
            chartConfig={{
              backgroundColor: '#0A0A0A', backgroundGradientFrom: '#0A0A0A', backgroundGradientTo: '#0A0A0A', decimalPlaces: 0,
              color: (opacity = 1) => `rgba(187, 134, 252, ${opacity})`, labelColor: (opacity = 1) => `rgba(136, 136, 136, ${opacity})`,
              style: { borderRadius: 16 }, propsForDots: { r: "5", strokeWidth: "2", stroke: "#0A0A0A" }
            }}
            bezier style={styles.chart}
          />
        </View>
      )}

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
        
        {/* 3. BOTONES: El de Drop Set y el de Guardar */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.dropButton, isDropSet && styles.dropButtonActive]} 
            onPress={() => setIsDropSet(!isDropSet)}
          >
            <Text style={[styles.dropButtonText, isDropSet && styles.dropButtonTextActive]}>↓ Drop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={guardarSerie}>
            <Text style={styles.saveButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={historial}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.timelineContainer}
        renderItem={({ item, index }) => (
          <View style={styles.timelineItem}>
            <View style={styles.timelineGraphic}>
              <View style={[styles.dot, item.faltado && { backgroundColor: '#CF6679' }]} />
              {index !== historial.length - 1 && <View style={styles.line} />}
            </View>

            <View style={styles.timelineContent}>
              <Text style={styles.dateText}>{item.fechaFormateada}</Text>
              
              {item.faltado ? (
                <View style={[styles.sessionCard, styles.missedCard]}>
                  <Text style={styles.missedText}>❌ Día salteado</Text>
                </View>
              ) : (
                <View style={styles.sessionCard}>
                  {/* 4. Lógica de numeración: Solo sumamos si no es Drop Set */}
                  {(() => {
                    let numeroReal = 0;
                    return item.series?.map((serie, i) => {
                      if (!serie.isDropSet) numeroReal++;
                      
                      return (
                        <TouchableOpacity 
                          key={serie.id} 
                          // Si es Drop Set, le aplicamos el estilo "pegado"
                          style={[styles.serieRow, serie.isDropSet && styles.dropSetRow]} 
                          onLongPress={() => confirmarBorrado(item.id, serie.id)} 
                          delayLongPress={400} 
                          activeOpacity={0.6}
                        >
                          <Text style={[styles.serieNumber, serie.isDropSet && styles.dropSetIcon]}>
                            {serie.isDropSet ? '↳' : numeroReal}
                          </Text>
                          <Text style={[styles.weightText, serie.isDropSet && styles.dropSetText]}>
                            {serie.peso} kg
                          </Text>
                          <Text style={[styles.repsText, serie.isDropSet && styles.dropSetText]}>
                            × {serie.reps}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
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
  // ... mantengo los estilos anteriores ...
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
  missButton: { marginLeft: 15, backgroundColor: '#1E1E1E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#CF6679' },
  missButtonText: { color: '#CF6679', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  inputSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, marginBottom: 25 },
  inputWrapper: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 5 },
  input: { color: '#FFF', fontSize: 32, fontWeight: '600', minWidth: 60, textAlign: 'center' },
  inputLabel: { color: '#666', fontSize: 16, marginLeft: 4, fontWeight: '500' },
  divider: { color: '#444', fontSize: 24, marginHorizontal: 15 },
  
  // Nuevo contenedor para alinear los botones
  actionButtons: { flexDirection: 'row', alignItems: 'center', marginLeft: 15 },
  
  dropButton: { backgroundColor: '#1A1A1A', paddingHorizontal: 10, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginRight: 10 },
  dropButtonActive: { backgroundColor: '#3b2a54', borderColor: '#BB86FC' }, // Violeta apagado
  dropButtonText: { color: '#666', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  dropButtonTextActive: { color: '#BB86FC' },

  saveButton: { backgroundColor: '#FFF', width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  saveButtonText: { color: '#0A0A0A', fontSize: 28, fontWeight: '400', marginTop: -2 },

  timelineContainer: { paddingHorizontal: 24, paddingBottom: 40 },
  timelineItem: { flexDirection: 'row' },
  timelineGraphic: { alignItems: 'center', width: 20, marginRight: 16 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#BB86FC', marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: '#222', marginTop: 4, marginBottom: -6 },
  timelineContent: { flex: 1, paddingBottom: 30 },
  dateText: { color: '#888', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: '600' },
  sessionCard: { backgroundColor: '#141414', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1F1F1F' },
  missedCard: { borderColor: '#331111', backgroundColor: '#1A0505', alignItems: 'center', paddingVertical: 20 },
  missedText: { color: '#CF6679', fontSize: 16, fontWeight: '600' },

  serieRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  serieNumber: { color: '#555', fontSize: 14, fontWeight: '700', width: 24 },
  weightText: { color: '#E5E5E5', fontSize: 18, fontWeight: '600', width: 80 },
  repsText: { color: '#AAA', fontSize: 16, fontWeight: '500' },

  // Estilos visuales del Drop Set (pegado al padre, letra gris, flechita)
  dropSetRow: { paddingTop: 0, paddingBottom: 8, marginLeft: 10 }, 
  dropSetIcon: { color: '#BB86FC', fontSize: 18, fontWeight: '400' },
  dropSetText: { color: '#888', fontSize: 15 },
});