/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
import { action, decorate, observable } from 'mobx';

export default class DownloadStore {
	downloads = []

	addDownload(download) {
		this.downloads.push(download);
	}

	removeDownload(index) {
		this.downloads.splice(index, 1);
	}

	reset() {
		this.downloads = [];
	}
}

decorate(DownloadStore, {
	downloads: observable,
	addDownload: action,
	removeDownload: action,
	reset: action
});
