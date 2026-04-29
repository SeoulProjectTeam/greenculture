import { Platform } from 'react-native';

function defaultBaseUrl() {
  // Android emulator: host machine is reachable via 10.0.2.2
  if (Platform.OS === 'android') return 'http://10.0.2.2:8080';
  return 'http://localhost:8080';
}

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? defaultBaseUrl();

