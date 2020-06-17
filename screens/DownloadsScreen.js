/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  View,
  RefreshControl
} from 'react-native';
import { ListItem, Text } from 'react-native-elements';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

import Colors from '../constants/Colors';
import StorageKeys, { DownloadDirectory } from '../constants/Storage';
import CachingStorage from '../utils/CachingStorage';

const keyExtractor = (item, index) => `${item.serverId}-${item.itemId}-${index}`;

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(true);

  let player;

  async function playItem(item) {
    const uri = `${FileSystem.documentDirectory}${DownloadDirectory}${encodeURI(item.filename)}`;
    console.log('playing download:', uri);
    try {
      if (!player) {
        const { sound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: true }
        );
        player = sound;
      } else {
        await player.unloadAsync();
        await player.loadAsync(
          { uri },
          { shouldPlay: true }
        );
      }
    } catch (err) {
      console.warn('Error playing file', err);
    }
  }

  function renderDownload({ item, index }) {
    console.log('render download', item);
    return (
      <ListItem
        title={(item.title || item.filename)}
        topDivider={index === 0}
        bottomDivider
        onPress={() => playItem(item)}
      />
    );
  }

  async function refreshDownloads() {
    setIsRefreshing(true);

    const files = await FileSystem.readDirectoryAsync(`${FileSystem.documentDirectory}${DownloadDirectory}`);
    const metadata = await CachingStorage.getInstance().getItem(StorageKeys.Downloads) || [];

    let unknownCount = 0;
    const actualDownloads = files.map(file => {
      const fileData = metadata.find(data => data.filename === file);
      if (fileData) {
        return fileData;
      } else {
        return {
          serverId: 'unknown',
          itemId: unknownCount++,
          filename: file
        };
      }
    });

    console.log('downloads', files, metadata);
    setDownloads(actualDownloads);
    setIsLoading(false);
    setIsRefreshing(false);
  }

  useEffect(
    () => {
      refreshDownloads();
    },
    // NOTE: [] is required here to prevent the hook from running multiple times
    // refs: https://reactjs.org/docs/hooks-effect.html#tip-optimizing-performance-by-skipping-effects
    []
  );

  // Show loading indicator
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  // Show message if no downloads exist
  if (downloads.length === 0) {
    return (
      <View style={styles.container}>
        <Text>You have not downloaded any media. Go download something and return here to play it!</Text>
      </View>
    );
  }

  // List downloads
  return (
    <FlatList
      keyExtractor={keyExtractor}
      data={downloads}
      renderItem={renderDownload}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refreshDownloads}
          tintColor={Colors.tabText}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundColor
  }
});
