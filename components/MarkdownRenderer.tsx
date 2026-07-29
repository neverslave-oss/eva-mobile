import React from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import Markdown from 'react-native-markdown-display';

interface MarkdownRendererProps {
  content: string;
}

const darkTheme = {
  body: { color: '#e4e4e7', fontSize: 14, lineHeight: 20 },
  heading1: { color: '#ffffff', fontSize: 20, fontWeight: '700' as const, marginBottom: 8 },
  heading2: { color: '#ffffff', fontSize: 17, fontWeight: '600' as const, marginBottom: 6 },
  heading3: { color: '#ffffff', fontSize: 15, fontWeight: '600' as const, marginBottom: 4 },
  code_inline: {
    backgroundColor: '#242f3d',
    color: '#ffa657',
    fontFamily: 'monospace',
    fontSize: 13,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fence: {
    backgroundColor: '#17212b',
    color: '#e4e4e7',
    fontFamily: 'monospace',
    fontSize: 12,
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  blockquote: {
    borderLeftWidth: 3,
    borderLeftColor: '#58a6ff',
    paddingLeft: 12,
    marginVertical: 8,
    opacity: 0.8,
  },
  link: { color: '#58a6ff', textDecorationLine: 'underline' as const },
  list_item: { marginVertical: 2 },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
};

const lightTheme = {
  ...darkTheme,
  body: { ...darkTheme.body, color: '#1f2937' },
  heading1: { ...darkTheme.heading1, color: '#111827' },
  heading2: { ...darkTheme.heading2, color: '#111827' },
  heading3: { ...darkTheme.heading3, color: '#111827' },
  code_inline: { ...darkTheme.code_inline, backgroundColor: '#f3f4f6', color: '#c2422e' },
  fence: { ...darkTheme.fence, backgroundColor: '#f9fafb', color: '#1f2937' },
};

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const isDark = useColorScheme() !== 'light';

  return (
    <Markdown style={isDark ? darkTheme : lightTheme}>
      {content}
    </Markdown>
  );
}
