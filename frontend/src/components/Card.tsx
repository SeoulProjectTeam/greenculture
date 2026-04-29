import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  title: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  body: { gap: 6 },
});

