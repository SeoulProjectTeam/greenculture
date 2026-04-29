import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import React, { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { getJson } from '../api/http';
import type { EventResponse } from '../api/types';
import { API_BASE_URL } from '../api/config';

const CATEGORY_OPTIONS = [
  '전시/미술',
  '클래식',
  '연극',
  '뮤지컬/오페라',
  '무용',
  '국악',
  '콘서트',
  '교육/체험',
  '기타',
] as const;

export function EventsScreen() {
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [category, setCategory] = useState<(typeof CATEGORY_OPTIONS)[number]>('전시/미술');
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EventResponse[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  const date = useMemo(() => selectedDate.toISOString().slice(0, 10), [selectedDate]);
  const subtitle = useMemo(() => `${date} / ${category}`, [date, category]);

  async function onSearch() {
    try {
      setLoading(true);
      const data = await getJson<EventResponse[]>('/api/events/recommend', { date, interest: category });
      setItems(data);
    } catch (e) {
      Alert.alert('조회 실패', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  function onChangeDate(_: DateTimePickerEvent, d?: Date) {
    setShowPicker(false);
    if (d) setSelectedDate(d);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.h1}>문화행사 추천</Text>
      <Text style={styles.p}>날짜와 관심사를 입력하고 행사 목록을 불러옵니다.</Text>

      <Card title="검색 조건">
        <Text style={styles.label}>날짜</Text>
        <Pressable style={styles.pickerButton} onPress={() => setShowPicker(true)}>
          <Text style={styles.pickerButtonText}>{date}</Text>
        </Pressable>
        {showPicker ? (
          <DateTimePicker value={selectedDate} mode="date" onChange={onChangeDate} />
        ) : null}

        <Text style={styles.label}>카테고리</Text>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={category} onValueChange={(v) => setCategory(v)} style={styles.picker}>
            {CATEGORY_OPTIONS.map((opt) => (
              <Picker.Item key={opt} label={opt} value={opt} />
            ))}
          </Picker>
        </View>

        <Pressable style={styles.button} onPress={onSearch} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? '불러오는 중...' : '추천 받기'}</Text>
        </Pressable>
        <Text style={styles.meta}>조건: {subtitle}</Text>
        <Text style={styles.meta}>API: {API_BASE_URL}</Text>
      </Card>

      <View style={{ gap: 10 }}>
        {items.map((it) => (
          <Card key={it.id} title={it.title}>
            <Text style={styles.kv}>분류: {it.category}</Text>
            <Text style={styles.kv}>장소: {it.venueName}</Text>
            <Text style={styles.kv}>
              좌표: {it.latitude.toFixed(5)}, {it.longitude.toFixed(5)}
            </Text>
            {it.sourceUrl ? (
              <Pressable
                onPress={() => Linking.openURL(it.sourceUrl!)}
                style={[styles.button, { backgroundColor: '#0f766e' }]}
              >
                <Text style={styles.buttonText}>원문 보기</Text>
              </Pressable>
            ) : null}
          </Card>
        ))}
        {items.length === 0 ? (
          <Text style={styles.empty}>아직 결과가 없습니다. 위에서 추천을 실행해보세요.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12, backgroundColor: '#f8fafc' },
  h1: { fontSize: 22, fontWeight: '800', color: '#0f172a' },
  p: { color: '#475569' },
  label: { fontSize: 12, color: '#334155', fontWeight: '600' },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    backgroundColor: '#fff',
  },
  pickerButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  pickerButtonText: { color: '#0f172a', fontWeight: '600' },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
  meta: { fontSize: 12, color: '#64748b' },
  kv: { color: '#0f172a' },
  empty: { textAlign: 'center', color: '#64748b', marginTop: 20 },
});

