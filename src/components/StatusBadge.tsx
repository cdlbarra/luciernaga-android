import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants';

const colorMap: Record<string, string> = {
  active: COLORS.success,
  inactive: COLORS.textSecondary,
  processing: COLORS.accent,
  error: COLORS.error,
};

export default function StatusBadge({ status }: { status: string }) {
  const color = colorMap[status] ?? COLORS.textSecondary;
  return (
    <View style={[styles.badge, { backgroundColor: color + '33', borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
});
