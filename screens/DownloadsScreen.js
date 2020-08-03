/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ListItem, Text } from 'react-native-elements';
import * as Sharing from 'expo-sharing';
import { observer } from 'mobx-react';

import Colors from '../constants/Colors';
import { useStores } from '../hooks/useStores';

const keyExtractor = (item, index) => `${item.serverId}-${item.itemId}-${index}`;

const DownloadsScreen = observer(() => {
	const { rootStore } = useStores();

	const shareItem = async (item) => {
		if (await Sharing.isAvailableAsync) {
			try {
				await Sharing.shareAsync(item.uri);
			} catch (e) {
				console.warn('Failed to share item', e);
			}
		} else {
			console.warn('Sharing is unavailable!');
		}
	};

	function renderDownload({ item, index }) {
		return (
			<ListItem
				title={(item.title || item.filename)}
				topDivider={index === 0}
				bottomDivider
				onPress={() => shareItem(item)}
			/>
		);
	}

	// Show message if no downloads exist
	if (rootStore.downloadStore.downloads.length === 0) {
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
			data={rootStore.downloadStore.downloads}
			renderItem={renderDownload}
		/>
	);
});

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.backgroundColor
	}
});

export default DownloadsScreen;
