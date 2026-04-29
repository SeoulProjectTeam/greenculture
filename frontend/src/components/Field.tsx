import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type Props = {
  label: string;
  value: string;
  placeholder?: string;
  onChangeText: (v: string) => void;
  keyboardType?: 'default' | 'numeric';
};

export function Field({ label, value, placeholder, onChangeText, keyboardType }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType ?? 'default'}
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontSize: 12, color: '#334155', fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
});

