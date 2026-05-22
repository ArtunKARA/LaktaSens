import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  QRScanner: undefined;
  MilkResult: { cowId?: string } | undefined;
  AISuggestions: { cowId?: string } | undefined;
  Profile: undefined;
};

export type MainScreenProps<T extends keyof MainStackParamList> = NativeStackScreenProps<MainStackParamList, T>;
