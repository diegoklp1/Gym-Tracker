import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// 1. Nuevas importaciones para el Drag & Drop
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const EJERCICIOS_POR_DIA_DEFAULT: Record<string, { id: string; nombre: string; imagen: any }[]> = {
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
    { id: 'frontales', nombre: 'Elevaciones Frontales', imagen: require('../../assets/images/4_frontales.png') },
    { id: 'tricep_polea', nombre: 'Extensión Tríceps Polea', imagen: require('../../assets/images/1_tricep_polea_cuerda.png') },
    { id: 'tricep_mancuerna', nombre: 'Extensión Tríceps Mancuerna', imagen: require('../../assets/images/1_tricep_mancuerna_trasnuca.png') },
  ],
  pull2: [
    { id: 'jalon_pecho', nombre: 'Jalón al Pecho', imagen: require('../../assets/images/2_jalon_pecho.png') },
    { id: 'remo_maquina', nombre: 'Remo en Máquina', imagen: require('../../assets/images/5_remo_maquina.png') },
    { id: 'barra_menton', nombre: 'Elevación Barra Mentón', imagen: require('../../assets/images/5_barra_menton.png') },
    { id: 'curl_barra', nombre: 'Curl de Bíceps con Barra', imagen: require('../../assets/images/2_curl_barra.png') },
    { id: 'curl_martillo', nombre: 'Curl Martillo', imagen: require('../../assets/images/2_curl_martillo.png') },
  ],
};

const CATALOGO_GLOBAL: Record<string, { id: string; nombre: string; imagen: any }[]> = {
  push: [
    { id: 'press_inclinado', nombre: 'Press Pecho Inclinado', imagen: require('../../assets/images/1_press_inclinado.png') },
    { id: 'press_plano', nombre: 'Press Pecho Acostado', imagen: require('../../assets/images/1_press_plano.png') },
    { id: 'laterales', nombre: 'Elevaciones Laterales', imagen: require('../../assets/images/1_laterales.png') },
    { id: 'frontales', nombre: 'Elevaciones Frontales', imagen: require('../../assets/images/4_frontales.png') },
    { id: 'press_militar', nombre: 'Press Militar', imagen: require('../../assets/images/1_press_militar.png') },
    { id: 'tricep_polea', nombre: 'Extensión Tríceps Polea', imagen: require('../../assets/images/1_tricep_polea_cuerda.png') },
    { id: 'tricep_mancuerna', nombre: 'Extensión Tríceps Mancuerna', imagen: require('../../assets/images/1_tricep_mancuerna_trasnuca.png') },
  ],
  pull: [
    { id: 'jalon_pecho', nombre: 'Jalón al Pecho', imagen: require('../../assets/images/2_jalon_pecho.png') },
    { id: 'remo_barra', nombre: 'Remo con Barra', imagen: require('../../assets/images/2_remo_cerrado.png') },
    { id: 'remo_maquina', nombre: 'Remo en Máquina', imagen: require('../../assets/images/5_remo_maquina.png') },
    { id: 'encogimiento_hombros', nombre: 'Encogimiento de Hombros', imagen: require('../../assets/images/2_encogimiento_hombros.png') },
    { id: 'barra_menton', nombre: 'Elevación Barra Mentón', imagen: require('../../assets/images/5_barra_menton.png') },
    { id: 'curl_barra', nombre: 'Curl de Bíceps con Barra', imagen: require('../../assets/images/2_curl_barra.png') },
    { id: 'curl_martillo', nombre: 'Curl Martillo', imagen: require('../../assets/images/2_curl_martillo.png') },
  ],
  legs: [
    { id: 'prensa', nombre: 'Prensa Inclinada', imagen: require('../../assets/images/3_prensa_inclinada.png') },
    { id: 'sentadillas', nombre: 'Sentadillas', imagen: require('../../assets/images/3_prensa_sentadilla.png') },
    { id: 'extension_cuadriceps', nombre: 'Extensión de Cuádriceps', imagen: require('../../assets/images/3_curl_cuadriceps.png') },
    { id: 'curl_isquios', nombre: 'Curl de Femorales', imagen: require('../../assets/images/3_curl_femorales.png') },
    { id: 'gemelos', nombre: 'Elevación de Gemelos', imagen: require('../../assets/images/3_gemelos.png') },
  ]
};

export default function DayScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const router = useRouter();
  
  const [ejercicios, setEjercicios] = useState<any[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState<any>(null);

  const nombreDia = id ? (id as string).toUpperCase() : 'DÍA';
  const storageKey = `@ejercicios_dia_v2_${id}`; 
  const categoriaDia = id ? (id as string).replace(/\d+/g, '') : null; 
  const opcionesDeCategoria = categoriaDia ? CATALOGO_GLOBAL[categoriaDia] || [] : [];
  
  const opcionesDisponibles = opcionesDeCategoria.filter(
    (opcion) => !ejercicios.some((ej_actual) => ej_actual.id === opcion.id)
  );

  useEffect(() => {
    const cargarEjercicios = async () => {
      try {
        const guardados = await AsyncStorage.getItem(storageKey);
        if (guardados) {
          setEjercicios(JSON.parse(guardados));
        } else {
          const defaults = id ? EJERCICIOS_POR_DIA_DEFAULT[id] || [] : [];
          setEjercicios(defaults);
        }
      } catch (error) {
        console.error(error);
      }
    };
    cargarEjercicios();
  }, [id]);

  const confirmarQuitar = (ejercicio: any) => {
    Alert.alert("Quitar Ejercicio", `¿Querés sacar ${ejercicio.nombre} de esta rutina?`, [
      { text: "Cancelar", style: "cancel" },
      { 
        text: "Quitar", style: "destructive", 
        onPress: async () => {
          const nuevaLista = ejercicios.filter(e => e.id !== ejercicio.id);
          setEjercicios(nuevaLista);
          await AsyncStorage.setItem(storageKey, JSON.stringify(nuevaLista));
        }
      }
    ]);
  };

  const agregarEjercicio = async () => {
    if (!ejercicioSeleccionado) return;
    const nuevaLista = [...ejercicios, ejercicioSeleccionado];
    setEjercicios(nuevaLista);
    await AsyncStorage.setItem(storageKey, JSON.stringify(nuevaLista));
    setEjercicioSeleccionado(null);
    setModalVisible(false);
  };

  // 2. Función que dibuja cada tarjeta (Ahora tiene lógica de Drag)
  const renderItem = ({ item: ejercicio, drag, isActive }: RenderItemParams<any>) => {
    let imagenLocal = null;
    if (categoriaDia && CATALOGO_GLOBAL[categoriaDia]) {
      const ejGlobal = CATALOGO_GLOBAL[categoriaDia].find(e => e.id === ejercicio.id);
      if (ejGlobal) imagenLocal = ejGlobal.imagen;
    }

    return (
      <ScaleDecorator>
        <TouchableOpacity 
          style={[
            styles.exerciseCard, 
            isActive && { backgroundColor: '#1E1E1E', borderColor: '#BB86FC', elevation: 5 } // Efecto visual al levantarla
          ]}
          activeOpacity={1}
          onPress={() => router.push(`/exercise/${ejercicio.id}`)}
          onLongPress={() => confirmarQuitar(ejercicio)}
          delayLongPress={400}
        >
          {/* BOTÓN DE AGARRE PARA ARRASTRAR */}
          <TouchableOpacity style={styles.dragHandle} onPressIn={drag}>
            <Text style={styles.dragIcon}>≡</Text>
          </TouchableOpacity>

          <View style={styles.cardTextContainer}>
            <Text style={styles.exerciseName}>{ejercicio.nombre}</Text>
            <Text style={styles.viewHistory}>Ver →</Text>
          </View>

          <View style={styles.imageContainer}>
            {imagenLocal ? (
              <Image source={imagenLocal} style={styles.exerciseImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>{ejercicio.nombre.charAt(0).toUpperCase()}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  // 3. Todo tiene que estar envuelto en GestureHandlerRootView
  return (
    <GestureHandlerRootView style={styles.container}>
      <DraggableFlatList
        data={ejercicios}
        onDragEnd={async ({ data }) => {
          // Acá se guardan los datos en su nuevo orden cuando soltás la tarjeta
          setEjercicios(data);
          await AsyncStorage.setItem(storageKey, JSON.stringify(data));
        }}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.scrollContent}
        // Pasamos el título arriba
        ListHeaderComponent={
          <View style={styles.headerArea}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{nombreDia}</Text>
          </View>
        }
        // Pasamos el botón de agregar abajo
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
            <Text style={styles.addButtonIcon}>+</Text>
            <Text style={styles.addButtonText}>Agregar Ejercicio</Text>
          </TouchableOpacity>
        }
      />

      {/* MODAL INTELIGENTE DE SELECCIÓN */}
      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Agregar a {nombreDia}</Text>
            
            {opcionesDisponibles.length === 0 ? (
              <Text style={styles.modalSubtitle}>¡Excelente! Ya agregaste todos los ejercicios de {categoriaDia} disponibles en el catálogo.</Text>
            ) : (
              <ScrollView style={styles.optionsList}>
                {opcionesDisponibles.map((opcion) => (
                  <TouchableOpacity
                    key={opcion.id}
                    style={[styles.optionCard, ejercicioSeleccionado?.id === opcion.id && styles.optionCardSelected]}
                    onPress={() => setEjercicioSeleccionado(opcion)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, ejercicioSeleccionado?.id === opcion.id && styles.optionTextSelected]}>
                      {opcion.nombre}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setModalVisible(false); setEjercicioSeleccionado(null); }}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, !ejercicioSeleccionado && { opacity: 0.5 }]} onPress={agregarEjercicio} disabled={!ejercicioSeleccionado}>
                <Text style={styles.saveBtnText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  scrollContent: { padding: 12, paddingTop: 60, paddingBottom: 40 },
  headerArea: { marginBottom: 10 },
  backButton: { marginBottom: 20 },
  backText: { color: '#888', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFF', marginBottom: 10, letterSpacing: 1 },
  
  // Modificaciones en la tarjeta para sumar el ícono de Drag
  exerciseCard: { height: 110, backgroundColor: '#171717', borderRadius: 16, marginBottom: 16, flexDirection: 'row', overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  
  dragHandle: { width: 30, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' },
  dragIcon: { color: '#555', fontSize: 32, fontWeight: '300', marginBottom: 4 },
  
  cardTextContainer: { flex: 1, paddingHorizontal: 15, justifyContent: 'center' },
  exerciseName: { color: '#E5E5E5', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  viewHistory: { color: '#BB86FC', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  
  imageContainer: { width: 100, backgroundColor: '#111' },
  exerciseImage: { width: '100%', height: '100%' },
  placeholderImage: { width: '100%', height: '100%', backgroundColor: '#2A2A2A', justifyContent: 'center', alignItems: 'center' },
  placeholderText: { color: '#666', fontSize: 40, fontWeight: 'bold' },

  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, marginTop: 10, borderRadius: 16, borderWidth: 2, borderColor: '#1F1F1F', borderStyle: 'dashed' },
  addButtonIcon: { color: '#BB86FC', fontSize: 24, marginRight: 10, marginTop: -4 },
  addButtonText: { color: '#BB86FC', fontSize: 16, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', width: '100%', maxHeight: '80%', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 5 },
  modalSubtitle: { color: '#888', fontSize: 13, marginBottom: 15 },
  optionsList: { maxHeight: 300, marginBottom: 15 },
  optionCard: { backgroundColor: '#0A0A0A', padding: 16, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#333' },
  optionCardSelected: { borderColor: '#BB86FC', backgroundColor: '#1F1533' },
  optionText: { color: '#E5E5E5', fontSize: 16 },
  optionTextSelected: { color: '#BB86FC', fontWeight: 'bold' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  cancelBtn: { padding: 12, marginRight: 16 },
  cancelBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
  saveBtn: { backgroundColor: '#BB86FC', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8 },
  saveBtnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
});