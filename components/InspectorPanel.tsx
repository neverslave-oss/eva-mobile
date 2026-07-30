/**
 * InspectorPanel — Agent inspector (mirrors evolution_dashboard agent-inspector)
 *
 * Shows: system prompt, conversation history, tool calls & outputs, recent trajectories.
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { colors, typography, borderRadius, spacing } from '../theme';
import { kernelClient } from '../services/KernelApiClient';
import { Message, ToolCallInfo } from '../types';

interface InspectorPanelProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
}

interface InspectorData {
  systemPrompt: string;
  agentConfig: Record<string, any> | null;
}

export default function InspectorPanel({ visible, onClose, messages }: InspectorPanelProps) {
  const [data, setData] = useState<InspectorData>({
    systemPrompt: 'No prompt log loaded yet.',
    agentConfig: null,
  });
  const [loading, setLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    system: true,
    history: true,
    tools: true,
    trajectories: false,
  });
  const [selectedMessageIndex, setSelectedMessageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setLoading(true);
    const [config] = await Promise.all([
      kernelClient.getAgentConfig(),
    ]);
    setData({
      systemPrompt: config?.system_prompt || 'No prompt log loaded yet.',
      agentConfig: config,
    });
    setLoading(false);
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const lastToolCalls: ToolCallInfo[] = React.useMemo(() => {
    const toolMsgs = messages.filter((m) => !m.streaming && m.toolCalls?.length);
    if (toolMsgs.length === 0) return [];
    return toolMsgs[toolMsgs.length - 1].toolCalls || [];
  }, [messages]);

  if (!visible) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Inspector</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.infoText}>
        {messages.length} messages in session
        {data.agentConfig?.model ? ` · ${data.agentConfig.model}` : ''}
      </Text>

      <ScrollView style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
        ) : (
          <>
            {/* System Prompt */}
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleSection('system')} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {expandedSections.system ? '▼' : '▶'} System Prompt
                </Text>
              </TouchableOpacity>
              {expandedSections.system && (
                <View style={styles.codeBlock}>
                  <Text style={styles.codeText}>{data.systemPrompt}</Text>
                </View>
              )}
            </View>

            {/* Conversation History */}
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleSection('history')} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {expandedSections.history ? '▼' : '▶'} Conversation History ({messages.length})
                </Text>
              </TouchableOpacity>
              {expandedSections.history && (
                <View style={styles.historyList}>
                  {messages.length === 0 && (
                    <Text style={styles.emptyText}>No messages yet.</Text>
                  )}
                  {messages.map((msg, i) => (
                    <TouchableOpacity
                      key={msg.id}
                      style={[
                        styles.historyTurn,
                        selectedMessageIndex === i && styles.historyTurnSelected,
                      ]}
                      onPress={() =>
                        setSelectedMessageIndex(
                          selectedMessageIndex === i ? null : i
                        )
                      }
                    >
                      <View style={styles.historyHead}>
                        <Text style={styles.historyRole}>
                          {msg.role === 'user' ? 'User' : 'Agent'}
                        </Text>
                        <Text style={styles.historyTime}>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.historyContent} numberOfLines={selectedMessageIndex === i ? undefined : 2}>
                        {msg.text.slice(0, 300)}
                      </Text>
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <Text style={styles.toolBadge}>
                          🔧 {msg.toolCalls.length} tool call(s)
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Tool Calls & Outputs */}
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleSection('tools')} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {expandedSections.tools ? '▼' : '▶'} Tool Calls & Outputs
                </Text>
              </TouchableOpacity>
              {expandedSections.tools && (
                <View>
                  {lastToolCalls.length === 0 ? (
                    <Text style={styles.emptyText}>No tool calls in recent messages.</Text>
                  ) : (
                    lastToolCalls.map((tc, i) => (
                      <View key={i} style={styles.traceStep}>
                        <View style={styles.traceHead}>
                          <Text style={styles.traceTool}>Step {tc.step}: {tc.toolName}</Text>
                        </View>
                        <Text style={styles.traceArgs}>▸ {tc.args}</Text>
                        <Text style={styles.traceResult}>↳ {tc.result.slice(0, 200)}</Text>
                      </View>
                    ))
                  )}
                </View>
              )}
            </View>

            {/* Trajectories placeholder */}
            <View style={styles.card}>
              <TouchableOpacity onPress={() => toggleSection('trajectories')} style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>
                  {expandedSections.trajectories ? '▼' : '▶'} Recent Trajectories
                </Text>
              </TouchableOpacity>
              {expandedSections.trajectories && (
                <Text style={styles.emptyText}>
                  Trajectory export will be wired once the agent API supports it.
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '92%',
    maxWidth: 400,
    height: '100%',
    backgroundColor: colors.bgPrimary,
    borderLeftWidth: 1,
    borderLeftColor: '#30363d',
    zIndex: 10000,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#30363d',
  },
  title: {
    ...typography.title,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: colors.textSecondary,
  },
  closeBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: borderRadius.md,
  },
  closeText: { fontSize: 11, color: colors.textSecondary },
  infoText: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 16,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderColor: '#30363d',
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgSurface,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionHeader: {
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#21262d',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeBlock: {
    padding: spacing.md,
    backgroundColor: colors.bgPrimary,
  },
  codeText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  historyList: {
    padding: spacing.sm,
  },
  historyTurn: {
    borderWidth: 1,
    borderColor: '#21262d',
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgPrimary,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  historyTurnSelected: {
    borderColor: colors.accent,
  },
  historyHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  historyRole: {
    fontSize: 10,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  historyTime: {
    fontSize: 10,
    color: colors.textDim,
  },
  historyContent: {
    fontSize: 11,
    color: colors.textPrimary,
    lineHeight: 15,
  },
  toolBadge: {
    fontSize: 10,
    color: colors.warning,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 11,
    color: colors.textMuted,
    padding: spacing.md,
    textAlign: 'center',
  },
  traceStep: {
    borderWidth: 1,
    borderColor: '#21262d',
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgPrimary,
    padding: spacing.sm,
    margin: spacing.sm,
  },
  traceHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  traceTool: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  traceArgs: {
    fontSize: 10,
    color: colors.textMuted,
    fontFamily: 'monospace',
    lineHeight: 14,
  },
  traceResult: {
    fontSize: 10,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    lineHeight: 14,
    marginTop: 4,
  },
});
