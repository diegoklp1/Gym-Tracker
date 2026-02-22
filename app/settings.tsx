import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();

  // --- EXPORTAR ---
  const exportarDatos = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const allData = await AsyncStorage.multiGet(keys);
      
      let backupData: Record<string, any> = {};
      allData.forEach(([key, value]) => {
        if (value) {
          backupData[key] = JSON.parse(value);
        }
      });

      const jsonString = JSON.stringify(backupData);
      
      // LÓGICA DIVIDIDA POR PLATAFORMA
      if (Platform.OS === 'web') {
        // En PC: Creamos un archivo virtual y forzamos la descarga del navegador
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'MiRutina_Backup.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // En Celular: Usamos la API moderna de FileSystem (File + Paths)
        const file = new FileSystem.File(FileSystem.Paths.document, 'MiRutina_Backup.json');
        await file.write(jsonString, { encoding: 'utf8' });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(file.uri, { dialogTitle: 'Guardar backup de mi rutina' });
        } else {
          Alert.alert("Error", "No se puede compartir en este dispositivo.");
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Hubo un problema al exportar los datos.");
    }
  };

  // --- IMPORTAR ---
  const importarDatos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true
      });

      if (result.canceled) return;

      let fileContent = '';

      if (Platform.OS === 'web') {
        // En PC: Leemos el archivo usando la API nativa de JavaScript
        const file = result.assets[0].file;
        if (!file) return;
        
        fileContent = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
      } else {
        // En Celular: Usamos la API moderna de FileSystem (File + Paths)
        const fileUri = result.assets[0].uri;
        const pickedFile = new FileSystem.File(fileUri);
        fileContent = await pickedFile.text();
      }
      
      const parsedData = JSON.parse(fileContent);
      const keys = Object.keys(parsedData);
      const multiSetPairs: [string, string][] = keys.map(key => [key, JSON.stringify(parsedData[key])]);
      
      // Las alertas nativas a veces fallan en la web, así que usamos confirm() en PC
      if (Platform.OS === 'web') {
        const confirmar = window.confirm("Esto va a pisar tus datos actuales con los del archivo. ¿Continuar?");
        if (confirmar) {
          await AsyncStorage.multiSet(multiSetPairs);
          window.alert("¡Backup restaurado con éxito!");
        }
      } else {
        Alert.alert(
          "Cargar Backup",
          "Esto va a pisar tus datos actuales con los del archivo. ¿Continuar?",
          [
            { text: "Cancelar", style: "cancel" },
            { 
              text: "Sí, importar", 
              onPress: async () => {
                await AsyncStorage.multiSet(multiSetPairs);
                Alert.alert("¡Éxito!", "Backup restaurado.");
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error(error);
      if (Platform.OS === 'web') {
        window.alert("Error: El archivo no es válido.");
      } else {
        Alert.alert("Error", "El archivo no es válido o está corrupto.");
      }
    }
  };

  const borrarTodo = () => {
    if (Platform.OS === 'web') {
      const confirmar = window.confirm("¿Seguro que querés borrar TODA tu base de datos? Esto no se puede deshacer.");
      if (confirmar) {
        AsyncStorage.clear().then(() => window.alert("Base de datos limpia."));
      }
    } else {
      Alert.alert(
        "Peligro",
        "¿Estás seguro de que querés borrar TODA tu base de datos? Esto no se puede deshacer.",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Borrar Todo", 
            style: "destructive", 
            onPress: async () => {
              await AsyncStorage.clear();
              Alert.alert("Listo", "Base de datos limpia.");
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Datos y Backup</Text>
        <Text style={styles.description}>Guardá tu progreso en Google Drive o envialo a otro dispositivo para no perder nunca tu historial.</Text>
        
        <TouchableOpacity style={styles.primaryButton} onPress={exportarDatos} activeOpacity={0.7}>
          <Text style={styles.primaryButtonText}>↑ Exportar Datos (.json)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={importarDatos} activeOpacity={0.7}>
          <Text style={styles.secondaryButtonText}>↓ Importar Backup</Text>
        </TouchableOpacity>

        <View style={styles.dangerZone}>
          <Text style={styles.dangerTitle}>Zona de Peligro</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={borrarTodo} activeOpacity={0.7}>
            <Text style={styles.dangerButtonText}>Borrar toda la base de datos</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  backButton: { marginRight: 16 },
  backText: { color: '#888', fontSize: 16, fontWeight: '600' },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 0.5 },
  
  content: { padding: 24 },
  sectionTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  description: { color: '#888', fontSize: 14, lineHeight: 20, marginBottom: 30 },
  
  primaryButton: { backgroundColor: '#BB86FC', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { color: '#0A0A0A', fontSize: 16, fontWeight: 'bold' },
  
  secondaryButton: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  secondaryButtonText: { color: '#E5E5E5', fontSize: 16, fontWeight: '600' },

  dangerZone: { marginTop: 60, padding: 20, borderWidth: 1, borderColor: '#331111', backgroundColor: '#1A0505', borderRadius: 12 },
  dangerTitle: { color: '#CF6679', fontSize: 16, fontWeight: '700', marginBottom: 15 },
  dangerButton: { backgroundColor: '#CF6679', padding: 12, borderRadius: 8, alignItems: 'center' },
  dangerButtonText: { color: '#0A0A0A', fontSize: 14, fontWeight: 'bold' },
});