import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { MilkResultScreen } from '../screens/Milk/MilkResultScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { QRScannerScreen } from '../screens/QR/QRScannerScreen';
import { AISuggestionsScreen } from '../screens/Suggestions/AISuggestionsScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="MilkResult" component={MilkResultScreen} />
      <Stack.Screen name="AISuggestions" component={AISuggestionsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
