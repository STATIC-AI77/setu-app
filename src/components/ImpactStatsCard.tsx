import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { ImpactStats } from '../types';
import { THEME } from '../constants/theme';

interface ImpactStatsCardProps {
  stats: ImpactStats;
  loading?: boolean;
}

export const ImpactStatsCard: React.FC<ImpactStatsCardProps> = ({ stats }) => {
  const totalThreats = stats.scam_calls_blocked + stats.scam_messages_blocked;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>National Shield Impact</Text>
      <View style={styles.grid}>
        <View style={styles.box}>
          <Text style={styles.number}>₹{stats.money_saved_inr.toLocaleString('en-IN')}</Text>
          <Text style={styles.label}>Money Protected</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.number}>{stats.time_wasted_min}m</Text>
          <Text style={styles.label}>Scammer Wasted</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.number}>{totalThreats}</Text>
          <Text style={styles.label}>Threats Blocked</Text>
        </View>
        <View style={styles.box}>
          <Text style={styles.number}>{stats.mule_accounts_exposed}</Text>
          <Text style={styles.label}>Mules Exposed</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.cardDark,
    borderRadius: THEME.radius.card,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#38bdf833',
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: THEME.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  box: {
    alignItems: 'center',
    flex: 1,
  },
  number: {
    fontSize: 15,
    fontWeight: '800',
    color: THEME.colors.textWhite,
  },
  label: {
    fontSize: 10,
    color: THEME.colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
