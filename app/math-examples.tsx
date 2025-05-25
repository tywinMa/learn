import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import MathExamples from '@/components/MathExamples';

export default function MathExamplesScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: '数学公式示例' }} />
      <MathExamples />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
}); 