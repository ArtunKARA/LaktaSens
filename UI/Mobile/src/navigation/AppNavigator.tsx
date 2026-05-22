import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { useAuth } from '../hooks/useAuth';
import { AppScreen } from '../components/ui/AppScreen';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export function AppNavigator() {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <AppScreen scroll={false} contentStyle={styles.loading}>
        <View style={styles.loadingBox}>
          <ActivityIndicator color={colors.emerald} size="large" />
          <Text style={styles.loadingText}>LaktaSense</Text>
        </View>
      </AppScreen>
    );
  }

  return <NavigationContainer>{user ? <MainNavigator /> : <AuthNavigator />}</NavigationContainer>;
}

const styles = StyleSheet.create({
  loading: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    ...typography.subheading,
    color: colors.text,
  },
});
