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
  Alert,
  ScrollView,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';
import { SCREEN_NAMES, Message, RootStackParamList, ProviderRouting } from '../types';
import { useAgentStore } from '../stores/agentStore';
import MessageBubble from '../components/MessageBubble';
import CommandSheet from '../components/CommandSheet';
import ProviderSheet from '../components/ProviderSheet';
import InspectorPanel from '../components/InspectorPanel';
import { colors, typography, borderRadius, spacing } from '../theme';
import Svg, { Path, Ellipse, Defs, LinearGradient, Stop, Circle, Rect } from 'react-native-svg';

// ─── Local types ───
type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ─── Slash command descriptions for autocomplete (source: telegram_bot.py) ───
const SLASH_DESCRIPTIONS: Record<string, string> = {
  '/help': 'Show available commands',
  '/status': 'Agent status, uptime, model info',
  '/skills': 'List loaded skills',
  '/routines': 'List active routines',
  '/models': 'Show active/available models',
  '/local': 'Switch to local model inference',
  '/cloud': 'Switch to cloud provider inference',
  '/provider': 'Pick model provider',
  '/evolve': 'Run self-evolution cycle',
  '/replica': 'Spawn replica agent',
  '/voices': 'Show available voice samples',
  '/voice-clone': 'Clone your voice from a sample',
  '/init': 'Reinitialize agent configuration',
  '/stop': 'Graceful agent shutdown',
  '/restart': 'Full agent restart',
  '/update': 'Pull latest version from repo',
  '/rollback': 'Rollback to previous version',
  '/system': 'System diagnostics (CPU/GPU/RAM)',
  '/version': 'Show agent version info',
  '/thoughts': 'Show Kernel\'s current thoughts',
  '/verbose': 'Toggle verbose logging mode',
  '/workspaces': 'List available agent workspaces',
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ─── SVG Icons ───
const SnakeEIcon = ({ size = 32 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" fill="none">
    <Defs><LinearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0%" stopColor="#58a6ff" /><Stop offset="50%" stopColor="#3fb950" /><Stop offset="100%" stopColor="#bc8cff" /></LinearGradient></Defs>
    <Path d="M60 28 C60 45,62 60,62 75 C62 90,62 105,62 120 C62 135,62 150,60 165 C58 178,60 188,75 192" stroke="url(#sg)" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M62 48 C80 42,95 40,115 42 C130 44,142 48,148 52" stroke="url(#sg)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M148 52 C150 58,145 64,138 65" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M62 95 C80 90,98 88,118 90 C132 92,142 96,146 100" stroke="url(#sg)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 100 C148 104,143 110,137 110" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M60 142 C78 140,96 142,116 145 C130 148,140 152,146 156" stroke="url(#sg)" strokeWidth="10" strokeLinecap="round"/>
    <Path d="M146 156 C148 162,142 168,135 168" stroke="url(#sg)" strokeWidth="8" strokeLinecap="round"/>
    <Path d="M75 192 C85 196,98 196,105 190 C112 184,110 175,102 173 C96 172,92 176,93 180" stroke="url(#sg)" strokeWidth="9" strokeLinecap="round"/>
    <Ellipse cx="48" cy="18" rx="13" ry="9" fill="url(#sg)" opacity="0.95"/>
    <Ellipse cx="42" cy="13" rx="3.5" ry="3" fill="#ff6e40"/><Ellipse cx="55" cy="13" rx="3.5" ry="3" fill="#ff6e40"/>
    <Ellipse cx="42" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/><Ellipse cx="55" cy="13" rx="1.2" ry="2.2" fill="#0a0e1a"/>
  </Svg>
);

const ArrowBack = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M15 19l-7-7 7-7" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const RetryIcon = () => <Svg width="14" height="14" viewBox="0 0 24 24" fill="none"><Path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const FolderIcon = () => <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const MenuIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M4 6h16M4 12h16M4 18h16" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const SmileyIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Circle cx="12" cy="12" r="10" stroke="#8b949e" strokeWidth="2"/><Path d="M8 14s1.5 2 4 2 4-2 4-2" stroke="#8b949e" strokeWidth="2" strokeLinecap="round"/><Circle cx="9" cy="9" r="1" fill="#8b949e"/><Circle cx="15" cy="9" r="1" fill="#8b949e"/></Svg>;
const PaperclipIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const CameraIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" stroke="#58a6ff" strokeWidth="2"/><Circle cx="12" cy="13" r="3" stroke="#58a6ff" strokeWidth="2"/></Svg>;
const SendIcon2 = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="white"><Path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></Svg>;
const ThreeDotsIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="#8b949e"><Circle cx="12" cy="5" r="1.5"/><Circle cx="12" cy="12" r="1.5"/><Circle cx="12" cy="19" r="1.5"/></Svg>;
const ExpandIcon = () => <Svg width="16" height="16" viewBox="0 0 24 24" fill="none"><Path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" stroke="#8b949e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;
const MicIcon = () => <Svg width="20" height="20" viewBox="0 0 24 24" fill="none"><Path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><Path d="M19 10v2a7 7 0 01-14 0v-2" stroke="#58a6ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></Svg>;

// ─── Typing Dots ───
const TypingDots = ({ color = colors.accent }: { color?: string }) => {
  const anim = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];
  useEffect(() => {
    const b = (a: Animated.Value, d: number) => Animated.loop(Animated.sequence([Animated.delay(d), Animated.timing(a, { toValue: -4, duration: 300, useNativeDriver: true }), Animated.timing(a, { toValue: 0, duration: 300, useNativeDriver: true })])).start();
    anim.forEach((a, i) => b(a, i * 150));
    return () => anim.forEach((a) => a.stopAnimation());
  }, []);
  return (<View style={{ flexDirection: 'row', gap: 3, paddingHorizontal: 4, alignItems: 'flex-end' }}>{anim.map((a, i) => <Animated.View key={i} style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, { transform: [{ translateY: a }] }]} />)}</View>);
};

// ─── Mock workspace tree ───
const MOCK_WORKSPACE_TREE: WorkspaceNode[] = [
  { name: 'src/', type: 'dir', children: [{ name: 'services/', type: 'dir', children: [{ name: 'kernel_api.py', type: 'file', size: '12 KB' }, { name: 'sse_streamer.py', type: 'file', size: '8 KB' }] }, { name: 'utils/', type: 'dir', children: [{ name: 'helpers.ts', type: 'file', size: '4 KB' }, { name: 'parser.ts', type: 'file', size: '6 KB' }] }, { name: 'index.ts', type: 'file', size: '2 KB' }] },
  { name: 'config/', type: 'dir', children: [{ name: 'config.yaml', type: 'file', size: '3 KB' }, { name: '.env', type: 'file', size: '1 KB' }] },
  { name: 'README.md', type: 'file', size: '8 KB' },
  { name: 'package.json', type: 'file', size: '1.2 KB' },
];

interface WorkspaceNode { name: string; type: 'dir' | 'file'; children?: WorkspaceNode[]; size?: string; }

// ─── Emojis ───
const EMOJIS = ['😀','😂','🤣','😍','🥰','😘','😋','🤔','👍','👎','👏','🙌','💪','🔥','❤️','🧡','💛','💚','💙','💜','🖤','🤍','🎉','✨','🌟','💯','✅','❌','⚠️','💡','📌','📎','🗑️','🎵','📷','📄','🎙️','💻','🔧','🛠️','🧬','🤖','🐱','🐶','🦊','🐼','🐨'];

const QUICK_CMDS = ['/status', '/skills', '/routines', '/models'];

export default function ChatScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'Chat'>>();
  const navigation = useNavigation<NavProp>();
  const botId = route.params?.botId;
  const agent = useAgentStore((s) => s.agents.find((a) => a.id === botId));
  const storeMessages = useAgentStore((s) => s.messages);
  const storeIsStreaming = useAgentStore((s) => s.isStreaming);
  const sendMessage = useAgentStore((s) => s.sendMessage);
  const sendSlashCommand = useAgentStore((s) => s.sendSlashCommand);
  const clearConversation = useAgentStore((s) => s.clearConversation);
  const fetchProviderRouting = useAgentStore((s) => s.fetchProviderRouting);
  const providerRouting = useAgentStore((s) => s.providerRouting);
  const flatListRef = useRef<FlatList>(null);
  const textareaRef = useRef<TextInput>(null);

  // States
  const [composerText, setComposerText] = useState('');
  const [inputHeight, setInputHeight] = useState(44);
  const [toolsEnabled, setToolsEnabled] = useState(false);

  // Overlay states
  const [menuOpen, setMenuOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [fileTreeOpen, setFileTreeOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [expandOpen, setExpandOpen] = useState(false);
  const [expandText, setExpandText] = useState('');
  // Agent chat tab overlays
  const [commandSheetOpen, setCommandSheetOpen] = useState(false);
  const [providerSheetOpen, setProviderSheetOpen] = useState(false);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);

  // Request audio permission on mount
  useEffect(() => {
    (async () => {
      try {
        const perm = await Audio.requestPermissionsAsync();
        setAudioPermission(perm.granted);
      } catch {
        setAudioPermission(false);
      }
    })();
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (storeMessages.length > 0) setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, [storeMessages]);

  // ── Send message ──
  const handleSend = useCallback((text: string) => {
    if (!text.trim() || !botId) return;
    const trimmed = text.trim();
    setComposerText('');
    setInputHeight(44);

    // Route through real agentStore — sends to kernel-evolving API
    if (trimmed.startsWith('/')) {
      sendSlashCommand(trimmed);
    } else {
      sendMessage(trimmed);
    }
  }, [botId, sendMessage, sendSlashCommand]);

  // ── Camera picker ──
  const handleCamera = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Denied', 'Camera access is required to take photos.'); return; }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8, base64: false });
    if (!result.canceled && result.assets[0]) {
      const img = result.assets[0];
      const caption = `📷 Image captured`;
      const userMsg: Message = { id: `msg-${Date.now()}`, chatId: botId || '', role: 'user', text: `${caption}\n${img.uri}`, timestamp: Date.now() };
      useAgentStore.getState().addMessage(userMsg);
    }
  }, [botId]);

  // ── Voice recording ──
  const handleStartRecording = useCallback(async () => {
    if (!audioPermission) { Alert.alert('Permission Denied', 'Microphone access is required for voice memos.'); return; }
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
    } catch (e) { console.warn('Recording start error:', e); }
  }, [audioPermission]);

  const handleStopRecording = useCallback(async () => {
    if (!recordingRef.current) return;
    try {
      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI() || '';
      setIsRecording(false);
      const userMsg: Message = { id: `msg-${Date.now()}`, chatId: botId || '', role: 'user', text: `🎤 Voice note recorded (${(uri.slice(-20))})`, timestamp: Date.now() };
      useAgentStore.getState().addMessage(userMsg);
    } catch (e) { console.warn('Recording stop error:', e); }
    recordingRef.current = null;
  }, [botId]);

  const handleAgentTap = () => { if (botId) navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: botId }); };

  const handleMenuAction = (action: string) => {
    setMenuOpen(false);
    if (action === 'new') { clearConversation(); }
    else if (action === 'profile' && botId) navigation.navigate(SCREEN_NAMES.BotProfile, { agentId: botId });
    else if (action === 'settings') navigation.navigate(SCREEN_NAMES.Settings);
    else if (action === 'files') setFileTreeOpen(true);
    else if (action === 'commands') setCommandSheetOpen(true);
    else if (action === 'inspector') setInspectorOpen(true);
  };

  const insertEmoji = (e: string) => { setComposerText((p) => p + e); setEmojiOpen(false); };

  const handleSlashSelect = (cmd: string) => { setComposerText(cmd + ' '); };

  // ── Compute filtered slash commands for autocomplete ──
  const filteredCommands = React.useMemo(() => {
    if (!composerText.startsWith('/')) return [];
    const input = composerText.toLowerCase().trim();
    return Object.entries(SLASH_DESCRIPTIONS)
      .filter(([cmd]) => cmd.startsWith(input))
      .slice(0, 8);
  }, [composerText]);

  // ── Render message ──
  const renderMessage = ({ item }: { item: Message }) => (
    <View style={item.role === 'user' ? styles.msgRowUser : styles.msgRowBot}>
      {item.role === 'assistant' && (
        <TouchableOpacity onPress={handleAgentTap} style={styles.msgBotAvatarWrap}>
          <View style={styles.msgBotAvatar}><SnakeEIcon size={20} /></View>
        </TouchableOpacity>
      )}
      <View style={{ maxWidth: '82%' }}>
        {item.role === 'assistant' && <TouchableOpacity onPress={handleAgentTap}><Text style={styles.msgAgentLabel}>{agent?.name || 'Agent'}</Text></TouchableOpacity>}
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
      <Text style={styles.emptyHint}>Chat with your agent. Type / for commands.</Text>
      <View style={styles.cmdChips}>
        {QUICK_CMDS.map((cmd) => (<TouchableOpacity key={cmd} style={styles.cmdChip} onPress={() => handleSend(cmd)}><Text style={styles.cmdChipText}>{cmd}</Text></TouchableOpacity>))}
      </View>
    </View>
  );

  const StreamingFooter = () => {
    if (!storeIsStreaming) return null;
    return (
      <View style={styles.msgRowBot}>
        <View style={styles.msgBotAvatarWrap}><View style={styles.msgBotAvatar}><SnakeEIcon size={20} /></View></View>
        <View style={{ maxWidth: '82%' }}>
          <Text style={styles.msgAgentLabel}>{agent?.name || 'Agent'} thinking…</Text>
          <View style={styles.streamingBubble}>
            <View style={styles.streamingDots}><TypingDots color={colors.accent} /></View>
          </View>
        </View>
      </View>
    );
  };

  // ── Render workspace tree node ──
  const renderTreeNode = (node: WorkspaceNode, depth: number = 0): React.ReactNode => (
    <View key={node.name} style={[styles.treeNode, { paddingLeft: 12 + depth * 16 }]}>
      <Text style={[styles.treeIcon, { color: node.type === 'dir' ? colors.warning : colors.textMuted }]}>
        {node.type === 'dir' ? '📁' : '📄'}
      </Text>
      <Text style={[styles.treeName, { fontWeight: node.type === 'dir' ? '600' : '400' }]}>{node.name}</Text>
      {node.size && <Text style={styles.treeSize}>{node.size}</Text>}
      {node.children?.map((ch) => renderTreeNode(ch, depth + 1))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgPrimary} />

      {/* ═══ HEADER ═══ */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.hdrBtn} onPress={() => navigation.navigate(SCREEN_NAMES.BotList)}><ArrowBack /></TouchableOpacity>
        <View style={styles.hdrAvatar}><SnakeEIcon size={22} /></View>
        {agent?.status === 'offline' ? (
          <TouchableOpacity style={styles.hdrBtn}><RetryIcon /></TouchableOpacity>
        ) : (
          <View style={[styles.hdrStatusDot, { backgroundColor: agent?.status === 'online' ? colors.success : colors.textMuted }]} />
        )}
        {/* File tree toggle — WORKS NOW */}
        <TouchableOpacity style={styles.hdrBtn} onPress={() => setFileTreeOpen(true)}><FolderIcon /></TouchableOpacity>
        <TouchableOpacity style={styles.hdrInfo} onPress={handleAgentTap}>
          <Text style={styles.hdrTitle} numberOfLines={1}>{agent?.name || 'Chat'}</Text>
          {storeIsStreaming ? (
            <View style={styles.hdrTyping}><TypingDots color={colors.accent} /><Text style={styles.hdrTypingLabel}>typing</Text></View>
          ) : (
            <Text style={styles.hdrSub}>{agent?.status || 'bot'}</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.hdrToggle, toolsEnabled && styles.hdrToggleActive]} onPress={() => setToolsEnabled(!toolsEnabled)}>
          <Text style={[styles.hdrToggleText, toolsEnabled && styles.hdrToggleTextActive]}>{toolsEnabled ? '🛠️ Agent' : '💬 Chat'}</Text>
        </TouchableOpacity>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={styles.hdrBtn} onPress={() => setMenuOpen(!menuOpen)}><ThreeDotsIcon /></TouchableOpacity>
          {menuOpen && (
            <>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
              <View style={styles.dropdown}>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuAction('new')}>
                  <Text style={styles.dropdownItemText}>➕ New conversation</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuAction('profile')}>
                  <Text style={styles.dropdownItemText}>ℹ️ Bot info</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuAction('files')}>
                  <Text style={styles.dropdownItemText}>📂 Workspace files</Text>
                </TouchableOpacity>
                <View style={styles.dropdownDivider} />
                <TouchableOpacity style={styles.dropdownItem} onPress={() => handleMenuAction('settings')}>
                  <Text style={styles.dropdownItemText}>⚙️ Settings</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>

      {/* ═══ MESSAGES ═══ */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        {!botId ? (
          <View style={styles.noAgent}>
            <Text style={styles.noAgentTitle}>No Agent Selected</Text>
            <Text style={styles.noAgentSubtext}>Select an agent from the list to start chatting</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={storeMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.msgList}
            ListEmptyComponent={renderEmptyState}
            ListFooterComponent={<StreamingFooter />}
          />
        )}

        {/* ═══ SLASH COMMAND AUTOCOMPLETE (Telegram bot style — filtered as you type) ═══ */}
        {botId && composerText.startsWith('/') && filteredCommands.length > 0 && (
          <View style={styles.slashPanel}>
            <ScrollView style={styles.slashScroll} keyboardShouldPersistTaps="handled">
              {filteredCommands.map(([cmd, desc]) => (
                <TouchableOpacity key={cmd} style={styles.slashItem} onPress={() => handleSlashSelect(cmd)}>
                  <Text style={styles.slashCmd}>{cmd}</Text>
                  <Text style={styles.slashDesc} numberOfLines={1}>{desc}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ═══ COMPOSER ═══ */}
        {botId && (
          <View style={styles.composer}>
            <TouchableOpacity style={styles.compMenuBtn} onPress={() => setComposerText('/')}><MenuIcon /></TouchableOpacity>
            <TouchableOpacity style={styles.compIconBtn} onPress={() => setEmojiOpen(!emojiOpen)}><SmileyIcon /></TouchableOpacity>
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
                onSubmitEditing={() => { handleSend(composerText); setComposerText(''); }}
                returnKeyType="send"
              />
              <TouchableOpacity style={styles.compExpandBtn} onPress={() => { setExpandText(composerText); setExpandOpen(true); }}><ExpandIcon /></TouchableOpacity>
            </View>
            {!composerText.trim() && (
              <View style={{ position: 'relative' }}>
                <TouchableOpacity style={styles.compIconBtn} onPress={() => setPickerOpen(!pickerOpen)}><PaperclipIcon /></TouchableOpacity>
                {pickerOpen && (
                  <>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setPickerOpen(false)} />
                    <View style={styles.pickerDropdown}>
                      <TouchableOpacity style={styles.pickerItem} onPress={() => { setPickerOpen(false); handleCamera(); }}>
                        <Text style={styles.pickerItemText}>📷 Camera</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.pickerItem} onPress={() => setPickerOpen(false)}>
                        <Text style={styles.pickerItemText}>🖼️ Gallery</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.pickerItem} onPress={() => setPickerOpen(false)}>
                        <Text style={styles.pickerItemText}>📄 File</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
            {/* Send / Mic toggle — v1 style */}
            {composerText.trim() ? (
              <TouchableOpacity
                style={[styles.compSendBtn, styles.compSendBtnActive]}
                onPress={() => { handleSend(composerText); setComposerText(''); setInputHeight(44); }}
              >
                <SendIcon2 />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.compSendBtn, styles.compSendBtnIdle]}
                onPressIn={handleStartRecording}
                onPressOut={handleStopRecording}
              >
                {isRecording ? <View style={styles.recordingIndicator} /> : <MicIcon />}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Emoji panel */}
        {emojiOpen && (
          <View style={styles.emojiPanel}>
            <View style={styles.emojiGrid}>
              {EMOJIS.map((e) => (
                <TouchableOpacity key={e} style={styles.emojiCell} onPress={() => insertEmoji(e)}>
                  <Text style={{ fontSize: 22 }}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* ═══ FILE TREE OFF‑CANVAS ═══ */}
      <Modal visible={fileTreeOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.offcanvasOverlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setFileTreeOpen(false)} />
          <View style={styles.offcanvasPanel}>
            <View style={styles.offcanvasHeader}>
              <Text style={styles.offcanvasTitle}>📂 Workspace Files</Text>
              <TouchableOpacity onPress={() => setFileTreeOpen(false)}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.offcanvasContent}>
              {MOCK_WORKSPACE_TREE.map((node) => renderTreeNode(node))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>

      {/* Fullscreen editor overlay */}
      <Modal visible={expandOpen} animationType="slide" transparent>
        <SafeAreaView style={styles.expandOverlay}>
          <View style={styles.expandHeader}>
            <TouchableOpacity onPress={() => setExpandOpen(false)} style={styles.expandClose}><Text style={{ fontSize: 20, color: colors.textSecondary }}>✕</Text></TouchableOpacity>
            <Text style={{ ...typography.title, flex: 1 }}>Edit message</Text>
            <TouchableOpacity style={styles.expandSendBtn} onPress={() => { handleSend(expandText); setExpandOpen(false); setComposerText(''); }}>
              <Text style={styles.expandSendText}>Send</Text>
            </TouchableOpacity>
          </View>
          <TextInput style={styles.expandInput} value={expandText} onChangeText={setExpandText} placeholder="Message" placeholderTextColor={colors.textMuted} multiline autoFocus />
        </SafeAreaView>
      </Modal>

      {/* ═══ COMMAND SHEET (bottom sheet — evolution_dashboard agent-command-sheet) ═══ */}
      <CommandSheet
        visible={commandSheetOpen}
        onClose={() => setCommandSheetOpen(false)}
        onSelectCommand={(cmd) => {
          setComposerText(cmd + ' ');
          textareaRef.current?.focus();
        }}
      />

      {/* ═══ PROVIDER SHEET (side sheet — evolution_dashboard agent-provider-sheet) ═══ */}
      <ProviderSheet
        visible={providerSheetOpen}
        onClose={() => setProviderSheetOpen(false)}
        routing={providerRouting}
        onRefresh={() => { fetchProviderRouting(); }}
      />

      {/* ═══ INSPECTOR PANEL (evolution_dashboard agent-inspector) ═══ */}
      {inspectorOpen && (
        <InspectorPanel
          visible={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
          messages={storeMessages}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },
  // Header
  header: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 8, backgroundColor: colors.bgCard, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  hdrBtn: { padding: 6, alignItems: 'center', justifyContent: 'center' },
  hdrAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gradientOnline[0], alignItems: 'center', justifyContent: 'center' },
  hdrStatusDot: { width: 8, height: 8, borderRadius: 4 },
  hdrInfo: { flex: 1, paddingHorizontal: 4 },
  hdrTitle: { ...typography.title, fontSize: 14 },
  hdrSub: { ...typography.small, textTransform: 'capitalize' },
  hdrTyping: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  hdrTypingLabel: { ...typography.small, color: colors.accent },
  hdrToggle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: borderRadius.full, backgroundColor: colors.accentBg, borderWidth: 1, borderColor: colors.borderLight },
  hdrToggleActive: { backgroundColor: colors.buttonPrimary, borderColor: colors.buttonPrimary },
  hdrToggleText: { fontSize: 10, fontWeight: '500', color: colors.textSecondary },
  hdrToggleTextActive: { color: '#fff' },
  // Dropdown
  dropdown: { position: 'absolute', right: 0, top: 36, width: 200, backgroundColor: '#21262d', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.lg, paddingVertical: 4, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  dropdownItem: { paddingVertical: 10, paddingHorizontal: spacing.lg },
  dropdownItemText: { fontSize: 13, color: '#c9d1d9' },
  dropdownDivider: { height: 1, backgroundColor: colors.borderLight, marginVertical: 4 },
  // Messages
  msgList: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  msgRowBot: { flexDirection: 'row', marginBottom: 10, justifyContent: 'flex-start' },
  msgRowUser: { flexDirection: 'row', marginBottom: 10, justifyContent: 'flex-end' },
  msgBotAvatarWrap: { marginRight: 8, alignSelf: 'flex-end' },
  msgBotAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.gradientBot[0], alignItems: 'center', justifyContent: 'center' },
  msgAgentLabel: { fontSize: 10, color: colors.textMuted, marginBottom: 2, marginLeft: 4 },
  msgTimestamp: { fontSize: 10, color: colors.textDim, marginTop: 1, marginLeft: 4 },
  msgTimestampRight: { textAlign: 'right', marginRight: 4 },
  streamingBubble: { backgroundColor: colors.bgBubbleBot, paddingHorizontal: 14, paddingVertical: 10, borderTopLeftRadius: borderRadius.lg, borderTopRightRadius: borderRadius.lg, borderBottomLeftRadius: 4, borderBottomRightRadius: borderRadius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderLight },
  streamingText: { color: colors.textPrimary, fontSize: 14, lineHeight: 20 },
  streamingDots: { flexDirection: 'row', marginTop: 4 },
  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: spacing.xl },
  emptyAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.gradientBot[0], alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTitle: { ...typography.h2, marginBottom: spacing.xs },
  emptySubtitle: { ...typography.caption, marginBottom: spacing.lg },
  emptyHint: { ...typography.caption, textAlign: 'center', lineHeight: 18, marginBottom: spacing.lg },
  cmdChips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  cmdChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.bgSurface, borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.border },
  cmdChipText: { ...typography.caption, color: colors.textSecondary },
  // No agent
  noAgent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  noAgentTitle: { ...typography.title, color: colors.textSecondary, marginBottom: spacing.xs },
  noAgentSubtext: { ...typography.caption, textAlign: 'center' },
  // Slash autocomplete (Telegram bot style—filtered as you type)
  slashPanel: { backgroundColor: '#17212b', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle, maxHeight: 240 },
  slashScroll: { maxHeight: 240 },
  slashItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  slashCmd: { fontSize: 13, fontWeight: '600', color: colors.accent, minWidth: 100 },
  slashDesc: { fontSize: 11, color: colors.textMuted, flex: 1, marginLeft: spacing.sm },
  // Composer
  composer: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: colors.bgCard, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle },
  compMenuBtn: { padding: 8, marginBottom: 2 },
  compIconBtn: { padding: 8, marginBottom: 2 },
  compInputWrap: { flex: 1, position: 'relative', marginHorizontal: 2 },
  compInput: { backgroundColor: colors.accentBg, color: colors.textPrimary, fontSize: 14, paddingHorizontal: 14, paddingVertical: 10, paddingRight: 28, borderRadius: borderRadius.lg, maxHeight: 120, lineHeight: 20 },
  compExpandBtn: { position: 'absolute', top: 8, right: 6, padding: 2 },
  compSendBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginLeft: 2, marginBottom: 2 },
  compSendBtnActive: { backgroundColor: colors.buttonPrimary },
  compSendBtnIdle: { backgroundColor: colors.accentBg },
  recordingIndicator: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.danger },
  // Picker
  pickerDropdown: { position: 'absolute', bottom: 48, right: 0, width: 140, backgroundColor: '#21262d', borderWidth: 1, borderColor: colors.borderLight, borderRadius: borderRadius.lg, padding: 4, zIndex: 100, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 },
  pickerItem: { paddingVertical: 8, paddingHorizontal: spacing.md },
  pickerItemText: { fontSize: 12, color: '#c9d1d9' },
  // Emoji
  emojiPanel: { backgroundColor: colors.bgCard, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderSubtle, padding: spacing.sm, maxHeight: 160 },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  emojiCell: { width: '12.5%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  // File tree offcanvas
  offcanvasOverlay: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  offcanvasPanel: { width: '80%', backgroundColor: colors.bgSecondary, borderLeftWidth: 1, borderLeftColor: colors.borderSubtle, elevation: 10 },
  offcanvasHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  offcanvasTitle: { ...typography.title, fontSize: 15 },
  offcanvasContent: { flex: 1, paddingVertical: spacing.sm },
  treeNode: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingRight: spacing.lg },
  treeIcon: { fontSize: 12 },
  treeName: { fontSize: 12, color: colors.textPrimary, flex: 1 },
  treeSize: { fontSize: 10, color: colors.textMuted },
  // Fullscreen editor
  expandOverlay: { flex: 1, backgroundColor: colors.bgPrimary },
  expandHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, backgroundColor: colors.bgCard, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderSubtle },
  expandClose: { padding: 4 },
  expandSendBtn: { paddingHorizontal: spacing.lg, paddingVertical: 6, backgroundColor: colors.accent, borderRadius: borderRadius.full },
  expandSendText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  expandInput: { flex: 1, padding: spacing.lg, fontSize: 14, color: colors.textPrimary, textAlignVertical: 'top', lineHeight: 22 },
});
