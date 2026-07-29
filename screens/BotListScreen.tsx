import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SCREEN_NAMES, Agent, RootStackParamList } from '../types';
import { useAgentStore } from '../stores/agentStore';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, typography, borderRadius, spacing } from '../theme';
import Svg, { Path, Ellipse, Circle } from 'react-native-svg';

const STATUS_COLORS: Record<Agent['status'], string> = {
  online: colors.success,
  offline: colors.textMuted,
  checking: colors.warning,
};

// Settings gear SVG (v1 header icon)
const GearIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="12" r="3" stroke="#8b949e" strokeWidth="2"/>
  </Svg>
);

// Mini snake-E for avatar
const SnakeEMini = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <Path d="M60 28 C60 45,62 60,62 75 C62 90,62 105,62 120 C62 135,62 150,60 165 C58 178,60 188,75 192" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M62 48 C80 42,95 40,115 42 C130 44,142 48,148 52" stroke="white" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M148 52 C150 58,145 64,138 65" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M62 95 C80 90,98 88,118 90 C132 92,142 96,146 100" stroke="white" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 100 C148 104,143 110,137 110" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M60 142 C78 140,96 142,116 145 C130 148,140 152,146 156" stroke="white" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 156 C148 162,142 168,135 168" stroke="white" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M75 192 C85 196,98 196,105 190 C112 184,110 175,102 173 C96 172,92 176,93 180" stroke="white" strokeWidth="9" strokeLinecap="round"/>
    <Ellipse cx="48" cy="18" rx="13" ry="9" fill="white" opacity="0.95"/>
    <Ellipse cx="42" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="55" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="42" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
    <Ellipse cx="55" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
  </Svg>
);

export default function BotListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { agents, selectedAgentId, selectAgent } = useAgentStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleAgentPress = (agent: Agent) => {
    selectAgent(agent.id);
    navigation.navigate(SCREEN_NAMES.Chat, { botId: agent.id });
  };

  const handleSettings = () => {
    navigation.navigate(SCREEN_NAMES.Settings);
  };

  const descriptions: Record<string, { desc: string; type: string; host: string; port: number }> = {
    'kernel-main': { desc: 'Primary self-evolving agent', type: 'kernel', host: 'localhost', port: 8779 },
    marty: { desc: 'Marketing content agent', type: 'agent', host: 'localhost', port: 8768 },
    olly: { desc: 'Dev/infra assistant', type: 'agent', host: 'localhost', port: 18789 },
    lawy: { desc: 'Legal document AI', type: 'agent', host: 'localhost', port: 8771 },
    sage: { desc: 'Financial analytics', type: 'agent', host: 'localhost', port: 8772 },
  };

  const renderAgent = ({ item }: { item: Agent }) => {
    const info = descriptions[item.id] || { desc: 'Agent', type: 'agent', host: 'localhost', port: 0 };
    const isOnline = item.status === 'online';

    return (
      <TouchableOpacity
        style={styles.agentRow}
        activeOpacity={0.7}
        onPress={() => handleAgentPress(item)}
        onLongPress={() => navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: item.id })}
      >
        {/* Gradient avatar */}
        <View style={[styles.avatar, { backgroundColor: isOnline ? colors.gradientOnline[0] : colors.gradientOffline[0] }]}>
          <SnakeEMini size={24} />
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
        </View>

        {/* Info row: name + status dot, desc, type/host/port */}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.inlineDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          </View>
          <Text style={styles.desc} numberOfLines={1}>{info.desc}</Text>
          <Text style={styles.meta}>{info.type} · {info.host}:{info.port}</Text>
        </View>

        {/* Chevron */}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Header — v1: "Agents" title + count + settings gear */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
        <TouchableOpacity onPress={handleSettings} style={styles.gearBtn}>
          <GearIcon />
        </TouchableOpacity>
      </View>

      {/* Count below header (v1 style) */}
      <View style={styles.headerCountRow}>
        <Text style={styles.headerCount}>{agents.length} connected</Text>
      </View>

      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={renderAgent}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={Separator}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No agents found</Text>
            <Text style={styles.emptySubtext}>Try scanning for local agents</Text>
            <TouchableOpacity style={styles.scanBtn} onPress={onRefresh}>
              <Text style={styles.scanBtnText}>↻ Scan again</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const Separator = () => <View style={styles.separator} />;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },

  // Header — v1: title + gear icon
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  headerTitle: { ...typography.h2 },
  gearBtn: { padding: 8, borderRadius: borderRadius.full },

  // Count below header (v1: "N connected")
  headerCountRow: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 4,
  },
  headerCount: { ...typography.small },

  // Agent rows as border-separated list items (v1: border-b, no card bg)
  list: { paddingTop: 4 },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  separator: { height: 0 },

  // Avatar: 40x40 gradient with bottom-right status dot
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    position: 'relative',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: colors.bgPrimary,
  },

  // Info (v1: name + dot, desc, type/host/port)
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { ...typography.body, fontWeight: '600' },
  inlineDot: { width: 8, height: 8, borderRadius: 4 },
  desc: { ...typography.small, marginTop: 1 },
  meta: { ...typography.tiny, marginTop: 1 },

  // Chevron
  chevron: { fontSize: 20, color: colors.textMuted, marginLeft: spacing.sm },

  // Empty state
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 80, paddingHorizontal: spacing.xl },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { ...typography.title, marginBottom: spacing.xs },
  emptySubtext: { ...typography.caption, textAlign: 'center' },
  scanBtn: { marginTop: spacing.lg, paddingVertical: spacing.sm, paddingHorizontal: 20, backgroundColor: colors.accentBg, borderRadius: borderRadius.full },
  scanBtnText: { ...typography.caption, color: colors.textSecondary },
});