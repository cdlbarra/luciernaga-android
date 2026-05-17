import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { COLORS } from '../constants';

export default function LoadingOverlay() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(26,26,26,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
});
