import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { getJson } from '../api/http';
import type { BikeStationResponse, ReturnAvailabilityResponse } from '../api/types';

export function BikeScreen() {
  const [lat, setLat] = useState('37.5665');
  const [lng, setLng] = useState('126.9780');
  const [radiusKm, setRadiusKm] = useState('1.0');
  const [stationId, setStationId] = useState('STATION-001');
  const [datetime, setDatetime] = useState(() => new Date().toISOString().slice(0, 19));

  const [loadingStations, setLoadingStations] = useState(false);
  const [stations, setStations] = useState<BikeStationResponse[]>([]);

  const [loadingPredict, setLoadingPredict] = useState(false);
  const [prediction, setPrediction] = useState<ReturnAvailabilityResponse | null>(null);

  async function onNearby() {
    try {
      setLoadingStations(true);
      const res = await getJson<BikeStationResponse[]>('/api/bike-stations/nearby', {
        lat,
        lng,
        radiusKm,
      });
      setStations(res);
      if (res[0]?.stationId) setStationId(res[0].stationId);
    } catch (e) {
      Alert.alert('대여소 조회 실패', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoadingStations(false);
    }
  }

  async function onPredict() {
    try {
      setLoadingPredict(true);
      const res = await getJson<ReturnAvailabilityResponse>(`/api/bike-stations/${stationId}/return-availability`, {
        datetime,
      });
      setPrediction(res);
    } catch (e) {
      Alert.alert('예측 실패', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoadingPredict(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>따릉이</Text>
      <Text style={styles.p}>주변 대여소 추천 + 반납 가능성(높음/보통/낮음) 예측.</Text>

      <Card title="주변 대여소 조회">
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Field label="위도" value={lat} onChangeText={setLat} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="경도" value={lng} onChangeText={setLng} keyboardType="numeric" />
          </View>
        </View>
        <Field label="반경(km)" value={radiusKm} onChangeText={setRadiusKm} keyboardType="numeric" />

        <Pressable style={styles.button} onPress={onNearby} disabled={loadingStations}>
          <Text style={styles.buttonText}>{loadingStations ? '불러오는 중...' : '주변 대여소 찾기'}</Text>
        </Pressable>
      </Card>

      <Card title="반납 가능성 예측">
        <Field label="대여소 ID" value={stationId} onChangeText={setStationId} placeholder="STATION-001" />
        <Field label="시간(YYYY-MM-DDTHH:mm:ss)" value={datetime} onChangeText={setDatetime} />
        <Pressable style={styles.button} onPress={onPredict} disabled={loadingPredict}>
          <Text style={styles.buttonText}>{loadingPredict ? '예측 중...' : '예측하기'}</Text>
        </Pressable>
        {prediction ? (
          <Text style={styles.kv}>
            결과: {prediction.level} (score: {prediction.score.toFixed(2)})
          </Text>
        ) : (
          <Text style={styles.meta}>아직 예측 결과가 없습니다.</Text>
        )}
      </Card>

      <View style={{ gap: 10 }}>
        {stations.map((s) => (
          <Card key={s.stationId} title={s.stationName}>
            <Text style={styles.kv}>ID: {s.stationId}</Text>
            <Text style={styles.kv}>거치대: {s.totalRacks}</Text>
            <Pressable style={[styles.button, { backgroundColor: '#0f766e' }]} onPress={() => setStationId(s.stationId)}>
              <Text style={styles.buttonText}>이 대여소로 예측하기</Text>
            </Pressable>
          </Card>
        ))}
        {stations.length === 0 ? <Text style={styles.empty}>아직 조회된 대여소가 없습니다.</Text> : null}
      </View>
    </ScrollView>
  );
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
  meta: { fontSize: 12, color: '#64748b' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 10 },
});

