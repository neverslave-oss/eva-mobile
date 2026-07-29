import React from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, FlatList } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface MediaItem {
  uri: string;
  type: 'image' | 'video';
  id: string;
  width?: number;
  height?: number;
}

interface MediaGridProps {
  items: MediaItem[];
  onPress?: (item: MediaItem) => void;
  columns?: number;
  maxItems?: number;
}

const PlayIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 3l14 9-14 9V3z"
      fill="#ffffff"
      opacity={0.9}
    />
  </Svg>
);

export default function MediaGrid({ items, onPress, columns = 3, maxItems = 9 }: MediaGridProps) {
  const displayItems = items.slice(0, maxItems);
  const remaining = items.length - maxItems;

  if (displayItems.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        data={displayItems}
        numColumns={columns}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const showOverlay = index === displayItems.length - 1 && remaining > 0;

          return (
            <TouchableOpacity
              style={[styles.item, { flex: 1 / columns }]}
              onPress={() => onPress?.(item)}
              activeOpacity={0.8}
            >
              <Image source={{ uri: item.uri }} style={styles.image} />

              {item.type === 'video' && (
                <View style={styles.playOverlay}>
                  <PlayIcon />
                </View>
              )}

              {showOverlay && (
                <View style={styles.remainingOverlay}>
                  <Text style={styles.remainingText}>+{remaining}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  item: {
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: '#0f0f1a',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  remainingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  remainingText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
});
