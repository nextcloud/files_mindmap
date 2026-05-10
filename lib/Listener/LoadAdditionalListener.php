<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2023-2025 Jingtao Yan and files_mindmap contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Files_MindMap\Listener;

use OCA\Files_MindMap\AppInfo\Application;
use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

class LoadAdditionalListener implements IEventListener {
	public function handle(Event $event): void {
		if (!($event instanceof LoadAdditionalScriptsEvent)) {
			return;
		}
		self::additionalScripts();
	}

	public static function additionalScripts() {
		Util::addStyle(Application::APPNAME, 'style');
//		Util::addScript(Application::APPNAME, 'files_mindmap-mindmap');
	}
}
