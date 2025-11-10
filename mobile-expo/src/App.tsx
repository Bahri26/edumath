import React from 'react';
import { SafeAreaView, Text, StyleSheet, StatusBar } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>EduMath Mobile</Text>
      <Text style={styles.subtitle}>Expo başlangıç ekranı hazır. Sonraki adım: Login & Soru Havuzu.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 12
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    paddingHorizontal: 32,
    textAlign: 'center'
  }
});
