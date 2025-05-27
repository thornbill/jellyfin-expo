/**
 * Copyright (c) 2025 Jellyfin Contributors
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin';

import { getAppName, getAppVersion, getSafeDeviceName } from './Device';

export function getSdk(deviceId: string) {
	return new Jellyfin({
		clientInfo: {
			name: getAppName(),
			version: getAppVersion()
		},
		deviceInfo: {
			name: getSafeDeviceName(),
			id: deviceId
		}
	});
}
