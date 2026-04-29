import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { EventsScreen } from '../screens/EventsScreen';
import { RoutesScreen } from '../screens/RoutesScreen';
import { BikeScreen } from '../screens/BikeScreen';
import { CarbonScreen } from '../screens/CarbonScreen';

export type RootTabParamList = {
  Events: undefined;
  Routes: undefined;
  Bike: undefined;
  Carbon: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

export function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerTitleStyle: { fontWeight: '800' },
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen name="Events" component={EventsScreen} options={{ title: '행사' }} />
      <Tab.Screen name="Routes" component={RoutesScreen} options={{ title: '경로' }} />
      <Tab.Screen name="Bike" component={BikeScreen} options={{ title: '따릉이' }} />
      <Tab.Screen name="Carbon" component={CarbonScreen} options={{ title: '탄소' }} />
    </Tab.Navigator>
  );
}

