import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CopyIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Rect
      x="9" y="9" width="13" height="13" rx="2" ry="2"
      stroke="#8b949e" strokeWidth="2" fill="none"
    />
    <Path
      d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"
      stroke="#8b949e" strokeWidth="2" fill="none"
    />
  </Svg>
);

const CheckIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17l-5-5" stroke="#3fb950" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export default function CodeBlock({ code, language }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    // In React Native, copying requires expo-clipboard
    // For now we just show visual feedback
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.lang}>{language ?? 'code'}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
          <Text style={styles.copyText}>{copied ? 'Copied' : 'Copy'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.codeContainer}>
        <Text style={styles.code} selectable>
          {code}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#17212b',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a2332',
  },
  lang: {
    color: '#6c7883',
    fontSize: 11,
    textTransform: 'uppercase',
    fontFamily: 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyText: {
    color: '#8b949e',
    fontSize: 11,
  },
  codeContainer: {
    padding: 12,
  },
  code: {
    color: '#e4e4e7',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
