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
  TextInput,
  Animated,
  Modal,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { SCREEN_NAMES, Message, MainTabParamList } from '../types';
import { useAgentStore } from '../stores/agentStore';
import MessageBubble from '../components/MessageBubble';
import { colors, typography, borderRadius, spacing } from '../theme';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';

// ─── SVG Icons (v1-matching) ───

const SnakeEIcon = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <Defs>
      <LinearGradient id="cg" x1="0%" y1="0%" x2="100%" y2="100%">
        <Stop offset="0%" stopColor="#58a6ff" />
        <Stop offset="50%" stopColor="#3fb950" />
        <Stop offset="100%" stopColor="#bc8cff" />
      </LinearGradient>
    </Defs>
    <Path d="M60 28 C60 45,62 60,62 75 C62 90,62 105,62 120 C62 135,62 150,60 165 C58 178,60 188,75 192" stroke="url(#cg)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M62 48 C80 42,95 40,115 42 C130 44,142 48,148 52" stroke="url(#cg)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M148 52 C150 58,145 64,138 65" stroke="url(#cg)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M62 95 C80 90,98 88,118 90 C132 92,142 96,146 100" stroke="url(#cg)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 100 C148 104,143 110,137 110" stroke="url(#cg)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M60 142 C78 140,96 142,116 145 C130 148,140 152,146 156" stroke="url(#cg)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 156 C148 162,142 168,135 168" stroke="url(#cg)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M75 192 C85 196,98 196,105 190 C112 184,110 175,102 173 C96 172,92 176,93 180" stroke="url(#cg)" strokeWidth="9" strokeLinecap="round"/>
    <Ellipse cx="48" cy="18" rx="13" ry="9" fill="url(#cg)" opacity="0.95"/>
    <Ellipse cx="42" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="55" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="42" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
    <Ellipse cx="55" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
  </Svg>
);

const ArrowBack = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M15 19l-7-7 7-7" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const RetryIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const FolderIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const MenuIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M4 6h16M4 12h16M4 18h16" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SmileyIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke="#8b949e" strokeWidth="2"/>
    <Path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#8b949e" strokeWidth="2" strokeLinecap="round"/>
    <Circle cx="9" cy="9" r="1" fill="#8b949e"/>
    <Circle cx="15" cy="9" r="1" fill="#8b949e"/>
  </Svg>
);

const PaperclipIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const CameraIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#58a6ff" strokeWidth="2"/>
    <Circle cx="12" cy="13" r="3" stroke="#58a6ff" strokeWidth="2"/>
  </Svg>
);

const SendIcon2 = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
  </Svg>
);

const ThreeDotsIcon = () => (
  <Svg width="20" height="20" viewBox="0 0 24 24" fill="#8b949e">
    <Circle cx="12" cy="5" r="1.5"/>
    <Circle cx="12" cy="12" r="1.5"/>
    <Circle cx="12" cy="19" r="1.5"/>
  </Svg>
);

const ExpandIcon = () => (
  <Svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <Path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const SpinnerIcon = () => (
  <View style={{ width: 16, height: 16, borderWidth: 2, borderColor: '#58a6ff', borderTopColor: 'transparent', borderRadius: 8 }} />
);

// ─── Typing Dots (bounce animation) ───

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
    return () => { anim1.stopAnimation(); anim2.stopAnimation(); anim3.stopAnimation(); };
  }, []);

  return (
    <View style={{ flexDirection: 'row', gap: 3, paddingHorizontal: 4, alignItems: 'flex-end' }}>
      {[anim1, anim2, anim3].map((anim, i) => (
        <Animated.View key={i} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, { transform: [{ translateY: anim }] }]} />
      ))}
    </View>
  );
};

// ─── Emoji Grid ───

const EMOJIS = ['😀','😂','🤣','😍','🥰','😘','😋','🤔','👍','👎','👏','🙌','💪','🔥','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🎉','✨','🌟','💯','✅','❌','⚠️','💡','📌','📎','🗑️','🎵','📷','📄','🎙️','💻','🔧','🛠️','🧬','🤖','🐱','🐶','🦊','🐼','🐨'];

const BOT_COMMANDS = ['/help', '/new', '/status', '/skills', '/routines', '/models', '/evolve', '/replica', '/version', '/init', '/system', '/thoughts', '/verbose', '/voices', '/workspaces'];

const MOCK_MESSAGES: Record<string, Message[]> = {};
const QUICK_CMDS = ['/status', '/skills', '/routines', '/models'];

export default function ChatScreen() {
  const route = useRoute<RouteProp<MainTabParamList, 'Chat'>>();
  const navigation = useNavigation<any>();
  const botId = route.params?.botId;
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === botId));
  const flatListRef = useRef<FlatList>(null);
  const textareaRef = useRef<TextInput>(null);
  const [inputHeight, setInputHeight] = useState(44);

  // State
  const [messages, setMessages] = useState<Message[]>(botId ? MOCK_MESSAGES[botId] || [] : []);
  const [composerText, setComposerText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [toolsEnabled, setToolsEnabled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showCommands, setShowCommands] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [expandText, setExpandText] = useState('');

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // Detect / in composer
  useEffect(() => {
    setShowCommands(composerText.startsWith('/') && composerText.length > 1);
  }, [composerText]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim() || !botId) return;
    const userMsg: Message = { id: `msg-${Date.now()}`, chatId: botId, role: 'user', text: text.trim(), timestamp: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingText('');

    const responseText = `Hello! I'm ${agent?.name || 'Kernel'}. I received your message. Real SSE streaming will be wired in a later update.`;
    let chunkIndex = 0;
    const interval = setInterval(() => {
      chunkIndex++;
      setStreamingText(responseText.slice(0, chunkIndex * 4));
      if (chunkIndex * 4 >= responseText.length) {
        clearInterval(interval);
        setIsStreaming(false);
        setMessages((prev) => [...prev, { id: `msg-${Date.now()}-ai`, chatId: botId, role: 'assistant', text: responseText, timestamp: Date.now() }]);
        setStreamingText('');
      }
    }, 40);
  }, [botId, agent]);

  const handleSendFromComposer = () => {
    if (!composerText.trim() || isStreaming) return;
    handleSend(composerText);
    setComposerText('');
    setInputHeight(44);
  };

  const handleSendFromExpand = () => {
    if (!expandText.trim() || isStreaming) return;
    handleSend(expandText);
    setExpandText('');
    setExpandOpen(false);
  };

  const handleAgentTap = () => {
    if (botId) navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: botId });
  };

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    if (action === 'new') {
      setMessages([]);
      setIsStreaming(false);
      setStreamingText('');
    } else if (action === 'profile' && botId) {
      navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: botId });
    } else if (action === 'settings') {
      navigation.navigate(SCREEN_NAMES.Settings);
    }
  };

  const insertEmoji = (emoji: string) => {
    setComposerText((prev) => prev + emoji);
    setEmojiOpen(false);
  };

  // ─── Message renderer ───

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={item.role === 'user' ? styles.msgRowUser : styles.msgRowBot}>
      {item.role === 'assistant' && (
        <TouchableOpacity onPress={handleAgentTap} style={styles.msgBotAvatarWrap}>
          <View style={styles.msgBotAvatar}><SnakeEIcon size={20} /></View>
        </TouchableOpacity>
      )}
      <View style={{ maxWidth: '82%' }}>
        {item.role === 'assistant' && (
          <TouchableOpacity onPress={handleAgentTap}><Text style={styles.msgAgentLabel}>{agent?.name || 'Agent'}</Text></TouchableOpacity>
        )}
        <MessageBubble message={item} />
        <Text style={[styles.msgTimestamp, item.role === 'user' && styles.msgTimestampRight]}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyAvatar}><SnakeEIcon size={40} /></View>
      <Text style={styles.emptyTitle}>{agent?.name || 'Kernel Evolving'}</Text>
      <Text style={styles.emptySubtitle}>Self-evolving AI agent</Text>
      <Text style={styles.emptyHint}>Chat with your kernel-evolving agent. Use / for commands.</Text>
      <View style={styles.cmdChips}>
        {QUICK_CMDS.map((cmd) => (
          <TouchableOpacity key={cmd} style={styles.cmdChip} onPress={() => { handleSend(cmd); }}>
            <Text style={styles.cmdChipText}>{cmd}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const StreamingFooter = () => {
    if (!isStreaming || !streamingText) return null;
    return (
      <View style={styles.msgRowBot}>
        <View style={styles.msgBotAvatarWrap}>
          <View style={styles.msgBotAvatar}><SnakeEIcon size={20} /></View>
        </View>
        <View style={{ maxWidth: '82%' }}>
          <Text style={styles.msgAgentLabel}>{agent?.name || 'Agent'} typing…</Text>
          <View style={[styles.streamingBubble]}>
            <Text style={styles.streamingText}>{streamingText}</Text>
            <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
              {[0, 150, 300].map((d, i) => {
                const anim = useRef(new Animated.Value(0)).current;
                useEffect(() => {
                  const bounce = Animated.loop(
                    Animated.sequence([
                      Animated.delay(d),
                      Animated.timing(anim, { toValue: -3, duration: 300, useNativeDriver: true }),
                      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
                    ]),
                  );
                  bounce.start();
                  return () => anim.stopAnimation();
                }, []);
                return <Animated.View key={i} style={[{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.accent }, { transform: [{ translateY: anim }] }]} />;
              })}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const NoBotState = () => (
    <View style={styles.noAgent}>
      <Text style={styles.noAgentTitle}>No Agent Selected</Text>
      <Text style={styles.noAgentSubtext}>Select an agent from the list to start chatting</Text>
    </View>
  );

  // ─── Render ───

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* ═══ HEADER — v1 match: ← avatar ● retry ⌂ name+typing [Agent] ⋮ ═══ */}
      <View style={styles.header}>
        {/* Back arrow */}
        <TouchableOpacity style={styles.hdrBtn} onPress={() => navigation.navigate(SCREEN_NAMES.BotList)}>
          <ArrowBack />
        </TouchableOpacity>

        {/* Snake-E avatar */}
        <View style={styles.hdrAvatar}><SnakeEIcon size={22} /></View>

        {/* Connection dot + retry (v1: retry when disconnected) */}
        {agent?.status === 'disconnected' ? (
          <TouchableOpacity style={styles.hdrBtn}>
            <RetryIcon />
          </TouchableOpacity>
        ) : (
          <View style={[styles.hdrStatusDot, { backgroundColor: agent?.status === 'online' ? colors.success : colors.textMuted }]} />
        )}

        {/* File tree toggle (v1's folder icon) */}
        <TouchableOpacity style={styles.hdrBtn}>
          <FolderIcon />
        </TouchableOpacity>

        {/* Name + typing/bot subtitle (tappable → profile) */}
        <TouchableOpacity style={styles.hdrInfo} onPress={handleAgentTap}>
          <Text style={styles.hdrTitle} numberOfLines={1}>{agent?.name || 'Chat'}</Text>
          {isStreaming ? (
            <View style={styles.hdrTyping}><TypingDots color={colors.accent} /><Text style={styles.hdrTypingLabel}>typing</Text></View>
          ) : (
            <Text style={styles.hdrSub}>{agent?.status || 'bot'}</Text>
          )}
        </TouchableOpacity>

        {/* Chat/Agent toggle (v1's tools toggle) */}
        <TouchableOpacity style={[styles.hdrToggle, toolsEnabled && styles.hdrToggleActive]} onPress={() => setToolsEnabled(!toolsEnabled)}>
          <Text style={[styles.hdrToggleText, toolsEnabled && styles.hdrToggleTextActive]}>{toolsEnabled ? '🛠️ Agent' : '💬 Chat'}</Text>
        </TouchableOpacity>

        {/* 3-dot overflow menu (v1's ⋮ with dropdown) */}
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={styles.hdrBtn} onPress={() => setMenuOpen(!menuOpen)}>
            <ThreeDotsIcon />
          </TouchableOpacity>
          {menuOpen && (
            <>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
              <View style={styles.dropdown}>
                {[
                  { key: 'new', icon: '➕', label: 'New conversation' },
                  { key: 'profile', icon: 'ℹ️', label: 'Bot info' },
                  { key: 'settings', icon: '⚙️', label: 'Settings' },
                ].map((item) => (
                  <TouchableOpacity key={item.key} style={styles.dropdownItem} onPress={() => handleMenuAction(item.key)}>
                    <Text style={styles.dropdownItemText}>{item.icon} {item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </View>
      </View>

      {/* ═══ MESSAGES ═══ */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {!botId ? <NoBotState /> : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={<StreamingFooter />}
          />
        )}

        {/* ═══ COMPOSER — v1 match: ≡ 😊 textarea↗ 📎 camera/send ═══ */}
        {botId && (
          <View style={styles.composer}>
            {/* Menu button (≡, blue) — opens command grid */}
            <TouchableOpacity style={styles.compMenuBtn} onPress={() => setComposerText('/')}>
              <MenuIcon />
            </TouchableOpacity>

            {/* Emoji button */}
            <TouchableOpacity style={styles.compIconBtn} onPress={() => setEmojiOpen(!emojiOpen)}>
              <SmileyIcon />
            </TouchableOpacity>

            {/* Textarea with expand icon (v1's auto-resize + ↗) */}
            <View style={styles.compInputWrap}>
              <TextInput
                ref={textareaRef}
                style={[styles.compInput, { height: Math.min(inputHeight, 120) }]}
                value={composerText}
                onChangeText={setComposerText}
                placeholder="Message"
                placeholderTextColor={colors.textMuted}
                multiline
                onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height + 24)}
                onSubmitEditing={handleSendFromComposer}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.compExpandBtn} onPress={() => { setExpandText(composerText); setExpandOpen(true); }}>
                <ExpandIcon />
              </TouchableOpacity>
            </View>

            {/* Paperclip (attachment) — only when empty */}
            {!composerText.trim() && (
              <View style={{ position: 'relative' }}>
                <TouchableOpacity style={styles.compIconBtn} onPress={() => setPickerOpen(!pickerOpen)}>
                  <PaperclipIcon />
                </TouchableOpacity>
                {pickerOpen && (
                  <>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} />
                    <View style={styles.pickerDropdown}>
                      {['📷 Camera', '🖼️ Gallery', '📄 File'].map((item) => (
                        <TouchableOpacity key={item} style={styles.pickerItem} onPress={() => setPickerOpen(false)}>
                          <Text style={styles.pickerItemText}>{item}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Send / Camera toggle (v1: camera icon when empty, send when has text) */}
            <TouchableOpacity
              style={[styles.compSendBtn, composerText.trim() ? styles.compSendBtnActive : styles.compSendBtnIdle]}
              onPress={composerText.trim() && !isStreaming ? handleSendFromComposer : undefined}
            >
              {composerText.trim() ? <SendIcon2 /> : <CameraIcon />}
            </TouchableOpacity>
          </View>
        )}

        {/* ─── Command Grid Sheet (when just '/' is typed) ─── */}
        {showCommands && composerText === '/' && (
          <View style={styles.cmdSheet}>
            <Text style={styles.cmdSheetLabel}>BOT COMMANDS</Text>
            <View style={styles.cmdGrid}>
              {BOT_COMMANDS.map((cmd) => (
                <TouchableOpacity key={cmd} style={styles.cmdGridBtn} onPress={() => { setComposerText(cmd + ' '); }}>
                  <Text style={styles.cmdGridBtnText}>{cmd}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ─── Emoji Picker Panel ─── */}
        {emojiOpen && (
          <View style={styles.emojiPanel}>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((emoji) => (
                <TouchableOpacity key={emoji} style={styles.emojiCell} onPress={() => insertEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ─── Fullscreen Text Editor Overlay ─── */}
      <Modal visible={expandOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.expandOverlay}>
          <View style={styles.expandHeader}>
            <TouchableOpacity onPress={() => setExpandOpen(false)} style={styles.expandClose}>
              <Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
            <Text style={{ ...typography.title, flex: 1 }}>Edit message</Text>
            <TouchableOpacity style={styles.expandSendBtn} onPress={handleSendFromExpand}>
              <Text style={styles.expandSendText}>Send</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.expandInput}
            value={expandText}
            onChangeText={setExpandText}
            placeholder="Message"
            placeholderTextColor={colors.textMuted}
            multiline
            autoFocus
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 8,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  hdrBtn: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  hdrAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.gradientOnline[0],
    alignItems: 'center', justifyContent: 'center',
  },
  hdrStatusDot: { width: 8, height: 8, borderRadius: 4 },
  hdrInfo: { flex: 1, paddingHorizontal: 4 },
  hdrTitle: { ...typography.title, fontSize: 14 },
  hdrSub: { ...typography.small, textTransform: 'capitalize' },
  hdrTyping: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hdrTypingLabel: { ...typography.small, color: colors.accent },
  hdrToggle: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.accentBg,
    borderWidth: 1, borderColor: colors.borderLight,
  },
  hdrToggleActive: { backgroundColor: colors.buttonPrimary, borderColor: colors.buttonPrimary },
  hdrToggleText: { fontSize: 10, fontWeight: '500', color: colors.textSecondary },
  hdrToggleTextActive: { color: '#fff' },

  // ── Dropdown menu (⋮) ──
  dropdown: {
    position: 'absolute', right: 0, top: 36,
    width: 180,
    backgroundColor: '#21262d',
    borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    paddingVertical: 4,
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: spacing.lg },
  dropdownItemText: { fontSize: 13, color: '#c9d1d9' },

  // ── Messages ──
  msgList: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  msgRowBot: { flexDirection: 'row', marginBottom: 10, justifyContent: 'flex-start' },
  msgRowUser: { flexDirection: 'row', marginBottom: 10, justifyContent: 'flex-end' },
  msgBotAvatarWrap: { marginRight: 8, alignSelf: 'flex-end' },
  msgBotAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gradientBot[0], alignItems: 'center', justifyContent: 'center' },
  msgAgentLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2, marginLeft: 4 },
  msgTimestamp: { fontSize: 10, color: colors.textDim, marginTop: 1, marginLeft: 4 },
  msgTimestampRight: { textAlign: 'right', marginRight: 4 },

  // Streaming
  streamingBubble: {
    backgroundColor: colors.bgBubbleBot,
    paddingHorizontal: 14, paddingVertical: 10,
    borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg,
    borderBottomLeftRadius: 4, borderBottomRightRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight,
  },
  streamingText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },

  // ── Empty state ──
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gradientBot[0], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { ...typography.h2, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.caption, marginBottom: spacing.lg },
  emptyHint: { ...typography.caption, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
  cmdChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  cmdChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bgSurface, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  cmdChipText: { ...typography.caption, color: colors.textSecondary },

  // ── No agent ──
  noAgent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  noAgentTitle: { ...typography.title, color: colors.textSecondary, marginBottom: spacing.xs },
  noAgentSubtext: { ...typography.caption, textAlign: 'center' },

  // ── Composer ──
  composer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 10, paddingVertical: 8,
    backgroundColor: colors.bgCard,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle,
  },
  compMenuBtn: { padding: 8, marginBottom: 2 },
  compIconBtn: { padding: 8, marginBottom: 2 },
  compInputWrap: { flex: 1, position: 'relative', marginHorizontal: 2 },
  compInput: {
    backgroundColor: colors.accentBg,
    color: colors.textPrimary,
    fontSize: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    paddingRight: 28,
    borderRadius: borderRadius.lg,
    maxHeight: 120,
    lineHeight: 20,
  },
  compExpandBtn: { position: 'absolute', top: 8, right: 6, padding: 2 },
  compSendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 2, marginBottom: 2,
  },
  compSendBtnActive: { backgroundColor: colors.buttonPrimary },
  compSendBtnIdle: { backgroundColor: colors.accentBg },

  // ── Picker dropdown ──
  pickerDropdown: {
    position: 'absolute', bottom: 48, right: 0,
    width: 140,
    backgroundColor: '#21262d',
    borderWidth: 1, borderColor: colors.borderLight,
    borderRadius: borderRadius.lg,
    padding: 4,
    zIndex: 100,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  pickerItem: { paddingVertical: 8, paddingHorizontal: spacing.md },
  pickerItemText: { fontSize: 12, color: '#c9d1d9' },

  // ── Command sheet ──
  cmdSheet: { backgroundColor: colors.bgCard, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle, padding: spacing.md },
  cmdSheetLabel: { ...typography.label, marginBottom: 8 },
  cmdGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  cmdGridBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#121c2b', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.borderLight },
  cmdGridBtnText: { fontSize: 11, color: '#c9d1d9' },

  // ── Emoji panel ──
  emojiPanel: { backgroundColor: colors.bgCard, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle, padding: spacing.sm, maxHeight: 160 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  emojiCell: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  emojiText: { fontSize: 22 },

  // ── Fullscreen editor ──
  expandOverlay: { flex: 1, backgroundColor: colors.bgPrimary },
  expandHeader: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle,
  },
  expandClose: { padding: 4 },
  expandSendBtn: { paddingHorizontal: spacing.lg, paddingVertical: 6, backgroundColor: colors.accent, borderRadius: borderRadius.full },
  expandSendText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  expandInput: {
    flex: 1,
    padding: spacing.lg,
    fontSize: 14,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    lineHeight: 22,
  },
});
