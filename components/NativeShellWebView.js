/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import React, { useState } from 'react';
import { action } from 'mobx';
import { observer } from 'mobx-react';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';

import { useStores } from '../hooks/useStores';
import { DownloadDirectory } from '../constants/Storage';
import { getAppName, getSafeDeviceName } from '../utils/Device';
import NativeShell from '../utils/NativeShell';
import { openBrowser } from '../utils/WebBrowser';
import RefreshWebView from './RefreshWebView';
import { Platform } from 'react-native';

const injectedJavaScript = `
window.ExpoAppInfo = {
  appName: '${getAppName()}',
  appVersion: '${Constants.nativeAppVersion}',
  deviceId: '${Constants.deviceId}',
  deviceName: '${getSafeDeviceName().replace(/'/g, '\\\'')}'
};

${NativeShell}

true;
`;

const NativeShellWebView = observer(React.forwardRef(
	function NativeShellWebView(props, ref) {
		const { rootStore } = useStores();
		const [isRefreshing, setIsRefreshing] = useState(false);

		const server = rootStore.serverStore.servers[rootStore.settingStore.activeServer];

		const onRefresh = () => {
			// Disable pull to refresh when in fullscreen
			if (rootStore.isFullscreen) return;
			setIsRefreshing(true);
			ref.current?.reload();
			setIsRefreshing(false);
		};

		const downloadFile = async (data) => {
			try {
				console.log('Downloading:', data);
				// Ensure the Downloads directory exists
				const { exists, isDirectory } = await FileSystem.getInfoAsync(`${FileSystem.documentDirectory}${DownloadDirectory}`);
				console.log(`${FileSystem.documentDirectory}${DownloadDirectory}`, exists, isDirectory);
				if (!exists || !isDirectory) {
					await FileSystem.makeDirectoryAsync(`${FileSystem.documentDirectory}${DownloadDirectory}`);
				}
				// TODO: Allow pausing and resuming downloads
				// TODO: Check that the file is a supported type before download
				const result = await FileSystem.downloadAsync(data.url, `${FileSystem.documentDirectory}${DownloadDirectory}${encodeURI(data.filename)}`);
				rootStore.downloadStore.addDownload({
					...data,
					mimeType: result.mimeType,
					uri: result.uri
				});
				// const downloads = await CachingStorage.getInstance().getItem(StorageKeys.Downloads) || [];
				// downloads.push(data);
				// await CachingStorage.getInstance().setItem(StorageKeys.Downloads, downloads);
				console.log('Download complete:', result);
			} catch (err) {
				console.warn('Failed to download file', err);
				// TODO: Show message when download fails
			}
		};

		const onMessage = action(({ nativeEvent: state }) => {
			try {
				const { event, data } = JSON.parse(state.data);
				switch (event) {
					case 'downloadFile':
						downloadFile(data);
						break;
					case 'enableFullscreen':
						rootStore.isFullscreen = true;
						break;
					case 'disableFullscreen':
						rootStore.isFullscreen = false;
						break;
					case 'openUrl':
						console.log('Opening browser for external url', data.url);
						openBrowser(data.url);
						break;
					case 'updateMediaSession':
						// Keep the screen awake when music is playing
						if (rootStore.settingStore.isScreenLockEnabled) {
							activateKeepAwake();
						}
						break;
					case 'hideMediaSession':
						// When music session stops disable keep awake
						if (rootStore.settingStore.isScreenLockEnabled) {
							deactivateKeepAwake();
						}
						break;
					case 'console.debug':
						// console.debug('[Browser Console]', data);
						break;
					case 'console.error':
						console.error('[Browser Console]', data);
						break;
					case 'console.info':
						// console.info('[Browser Console]', data);
						break;
					case 'console.log':
						// console.log('[Browser Console]', data);
						break;
					case 'console.warn':
						console.warn('[Browser Console]', data);
						break;
					default:
						console.debug('[HomeScreen.onMessage]', event, data);
				}
			} catch (ex) {
				console.warn('Exception handling message', state.data);
			}
		});

		return (
			<RefreshWebView
				ref={ref}
				source={{ uri: server.urlString }}
				// Inject javascript for NativeShell
				// This method is preferred, but only supported on iOS currently
				injectedJavaScriptBeforeContentLoaded={Platform.OS === 'ios' ? injectedJavaScript : null}
				// Fallback for non-iOS
				injectedJavaScript={Platform.OS !== 'ios' ? injectedJavaScript : null}
				onMessage={onMessage}
				isRefreshing={isRefreshing}
				onRefresh={onRefresh}
				// Pass through additional props
				{...props}
				// Make scrolling feel faster
				decelerationRate='normal'
				// Media playback options to fix video player
				allowsInlineMediaPlayback={true}
				mediaPlaybackRequiresUserAction={false}
				// Use WKWebView on iOS
				useWebKit={true}
			/>
		);
	}
));

export default NativeShellWebView;
