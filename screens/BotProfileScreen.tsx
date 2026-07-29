import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SCREEN_NAMES, MainTabParamList, Agent } from '../types';
import { useAgentStore } from '../stores/agentStore';
import AgentAvatar from '../components/AgentAvatar';
import ConnectionBadge from '../components/ConnectionBadge';
import MediaGrid from '../components/MediaGrid';
import FileList from '../components/FileList';
import InlineButtons from '../components/InlineButtons';

const MOCK_MEDIA = Array.from({ length: 6 }, (_, i) => ({
  id: `media-${i}`,
  uri: `https://picsum.photos/seed/kernel-${i}/200/200`,
  type: 'image' as const,
}));

const MOCK_FILES = [
  { id: 'f1', name: 'kernel-mobile-v2.zip', size: '4.2 MB' },
  { id: 'f2', name: 'session-log-2026-07.txt', size: '1.1 MB' },
  { id: 'f3', name: 'config-backup.json', size: '64 KB' },
];

const MOCK_BUTTONS = [
  { id: 'btn1', text: 'New Chat', action: 'new_chat' },
  { id: 'btn2', text: 'Restart Agent', action: 'restart' },
  { id: 'btn3', text: 'Update Status', action: 'update_status' },
];

export default function BotProfileScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'BotProfile'>>();
  const navigation = useNavigation<any>();
  const { agentId } = route.params;
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === agentId));

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

  const handleButtonAction = (action: string) => {
    console.log('Action:', action, 'Agent:', agentId);
    // Wire to real actions in a later update
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        </View>

        {/* Agent info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            <AgentAvatar name={agent.name} size={72} status={agent.status} />
          </View>
          <Text style={styles.agentName}>{agent.name}</Text>
          <ConnectionBadge status={agent.status} />
          <Text style={styles.agentId}>ID: {agent.id}</Text>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.primaryAction} onPress={handleChat}>
              <Text style={styles.primaryActionText}>Start Chat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Inline buttons */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ACTIONS</Text>
          <InlineButtons buttons={MOCK_BUTTONS} onPress={handleButtonAction} />
        </View>

        {/* Media */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEDIA</Text>
          <MediaGrid media={MOCK_MEDIA} />
        </View>

        {/* Files */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FILES</Text>
          <FileList files={MOCK_FILES} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#58a6ff',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarSection: {
    marginBottom: 12,
  },
  agentName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  agentId: {
    fontSize: 10,
    color: '#6c7883',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    color: '#8b949e',
    letterSpacing: 1,
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: 'row',
  },
  primaryAction: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#238636',
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: '#e4e4e7',
    marginBottom: 8,
  },
  backLink: {
    fontSize: 13,
    color: '#58a6ff',
  },
});