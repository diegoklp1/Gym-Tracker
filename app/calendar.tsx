import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configuramos el calendario en Español
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar', 'Abr', 'May', 'Jun', 'Jul.', 'Ago', 'Sept.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

export default function CalendarScreen() {
  const router = useRouter();
  
  // Fecha de inicio por defecto (10 de febrero de 2026) y el input para cambiarla
  const [fechaInicio, setFechaInicio] = useState('2026-02-10');
  const [inputFecha, setInputFecha] = useState('2026-02-10');
  
  const [fechasMarcadas, setFechasMarcadas] = useState<any>({});

  // Analizamos el historial de actividad cada vez que entramos a esta pantalla
  useFocusEffect(
    useCallback(() => {
      analizarActividad();
    }, [fechaInicio])
  );

  const analizarActividad = async () => {
    try {
      // 1. Buscamos TODAS las llaves guardadas en el teléfono
      const keys = await AsyncStorage.getAllKeys();
      // Filtramos solo las que son historiales de ejercicios
      const exerciseKeys = keys.filter(k => k.startsWith('@historial_v3_'));
      
      // 2. Traemos todos esos datos
      const allData = await AsyncStorage.multiGet(exerciseKeys);
      
      // 3. Creamos un "Set" (lista de valores únicos) con los días que el usuario entrenó
      let diasConActividad = new Set<string>();

      allData.forEach(([key, value]) => {
        if (value) {
          const historialEjercicio = JSON.parse(value);
          historialEjercicio.forEach((sesion: any) => {
            // Si la sesión tiene series anotadas, significa que ese día entrenó
            if (sesion.series && sesion.series.length > 0) {
              diasConActividad.add(sesion.id); // session.id es "YYYY-MM-DD"
            }
          });
        }
      });

      // 4. Generamos los marcadores desde fechaInicio hasta HOY
      const hoy = new Date().toISOString().split('T')[0]; // Ej: "2026-02-22"
      let marcas: any = {};
      
      let fechaActual = new Date(`${fechaInicio}T12:00:00`);
      const fechaLimite = new Date(`${hoy}T12:00:00`);

      while (fechaActual <= fechaLimite) {
        const dateStr = fechaActual.toISOString().split('T')[0];

        if (diasConActividad.has(dateStr)) {
          // Día Asistido (Violeta)
          marcas[dateStr] = {
            customStyles: {
              container: { backgroundColor: '#86fca5', borderRadius: 8 },
              text: { color: '#0A0A0A', fontWeight: 'bold' }
            }
          };
        } else {
          // Día Faltado (Rojo oscuro)
          marcas[dateStr] = {
            customStyles: {
              container: { backgroundColor: '#CF6679', borderRadius: 8, opacity: 0.8 },
              text: { color: '#0A0A0A', fontWeight: 'bold' }
            }
          };
        }
        
        // Sumamos un día para seguir el loop
        fechaActual.setDate(fechaActual.getDate() + 1);
      }

      setFechasMarcadas(marcas);
    } catch (error) {
      console.error("Error analizando calendario", error);
    }
  };

  const actualizarInicio = () => {
    // Validamos que el formato sea correcto básico antes de aplicar
    if (inputFecha.length === 10 && inputFecha.includes('-')) {
      setFechaInicio(inputFecha);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Asistencia</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* CALENDARIO */}
        <View style={styles.calendarWrapper}>
          <Calendar
            markingType={'custom'}
            markedDates={fechasMarcadas}
            maxDate={new Date().toISOString().split('T')[0]} // Impide seleccionar en el futuro
            theme={{
              calendarBackground: '#171717',
              textSectionTitleColor: '#888',
              dayTextColor: '#FFF',
              todayTextColor: '#BB86FC',
              monthTextColor: '#FFF',
              arrowColor: '#BB86FC',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600'
            }}
          />
        </View>

        {/* LEYENDA */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#86fca5' }]} />
            <Text style={styles.legendText}>Entrenaste</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#CF6679' }]} />
            <Text style={styles.legendText}>Faltaste</Text>
          </View>
        </View>

        {/* CONTROL DE FECHA DE INICIO PARA TESTING */}
        <View style={styles.settingsBox}>
          <Text style={styles.settingsTitle}>Ajustar inicio de trackeo (Test)</Text>
          <View style={styles.inputRow}>
            <TextInput 
              style={styles.input} 
              value={inputFecha} 
              onChangeText={setInputFecha} 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor="#666"
            />
            <TouchableOpacity style={styles.applyBtn} onPress={actualizarInicio}>
              <Text style={styles.applyBtnText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  backButton: { marginRight: 16 },
  backText: { color: '#888', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  
  scrollContent: { padding: 24 },
  
  calendarWrapper: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  
  legendContainer: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#171717', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#222', marginBottom: 30 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendColor: { width: 16, height: 16, borderRadius: 4, marginRight: 8 },
  legendText: { color: '#E5E5E5', fontSize: 14, fontWeight: '600' },

  settingsBox: { backgroundColor: '#111', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  settingsTitle: { color: '#888', fontSize: 14, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '600' },
  inputRow: { flexDirection: 'row' },
  input: { flex: 1, backgroundColor: '#0A0A0A', color: '#FFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333', marginRight: 10, fontSize: 16 },
  applyBtn: { backgroundColor: '#BB86FC', justifyContent: 'center', paddingHorizontal: 20, borderRadius: 8 },
  applyBtnText: { color: '#0A0A0A', fontWeight: 'bold', fontSize: 16 }
});