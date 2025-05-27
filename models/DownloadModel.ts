/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { getPlaystateApi } from '@jellyfin/sdk/lib/utils/api/playstate-api';
import * as FileSystem from 'expo-file-system';
import { v4 as uuidv4 } from 'uuid';

import { ensurePathExists } from '../utils/File';
import { getSdk } from '../utils/Sdk';

export default class DownloadModel {
	isComplete = false
	isDownloading = false
	isFailed = false
	isNew = true

	apiKey: string
	itemId: string
	/** The "play" session ID for reporting a download has stopped. */
	sessionId = uuidv4()
	serverId: string
	serverUrl: string

	title: string
	filename: string

	downloadUrl: string
	resumable?: FileSystem.DownloadResumable

	constructor(
		itemId: string,
		serverId: string,
		serverUrl: string,
		apiKey: string,
		title: string,
		filename: string,
		downloadUrl: string
	) {
		this.itemId = itemId;
		this.serverId = serverId;
		this.serverUrl = serverUrl;
		this.apiKey = apiKey;
		this.title = title;
		this.filename = filename;
		this.downloadUrl = downloadUrl;
	}

	get key() {
		return `${this.serverId}_${this.itemId}`;
	}

	get localFilename() {
		return this.filename.slice(0, this.filename.lastIndexOf('.')) + '.mp4';
	}

	get localPath() {
		return `${FileSystem.documentDirectory}${this.serverId}/${this.itemId}/`;
	}

	get uri() {
		return this.localPath + encodeURI(this.localFilename);
	}

	getStreamUrl(deviceId: string, params?: Record<string, string>): URL {
		const streamParams = new URLSearchParams({
			deviceId,
			api_key: this.apiKey,
			playSessionId: this.sessionId,
			// TODO: add mediaSourceId to support alternate media versions
			videoCodec: 'hevc,h264',
			audioCodec: 'aac,mp3,ac3,eac3,flac,alac',
			maxAudioChannels: '6',
			// subtitleCodec: 'srt,vtt',
			// subtitleMethod: 'Encode',
			...params
		});
		return new URL(`${this.serverUrl}Videos/${this.itemId}/stream.mp4?${streamParams.toString()}`);
	}

	async downloadFile(deviceId: string) {
		console.debug('[DownloadModel] downloading "%s"', this.filename);
		if (this.isDownloading) return;

		// Download the file
		try {
			await ensurePathExists(this.localPath);
			const url = this.getStreamUrl(deviceId);
			this.resumable = FileSystem.createDownloadResumable(
				url.toString(),
				this.uri,
				{},
				(/*{ totalBytesWritten }*/) => {
					// FIXME: We should save the download progress in the model for display
					// but this needs throttling
				}
			);

			this.isDownloading = true;
			this.isFailed = false;
			await this.resumable.downloadAsync();
			this.isComplete = true;
			this.isDownloading = false;
			this.resumable = undefined;
		} catch (e) {
			console.error('[DownloadModel] Download failed', e);
			this.isDownloading = false;
			this.isFailed = true;
		}

		// Always report download has stopped to cleanup transcode files on server
		const serverUrl = this.serverUrl.endsWith('/') ? this.serverUrl.slice(0, -1) : this.serverUrl;
		const api = getSdk(deviceId).createApi(serverUrl, this.apiKey);
		console.log('[DownloadModel] Reporting download stopped', this.sessionId);
		getPlaystateApi(api)
			.reportPlaybackStopped({
				playbackStopInfo: {
					PlaySessionId: this.sessionId
				}
			})
			.catch(e => {
				console.error('[DownloadModel] Failed reporting download stopped', e.response || e.request || e.message);
			});
	}
}
