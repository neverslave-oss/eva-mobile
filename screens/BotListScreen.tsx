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
import { SCREEN_NAMES, Agent, MainTabParamList } from '../types';
import { useAgentStore } from '../stores/agentStore';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { colors, typography, borderRadius, spacing } from '../theme';
import Svg, { Path, Ellipse } from 'react-native-svg';

const STATUS_COLORS: Record<Agent['status'], string> = {
  online: colors.success,
  offline: colors.textMuted,
  checking: colors.warning,
};

// Mini snake-E avatar for agent list (v1's brand identity)
const SnakeEAvatar = ({ size = 40 }: { size?: number }) => {
  const s = size;
  return (
    <Svg width={s} height={s} viewBox="0 0 200 200" fill="none">
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
};

export default function BotListScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
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

  const renderAgent = ({ item }: { item: Agent }) => {
    const isSelected = item.id === selectedAgentId;
    const isOnline = item.status === 'online';
    const gradFrom = isOnline ? colors.gradientOnline[0] : colors.gradientOffline[0];
    const gradTo = isOnline ? colors.gradientOnline[1] : colors.gradientOffline[1];
    // Map agent IDs to mock descriptions matching v1 style
    const descriptions: Record<string, { desc: string; type: string; host: string; port: number }> = {
      'kernel-main': { desc: 'Primary self-evolving agent', type: 'kernel', host: 'localhost', port: 8779 },
      marty: { desc: 'Marketing content agent', type: 'agent', host: 'localhost', port: 8768 },
      olly: { desc: 'Dev/infra assistant', type: 'agent', host: 'localhost', port: 18789 },
      lawy: { desc: 'Legal document AI', type: 'agent', host: 'localhost', port: 8771 },
      sage: { desc: 'Financial analytics', type: 'agent', host: 'localhost', port: 8772 },
    };
    const info = descriptions[item.id] || { desc: 'Agent', type: 'agent', host: 'localhost', port: 0 };

    return (
      <TouchableOpacity
        style={[styles.agentCard, isSelected && styles.agentCardSelected]}
        activeOpacity={0.7}
        onPress={() => handleAgentPress(item)}
        onLongPress={() => navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: item.id })}
      >
        {/* Gradient avatar — v1 style */}
        <View style={[styles.avatar, { backgroundColor: gradFrom }]}>
          <SnakeEAvatar size={28} />
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
        </View>

        {/* Info — v1 shows description + type/host/port */}
        <View style={styles.agentInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.agentName} numberOfLines={1}>{item.name}</Text>
            <View style={[styles.inlineDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
          </View>
          <Text style={styles.agentDesc} numberOfLines={1}>{info.desc}</Text>
          <Text style={styles.agentMeta}>{info.type} · {info.host}:{info.port}</Text>
        </View>

        {/* Chevron arrow — v1 style */}
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
        <Text style={styles.headerCount}>{agents.length} connected</Text>
      </View>
      <FlatList
        data={agents}
        keyExtractor={(item) => item.id}
        renderItem={renderAgent}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyTitle}>No agents found</Text>
            <Text style={styles.emptySubtext}>Try scanning for local agents</Text>
            <TouchableOpacity style={styles.scanButton} onPress={onRefresh}>
              <Text style={styles.scanButtonText}>↻ Scan again</Text>
            </TouchableOpacity>
          </View>
        }
      />
      {/* Refresh hint at bottom — v1 style */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>↻ Pull to refresh</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 16,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerTitle: {
    ...typography.h2,
  },
  headerCount: {
    ...typography.tiny,
    marginTop: 2,
  },
  list: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  agentCardSelected: {
    backgroundColor: colors.bgHover,
  },
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
  agentInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  agentName: {
    ...typography.body,
    fontWeight: '600',
  },
  inlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  agentDesc: {
    ...typography.small,
    marginTop: 1,
  },
  agentMeta: {
    ...typography.tiny,
    marginTop: 1,
  },
  chevron: {
    fontSize: 20,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  separator: {
    height: 0,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.md,
  },
  emptyTitle: {
    ...typography.title,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  scanButton: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: 20,
    backgroundColor: colors.accentBg,
    borderRadius: borderRadius.full,
  },
  scanButtonText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  footerText: {
    ...typography.tiny,
  },
});