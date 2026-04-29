import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { postJson } from '../api/http';
import type { RouteCompareResponse, RouteOptionResponse } from '../api/types';

export function RoutesScreen() {
  const [originName, setOriginName] = useState('집');
  const [originLat, setOriginLat] = useState('37.5665');
  const [originLng, setOriginLng] = useState('126.9780');
  const [destinationName, setDestinationName] = useState('행사장');
  const [destinationLat, setDestinationLat] = useState('37.5651');
  const [destinationLng, setDestinationLng] = useState('126.9895');
  const [departureTime, setDepartureTime] = useState(() => new Date().toISOString());

  const [loading, setLoading] = useState(false);
  const [routes, setRoutes] = useState<RouteOptionResponse[]>([]);

  const payload = useMemo(
    () => ({
      originName,
      originLat: Number(originLat),
      originLng: Number(originLng),
      destinationName,
      destinationLat: Number(destinationLat),
      destinationLng: Number(destinationLng),
      departureTime,
    }),
    [originName, originLat, originLng, destinationName, destinationLat, destinationLng, departureTime]
  );

  async function onCompare() {
    try {
      setLoading(true);
      const res = await postJson<RouteCompareResponse>('/api/routes/compare', payload);
      setRoutes(res.routes ?? []);
    } catch (e) {
      Alert.alert('경로 비교 실패', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>경로 비교</Text>
      <Text style={styles.p}>빠른/친환경/균형 3가지 경로를 비교합니다.</Text>

      <Card title="출발지">
        <Field label="이름" value={originName} onChangeText={setOriginName} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="위도" value={originLat} onChangeText={setOriginLat} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="경도" value={originLng} onChangeText={setOriginLng} keyboardType="numeric" />
          </View>
        </View>
      </Card>

      <Card title="목적지">
        <Field label="이름" value={destinationName} onChangeText={setDestinationName} />
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field
              label="위도"
              value={destinationLat}
              onChangeText={setDestinationLat}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="경도"
              value={destinationLng}
              onChangeText={setDestinationLng}
              keyboardType="numeric"
            />
          </View>
        </View>
        <Field label="출발시간(ISO)" value={departureTime} onChangeText={setDepartureTime} />

        <Pressable style={styles.button} onPress={onCompare} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '비교 중...' : '경로 3개 비교'}</Text>
        </Pressable>
      </Card>

      <View style={{ gap: 10 }}>
        {routes.map((r) => (
          <Card key={r.routeAlternativeId} title={titleFor(r.routeType)}>
            <Text style={styles.kv}>시간: {r.durationMinutes}분</Text>
            <Text style={styles.kv}>탄소: {r.carbonKg} kgCO2</Text>
            <Text style={styles.kv}>거리: {r.distanceKm} km</Text>
            <Text style={styles.kv}>환승: {r.transferCount}회</Text>
            <Text style={styles.kv}>따릉이: {r.includesBike ? '포함' : '미포함'}</Text>
          </Card>
        ))}
        {routes.length === 0 ? <Text style={styles.empty}>아직 결과가 없습니다.</Text> : null}
      </View>
    </ScrollView>
  );
}

function titleFor(type: RouteOptionResponse['routeType']) {
  switch (type) {
    case 'FAST':
      return '빠른 경로';
    case 'ECO':
      return '친환경 경로';
    case 'BALANCED':
      return '균형 경로';
    default:
      return type;
  }
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  p: { color: '#475569' },
  row: { flexDirection: 'row', gap: 10 },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  kv: { color: '#0f172a' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 10 },
});

