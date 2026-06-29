import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  QRScanner: undefined;
  MilkingProcess: { sensorQr?: string; cowId?: string } | undefined;
  MilkResult: { cowId?: string } | undefined;
  AISuggestions: { cowId?: string } | undefined;
  Profile: undefined;
  AdminApplications: undefined;
  SupplierOrders: undefined;
  SupplierOffers: undefined;
};

export type MainScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<MainStackParamList, T>;
