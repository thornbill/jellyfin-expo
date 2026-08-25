/**
 * Copyright (c) 2025 Jellyfin Contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

/** The different actions that can be performed on a download. */
export const DownloadAction = {
	/** Cancel an in progress download. */
	Cancel: 'cancel',
	/** Delete the download. */
	Delete: 'delete',
	/** Open the download in the Files app. */
	OpenInFiles: 'open_in_files',
	/** Play the download within this app. */
	PlayInApp: 'play_in_app',
	/** Share the download via the iOS action sheet. */
	Share: 'share'
} as const;

export type DownloadAction = typeof DownloadAction[keyof typeof DownloadAction];
