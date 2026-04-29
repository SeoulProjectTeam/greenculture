import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { postJson } from '../api/http';
import type { CarbonCalculateResponse, TransportMode } from '../api/types';

type Segment = { mode: TransportMode; distanceKm: string };

export function CarbonScreen() {
  const [totalDistanceKm, setTotalDistanceKm] = useState('12.5');
  const [segments, setSegments] = useState<Segment[]>([
    { mode: 'SUBWAY', distanceKm: '10.0' },
    { mode: 'WALK', distanceKm: '2.5' },
  ]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CarbonCalculateResponse | null>(null);

  const payload = useMemo(
    () => ({
      totalDistanceKm: Number(totalDistanceKm),
      segments: segments.map((s) => ({ mode: s.mode, distanceKm: Number(s.distanceKm) })),
    }),
    [totalDistanceKm, segments]
  );

  async function onCalc() {
    try {
      setLoading(true);
      const res = await postJson<CarbonCalculateResponse>('/api/carbon/calculate', payload);
      setResult(res);
    } catch (e) {
      Alert.alert('계산 실패', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>탄소 계산</Text>
      <Text style={styles.p}>구간별 교통수단/거리로 총 탄소와 자가용 대비 절감량을 계산합니다.</Text>

      <Card title="입력">
        <Field label="총 거리(km)" value={totalDistanceKm} onChangeText={setTotalDistanceKm} keyboardType="numeric" />
        {segments.map((seg, idx) => (
          <View key={idx} style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field
                label={`구간${idx + 1} 수단`}
                value={seg.mode}
                onChangeText={(v) =>
                  setSegments((prev) => prev.map((p, i) => (i === idx ? { ...p, mode: (v as TransportMode) } : p)))
                }
                placeholder="SUBWAY"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="거리(km)"
                value={seg.distanceKm}
                onChangeText={(v) => setSegments((prev) => prev.map((p, i) => (i === idx ? { ...p, distanceKm: v } : p)))}
                keyboardType="numeric"
              />
            </View>
          </View>
        ))}
        <View style={styles.row}>
          <Pressable
            style={[styles.button, { flex: 1, backgroundColor: '#0f766e' }]}
            onPress={() => setSegments((prev) => [...prev, { mode: 'WALK', distanceKm: '1.0' }])}
          >
            <Text style={styles.buttonText}>구간 추가</Text>
          </Pressable>
          <Pressable
            style={[styles.button, { flex: 1, backgroundColor: '#ef4444' }]}
            onPress={() => setSegments((prev) => prev.slice(0, Math.max(1, prev.length - 1)))}
          >
            <Text style={styles.buttonText}>구간 제거</Text>
          </Pressable>
        </View>

        <Pressable style={styles.button} onPress={onCalc} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '계산 중...' : '계산하기'}</Text>
        </Pressable>
      </Card>

      <Card title="결과">
        {result ? (
          <>
            <Text style={styles.kv}>경로 탄소: {result.routeCarbonKg.toFixed(3)} kgCO2</Text>
            <Text style={styles.kv}>자가용 대비 절감: {result.savedCarbonKgVsCar.toFixed(3)} kgCO2</Text>
          </>
        ) : (
          <Text style={styles.meta}>아직 결과가 없습니다.</Text>
        )}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  p: { color: '#475569' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'flex-end' },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  kv: { color: '#0f172a' },
  meta: { fontSize: 12, color: '#64748b' },
});

