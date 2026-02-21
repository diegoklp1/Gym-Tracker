import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      {/* Esto pone la hora y batería del celu en color blanco para que se vea en el fondo negro */}
      <StatusBar style="light" /> 
      
      {/* Esto le dice al enrutador que no muestre su barra superior en ninguna pantalla */}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}