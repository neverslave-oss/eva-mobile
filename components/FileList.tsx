import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface FileItem {
  name: string;
  size?: number;
  mimeType?: string;
  url: string;
  id: string;
}

interface FileListProps {
  files: FileItem[];
  onPress?: (file: FileItem) => void;
}

const formatSize = (bytes?: number): string => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const getFileIcon = (mimeType?: string): string => {
  if (!mimeType) return '📄';
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📕';
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar')) return '📦';
  if (mimeType.includes('text') || mimeType.includes('json') || mimeType.includes('code')) return '📝';
  return '📄';
};

const FileIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"
      stroke="#8b949e"
      strokeWidth="2"
      fill="none"
    />
    <Path d="M14 2v6h6" stroke="#8b949e" strokeWidth="2" fill="none" />
  </Svg>
);

export default function FileList({ files, onPress }: FileListProps) {
  if (files.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={files}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => onPress?.(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.icon}>{getFileIcon(item.mimeType)}</Text>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              {item.size && (
                <Text style={styles.size}>{formatSize(item.size)}</Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: '#17212b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#242f3d',
  },
  icon: {
    fontSize: 22,
    width: 32,
    textAlign: 'center',
  },
  info: {
    flex: 1,
  },
  name: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '500',
  },
  size: {
    color: '#6c7883',
    fontSize: 11,
    marginTop: 2,
  },
});
