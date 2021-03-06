/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { action, computed, decorate, observable } from 'mobx';
import { Platform } from 'react-native';

import Themes from '../themes';

/**
 * Data store for application settings
 */
export default class SettingStore {
	/**
	 * The id of the currently selected server
	 */
	activeServer = 0

	/**
	 * Is device rotation lock enabled
	 */
	isRotationLockEnabled = Platform.OS === 'ios' && !Platform.isPad

	/**
	 * Is screen lock active when media is playing
	 */
	isScreenLockEnabled = Platform.OS === 'ios' ? (parseInt(Platform.Version, 10) < 14) : true

	/**
	 * Are tab labels enabled
	 */
	isTabLabelsEnabled = true

	themeId = 'dark'

	get theme() {
		return Themes[this.themeId];
	}

	reset() {
		this.activeServer = 0;
		this.isRotationLockEnabled = Platform.OS === 'ios' && !Platform.isPad;
		this.isScreenLockEnabled = Platform.OS === 'ios' ? (parseInt(Platform.Version, 10) < 14) : true;
		this.isTabLabelsEnabled = true;
		this.themeId = 'dark';
	}
}

decorate(SettingStore, {
	activeServer: observable,
	isRotationLockEnabled: observable,
	isScreenLockEnabled: observable,
	isTabLabelsEnabled: observable,
	themeId: observable,
	theme: computed,
	reset: action
});
