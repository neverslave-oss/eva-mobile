import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SCREEN_NAMES, MainTabParamList } from '../types';
import { useAgentStore } from '../stores/agentStore';
import { colors, typography, borderRadius, spacing } from '../theme';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

// Snake-E avatar (large for profile header)
const SnakeEIcon = ({ size = 60 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <Defs>
      <LinearGradient id="profGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#58a6ff" />
        <Stop offset="50%" stopColor="#3fb950" />
        <Stop offset="100%" stopColor="#bc8cff" />
      </LinearGradient>
    </Defs>
    <Path d="M60 28 C60 45,62 60,62 75 C62 90,62 105,62 120 C62 135,62 150,60 165 C58 178,60 188,75 192" stroke="url(#profGrad)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M62 48 C80 42,95 40,115 42 C130 44,142 48,148 52" stroke="url(#profGrad)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M148 52 C150 58,145 64,138 65" stroke="url(#profGrad)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M62 95 C80 90,98 88,118 90 C132 92,142 96,146 100" stroke="url(#profGrad)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 100 C148 104,143 110,137 110" stroke="url(#profGrad)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M60 142 C78 140,96 142,116 145 C130 148,140 152,146 156" stroke="url(#profGrad)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 156 C148 162,142 168,135 168" stroke="url(#profGrad)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M75 192 C85 196,98 196,105 190 C112 184,110 175,102 173 C96 172,92 176,93 180" stroke="url(#profGrad)" strokeWidth="9" strokeLinecap="round"/>
    <Ellipse cx="48" cy="18" rx="13" ry="9" fill="url(#profGrad)" opacity="0.95"/>
    <Ellipse cx="42" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="55" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="42" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
    <Ellipse cx="55" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
  </Svg>
);

type TabKey = 'media' | 'files' | 'links';

const MOCK_MEDIA = Array.from({ length: 6 }, (_, i) => ({
  id: `media-${i}`,
  uri: `https://picsum.photos/seed/kernel-${i}/200/200`,
}));

const MOCK_FILES = [
  { id: 'f1', name: 'kernel-mobile-v2.zip', size: 4300 },
  { id: 'f2', name: 'session-log-2026-07.txt', size: 1126 },
  { id: 'f3', name: 'config-backup.json', size: 64 },
];

const MOCK_LINKS = [
  { id: 'l1', label: 'Kernel Docs', url: 'https://docs.kernel.local' },
  { id: 'l2', label: 'GitHub Issues', url: 'https://github.com/issues' },
  { id: 'l3', label: 'API Reference', url: 'https://api.kernel.local' },
];

export default function BotProfileScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'BotProfile'>>();
  const navigation = useNavigation<any>();
  const { agentId } = route.params;
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === agentId));
  const [activeTab, setActiveTab] = useState<TabKey>('media');

  if (!agent) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Agent Not Found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleChat = () => {
    navigation.navigate(SCREEN_NAMES.Chat, { botId: agentId });
  };

  const renderTab = (key: TabKey, label: string) => (
    <TouchableOpacity
      style={[styles.tab, activeTab === key && styles.tabActive]}
      onPress={() => setActiveTab(key)}
    >
      <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerName} numberOfLines={1}>{agent.name}</Text>
      </View>

      {/* Profile info — v1 style large avatar + status */}
      <View style={styles.profileSection}>
        <View style={styles.largeAvatar}>
          <SnakeEIcon size={48} />
        </View>
        <Text style={styles.agentName}>{agent.name}</Text>
        <Text style={[styles.agentStatus, { color: agent.status === 'online' ? colors.success : colors.textSecondary }]}>
          {agent.status === 'online' ? '● online' : agent.status}
        </Text>
      </View>

      {/* Action buttons — v1's Mute/Search/Clear row */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🔇</Text>
          <Text style={styles.actionLabel}>Mute</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionLabel}>Clear</Text>
        </TouchableOpacity>
      </View>

      {/* Start Chat button */}
      <View style={styles.chatRow}>
        <TouchableOpacity style={styles.chatBtn} onPress={handleChat}>
          <Text style={styles.chatBtnText}>Start Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar — v1 style Media/Files/Links */}
      <View style={styles.tabBar}>
        {renderTab('media', 'Media')}
        {renderTab('files', 'Files')}
        {renderTab('links', 'Links')}
      </View>

      {/* Tab content */}
      <ScrollView style={styles.tabContent} contentContainerStyle={styles.tabContentInner}>
        {/* Media tab — 3-column grid */}
        {activeTab === 'media' && (
          MOCK_MEDIA.length > 0 ? (
            <View style={styles.mediaGrid}>
              {MOCK_MEDIA.map((item) => (
                <View key={item.id} style={styles.mediaItem} />
              ))}
            </View>
          ) : (
            <View style={styles.tabEmpty}>
              <Text style={styles.tabEmptyIcon}>🖼️</Text>
              <Text style={styles.tabEmptyText}>No shared media yet</Text>
            </View>
          )
        )}

        {/* Files tab — list */}
        {activeTab === 'files' && (
          MOCK_FILES.length > 0 ? (
            <View style={styles.filesList}>
              {MOCK_FILES.map((file) => (
                <View key={file.id} style={styles.fileRow}>
                  <View style={styles.fileIcon}>
                    <Text style={styles.fileIconText}>📄</Text>
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{file.name}</Text>
                    <Text style={styles.fileSize}>{formatSize(file.size)}</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.tabEmpty}>
              <Text style={styles.tabEmptyIcon}>📁</Text>
              <Text style={styles.tabEmptyText}>No shared files yet</Text>
            </View>
          )
        )}

        {/* Links tab — list */}
        {activeTab === 'links' && (
          MOCK_LINKS.length > 0 ? (
            <View style={styles.filesList}>
              {MOCK_LINKS.map((link) => (
                <View key={link.id} style={styles.fileRow}>
                  <View style={styles.fileIcon}>
                    <Text style={styles.fileIconText}>🔗</Text>
                  </View>
                  <View style={styles.fileInfo}>
                    <Text style={styles.fileName} numberOfLines={1}>{link.label}</Text>
                    <Text style={styles.fileSize}>{link.url}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.tabEmpty}>
              <Text style={styles.tabEmptyIcon}>🔗</Text>
              <Text style={styles.tabEmptyText}>No links yet</Text>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  backBtn: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  backText: {
    fontSize: 16,
    color: colors.accent,
  },
  headerName: {
    ...typography.title,
  },
  // Profile
  profileSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  largeAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gradientBot[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  agentName: {
    ...typography.h1,
    marginBottom: spacing.xs,
  },
  agentStatus: {
    ...typography.caption,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSecondary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: 10,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  // Chat button row
  chatRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  chatBtn: {
    paddingVertical: spacing.md,
    backgroundColor: colors.buttonSuccess,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  chatBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  // Tab bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgSecondary,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.accent,
  },
  // Tab content
  tabContent: {
    flex: 1,
  },
  tabContentInner: {
    paddingBottom: spacing.xl,
  },
  // Media grid (3 cols)
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 2,
  },
  mediaItem: {
    width: '33.33%',
    aspectRatio: 1,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  // Files
  filesList: {
    paddingVertical: spacing.xs,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIconText: {
    fontSize: 16,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 18,
    color: colors.textDim,
  },
  // Empty
  tabEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  tabEmptyIcon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  tabEmptyText: {
    ...typography.caption,
    color: colors.textDim,
  },
  // Fallback error
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    ...typography.title,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  backLink: {
    fontSize: 13,
    color: colors.accent,
  },
});