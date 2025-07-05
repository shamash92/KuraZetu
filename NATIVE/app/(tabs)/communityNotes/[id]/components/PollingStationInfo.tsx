import { Dimensions, StyleSheet, Text, View } from 'react-native';

import React from 'react';
import { Users } from 'lucide-react-native';

interface PollingStationInfoProps {
  pollingStation: string;
  pollingStationCode: string;
  ward: string;
  wardCode: string;
  constituency: string;
  constituencyCode: string;
  county: string;
  countyCode: string;
}

const CARD_HEIGHT = Dimensions.get('window').height * 0.15;

export function PollingStationInfo({
  pollingStation,
  pollingStationCode,
  ward,
  wardCode,
  constituency,
  constituencyCode,
  county,
  countyCode,
}: PollingStationInfoProps) {
  return (
    <View style={[styles.card]}>
      <View style={styles.detailsRow}>
        <Text style={styles.detail}>
          {county} / {constituency} / {ward}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212529',
  },
  code: {
    fontSize: 13,
    color: '#6C757D',
    marginLeft: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
  },
  detail: {
    fontSize: 12,
    color: '#495057',
  },
});
