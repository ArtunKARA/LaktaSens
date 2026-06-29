import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AdminApplicationsScreen } from '../screens/Admin/AdminApplicationsScreen';
import { DashboardScreen } from '../screens/Dashboard/DashboardScreen';
import { MilkingProcessScreen } from '../screens/Milk/MilkingProcessScreen';
import { MilkResultScreen } from '../screens/Milk/MilkResultScreen';
import { ProfileScreen } from '../screens/Profile/ProfileScreen';
import { QRScannerScreen } from '../screens/QR/QRScannerScreen';
import { SensorAddScreen } from '../screens/Sensors/SensorAddScreen';
import { AISuggestionsScreen } from '../screens/Suggestions/AISuggestionsScreen';
import { SupplierOffersScreen } from '../screens/Supplier/SupplierOffersScreen';
import { SupplierOrdersScreen } from '../screens/Supplier/SupplierOrdersScreen';
import { MainStackParamList } from './types';

const Stack = createNativeStackNavigator<MainStackParamList>();

export function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} />
      <Stack.Screen name="SensorAdd" component={SensorAddScreen} />
      <Stack.Screen name="MilkingProcess" component={MilkingProcessScreen} />
      <Stack.Screen name="MilkResult" component={MilkResultScreen} />
      <Stack.Screen name="AISuggestions" component={AISuggestionsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="AdminApplications" component={AdminApplicationsScreen} />
      <Stack.Screen name="SupplierOrders" component={SupplierOrdersScreen} />
      <Stack.Screen name="SupplierOffers" component={SupplierOffersScreen} />
    </Stack.Navigator>
  );
}
