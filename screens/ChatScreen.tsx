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
  Animated,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SCREEN_NAMES, Message, MainTabParamList } from '../types';
import { useAgentStore } from '../stores/agentStore';
import MessageBubble from '../components/MessageBubble';
import StreamingBubble from '../components/StreamingBubble';
import ComposerBar from '../components/ComposerBar';
import { colors, typography, borderRadius, spacing } from '../theme';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop } from 'react-native-svg';

// Snake-E avatar matching v1's brand identity
const SnakeEIcon = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <Defs>
      <LinearGradient id="chatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#58a6ff" />
        <Stop offset="50%" stopColor="#3fb950" />
        <Stop offset="100%" stopColor="#bc8cff" />
      </LinearGradient>
    </Defs>
    <Path d="M60 28 C60 45,62 60,62 75 C62 90,62 105,62 120 C62 135,62 150,60 165 C58 178,60 188,75 192" stroke="url(#chatGrad)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M62 48 C80 42,95 40,115 42 C130 44,142 48,148 52" stroke="url(#chatGrad)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M148 52 C150 58,145 64,138 65" stroke="url(#chatGrad)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M62 95 C80 90,98 88,118 90 C132 92,142 96,146 100" stroke="url(#chatGrad)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 100 C148 104,143 110,137 110" stroke="url(#chatGrad)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M60 142 C78 140,96 142,116 145 C130 148,140 152,146 156" stroke="url(#chatGrad)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 156 C148 162,142 168,135 168" stroke="url(#chatGrad)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M75 192 C85 196,98 196,105 190 C112 184,110 175,102 173 C96 172,92 176,93 180" stroke="url(#chatGrad)" strokeWidth="9" strokeLinecap="round"/>
    <Ellipse cx="48" cy="18" rx="13" ry="9" fill="url(#chatGrad)" opacity="0.95"/>
    <Ellipse cx="42" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="55" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="42" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
    <Ellipse cx="55" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
  </Svg>
);

// Animated typing dots — v1's bounce animation
const TypingDots = ({ color = colors.accent }: { color?: string }) => {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: -4, duration: 300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      );
    bounce(anim1, 0).start();
    bounce(anim2, 150).start();
    bounce(anim3, 300).start();
  }, []);

  const Dot = ({ anim }: { anim: Animated.Value }) => (
    <Animated.View style={[styles.typingDot, { backgroundColor: color, transform: [{ translateY: anim }] }]} />
  );

  return (
    <View style={styles.typingRow}>
      <Dot anim={anim1} />
      <Dot anim={anim2} />
      <Dot anim={anim3} />
    </View>
  );
};

const MOCK_MESSAGES: Record<string, Message[]> = {};

const QUICK_CMDS = ['/status', '/skills', '/routines', '/models'];

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
  const [toolsEnabled, setToolsEnabled] = useState(false); // v1 Chat/Agent toggle

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

      const responseText = `Hello! I'm ${agent?.name || 'Kernel'}. I received your message. Real SSE streaming will be wired once the API layer connects.`;
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
    <View style={[styles.messageRow, item.role === 'user' ? styles.messageRowUser : styles.messageRowBot]}>
      {/* Bot avatar — v1 shows snake-E on bot messages */}
      {item.role === 'assistant' && (
        <TouchableOpacity onPress={handleAgentTap} style={styles.botAvatarWrap}>
          <View style={styles.botAvatar}>
            <SnakeEIcon size={20} />
          </View>
        </TouchableOpacity>
      )}
      <View style={{ maxWidth: '82%' }}>
        {item.role === 'assistant' && (
          <TouchableOpacity onPress={handleAgentTap}>
            <Text style={styles.agentLabel}>{agent?.name || 'Agent'}</Text>
          </TouchableOpacity>
        )}
        <MessageBubble message={item} />
        <Text style={[styles.timestamp, item.role === 'user' && styles.timestampRight]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  // v1 empty state with snake-E avatar and command chips
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyAvatar}>
        <SnakeEIcon size={40} />
      </View>
      <Text style={styles.emptyTitle}>{agent?.name || 'Kernel Evolving'}</Text>
      <Text style={styles.emptySubtitle}>Self-evolving AI agent</Text>
      <Text style={styles.emptyHint}>Chat with your kernel-evolving agent. Use / for commands.</Text>
      <View style={styles.cmdChips}>
        {QUICK_CMDS.map((cmd) => (
          <TouchableOpacity
            key={cmd}
            style={styles.cmdChip}
            onPress={() => handleSend(cmd)}
          >
            <Text style={styles.cmdChipText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* Header — v1 style: back, snake-E avatar, name + typing dots, mode toggle, ⋮ menu */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate(SCREEN_NAMES.BotList)}
        >
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>

        {/* Snake-E avatar */}
        <View style={styles.headerAvatar}>
          <SnakeEIcon size={22} />
        </View>

        {/* Connection dot + name */}
        <View style={styles.headerInfo}>
          <TouchableOpacity onPress={handleAgentTap}>
            <Text style={styles.headerTitle} numberOfLines={1}>{agent?.name || 'Chat'}</Text>
          </TouchableOpacity>
          <View style={styles.headerStatusRow}>
            {isStreaming ? (
              <View style={styles.typingStatus}>
                <TypingDots color={colors.accent} />
                <Text style={styles.typingLabel}>typing</Text>
              </View>
            ) : (
              <View style={styles.statusIndicator}>
                <View style={[styles.statusDot, { backgroundColor: agent?.status === 'online' ? colors.success : colors.textMuted }]} />
                <Text style={styles.statusLabel}>{agent?.status || 'bot'}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Chat/Agent toggle — v1's tools toggle */}
        <TouchableOpacity
          style={[styles.modeToggle, toolsEnabled && styles.modeToggleActive]}
          onPress={() => setToolsEnabled(!toolsEnabled)}
        >
          <Text style={[styles.modeToggleText, toolsEnabled && styles.modeToggleTextActive]}>
            {toolsEnabled ? '🛠️ Agent' : '💬 Chat'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {!botId ? (
          <View style={styles.noAgent}>
            <Text style={styles.noAgentTitle}>No Agent Selected</Text>
            <Text style={styles.noAgentSubtext}>Select an agent from the list to start chatting</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.messageList}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={
              isStreaming && streamingText ? (
                <View style={[styles.messageRow, styles.messageRowBot]}>
                  <View style={styles.botAvatarWrap}>
                    <View style={styles.botAvatar}>
                      <SnakeEIcon size={20} />
                    </View>
                  </View>
                  <View style={{ maxWidth: '82%' }}>
                    <Text style={styles.agentLabel}>{agent?.name || 'Agent'} typing…</Text>
                    <StreamingBubble text={streamingText} />
                  </View>
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
    backgroundColor: colors.bgPrimary,
  },
  flex: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  headerBtn: {
    padding: spacing.xs,
  },
  backArrow: {
    fontSize: 22,
    color: colors.textSecondary,
    paddingHorizontal: 2,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gradientOnline[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    ...typography.title,
  },
  headerStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  typingLabel: {
    ...typography.small,
    color: colors.accent,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    ...typography.small,
    textTransform: 'capitalize',
  },
  modeToggle: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentBg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginLeft: spacing.sm,
  },
  modeToggleActive: {
    backgroundColor: colors.buttonPrimary,
    borderColor: colors.buttonPrimary,
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modeToggleTextActive: {
    color: '#fff',
  },
  // Typing dots animation
  typingRow: {
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Messages
  messageList: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowBot: {
    justifyContent: 'flex-start',
  },
  botAvatarWrap: {
    marginRight: spacing.sm,
    alignSelf: 'flex-end',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gradientBot[0],
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 2,
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 10,
    color: colors.textDim,
    marginTop: 2,
    marginLeft: 4,
  },
  timestampRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  // Empty state — v1 style with command chips
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: spacing.xl,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gradientBot[0],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
  },
  emptyHint: {
    ...typography.caption,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  cmdChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  cmdChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cmdChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  // No agent state
  noAgent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  noAgentTitle: {
    ...typography.title,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  noAgentSubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  // Composer
  composerWrapper: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
});