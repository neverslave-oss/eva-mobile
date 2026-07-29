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

const STATUS_COLORS: Record<Agent['status'], string> = {
  online: '#3fb950',
  offline: '#6c7883',
  checking: '#d29922',
};

export default function BotListScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { agents, selectedAgentId, selectAgent } = useAgentStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    // Simulate refresh — real implementation would poll KernelApiClient
    await new Promise((r) => setTimeout(r, 1000));
    setRefreshing(false);
  }, []);

  const handleAgentPress = (agent: Agent) => {
    selectAgent(agent.id);
    navigation.navigate(SCREEN_NAMES.Chat, { botId: agent.id });
  };

  const renderAgent = ({ item }: { item: Agent }) => {
    const isSelected = item.id === selectedAgentId;
    return (
      <TouchableOpacity
        style={[styles.agentCard, isSelected && styles.agentCardSelected]}
        activeOpacity={0.7}
        onPress={() => handleAgentPress(item)}
        onLongPress={() => navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: item.id })}
      >
        <View style={styles.agentAvatar}>
          <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] }]} />
        </View>
        <View style={styles.agentInfo}>
          <Text style={styles.agentName}>{item.name}</Text>
          <Text style={styles.agentStatus}>{item.status}</Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agents</Text>
        <Text style={styles.headerCount}>{agents.length} available</Text>
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
            tintColor="#58a6ff"
            colors={['#58a6ff']}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No agents found</Text>
            <Text style={styles.emptySubtext}>Connect to a server to see your agents</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerCount: {
    fontSize: 11,
    color: '#6c7883',
    marginTop: 2,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#17212b',
    borderRadius: 12,
  },
  agentCardSelected: {
    borderColor: '#58a6ff',
    borderWidth: 1,
  },
  agentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#242f3d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#17212b',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  agentStatus: {
    fontSize: 11,
    color: '#6c7883',
    textTransform: 'capitalize',
  },
  chevron: {
    fontSize: 20,
    color: '#6c7883',
    marginLeft: 8,
  },
  separator: {
    height: 8,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8b949e',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#6c7883',
  },
});