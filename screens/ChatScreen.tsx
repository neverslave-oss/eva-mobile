import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SCREEN_NAMES, Message, MainTabParamList } from '../types';
import { useAgentStore } from '../stores/agentStore';
import MessageBubble from '../components/MessageBubble';
import StreamingBubble from '../components/StreamingBubble';
import ComposerBar from '../components/ComposerBar';

const MOCK_MESSAGES: Record<string, Message[]> = {};

export default function ChatScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const navigation = useNavigation<any>();
  const botId = route.params?.botId;
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === botId));
  const flatListRef = useRef<FlatList>(null);

  const [messages, setMessages] = useState<Message[]>(
    botId ? MOCK_MESSAGES[botId] || [] : []
  );
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || !botId) return;

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        chatId: botId,
        role: 'user',
        text: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);
      setStreamingText('');

      // Simulate streaming response — real impl uses KernelApiClient SSE
      const responseText = `Hello! I'm ${agent?.name || 'Kernel'}. I received your message. Real SSE streaming will be wired in a later update.`;
      let chunkIndex = 0;
      const interval = setInterval(() => {
        chunkIndex++;
        setStreamingText(responseText.slice(0, chunkIndex * 4));
        if (chunkIndex * 4 >= responseText.length) {
          clearInterval(interval);
          setIsStreaming(false);
          const assistantMsg: Message = {
            id: `msg-${Date.now()}-ai`,
            chatId: botId,
            role: 'assistant',
            text: responseText,
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, assistantMsg]);
          setStreamingText('');
        }
      }, 40);
    },
    [botId, agent]
  );

  const handleAgentTap = () => {
    if (botId) {
      navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: botId });
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageWrapper}>
      {item.role === 'assistant' && (
        <TouchableOpacity onPress={handleAgentTap}>
          <Text style={styles.agentNameLabel}>{agent?.name || 'Agent'}</Text>
        </TouchableOpacity>
      )}
      <MessageBubble message={item} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0f1a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate(SCREEN_NAMES.BotList)}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{agent?.name || 'Chat'}</Text>
          {agent && (
            <Text style={[styles.headerStatus, { color: agent.status === 'online' ? '#3fb950' : '#6c7883' }]}>
              {agent.status}
            </Text>
          )}
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleAgentTap}>
          <Text style={styles.profileButtonText}>Info</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!botId ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Agent Selected</Text>
            <Text style={styles.emptySubtext}>Select an agent from the list to start chatting</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>{agent?.name || 'Agent'}</Text>
                <Text style={styles.emptySubtext}>Start a conversation by typing below</Text>
              </View>
            }
            ListFooterComponent={
              isStreaming && streamingText ? (
                <View style={styles.messageWrapper}>
                  <TouchableOpacity onPress={handleAgentTap}>
                    <Text style={styles.agentNameLabel}>{agent?.name || 'Agent'} typing…</Text>
                  </TouchableOpacity>
                  <StreamingBubble text={streamingText} />
                </View>
              ) : null
            }
          />
        )}

        {botId && (
          <View style={styles.composerWrapper}>
            <ComposerBar onSend={handleSend} disabled={isStreaming} />
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1a',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242f3d',
  },
  backButton: {
    paddingRight: 8,
  },
  backText: {
    fontSize: 16,
    color: '#58a6ff',
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerStatus: {
    fontSize: 10,
    textTransform: 'capitalize',
  },
  profileButton: {
    paddingLeft: 8,
  },
  profileButtonText: {
    fontSize: 13,
    color: '#58a6ff',
  },
  messageList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  messageWrapper: {
    marginBottom: 12,
  },
  agentNameLabel: {
    fontSize: 10,
    color: '#6c7883',
    marginBottom: 2,
    marginLeft: 4,
  },
  composerWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#242f3d',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e4e4e7',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: '#6c7883',
    textAlign: 'center',
  },
});