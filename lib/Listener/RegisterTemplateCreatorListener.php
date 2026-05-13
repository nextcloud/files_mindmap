<?php

declare(strict_types=1);
/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
namespace OCA\Files_MindMap\Listener;

use OCA\Files_MindMap\AppInfo\Application;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Files\Template\RegisterTemplateCreatorEvent;
use OCP\Files\Template\TemplateFileCreator;
use OCP\IL10N;

/** @template-implements IEventListener<RegisterTemplateCreatorEvent|Event> */
final class RegisterTemplateCreatorListener implements IEventListener {
	public function __construct(private IL10N $l10n) {}

	public function handle(Event $event): void {
		if (!($event instanceof RegisterTemplateCreatorEvent)) {
			return;
		}

		$event->getTemplateManager()->registerTemplateFileCreator(function () {
			$creator = new TemplateFileCreator(
				Application::APPNAME,
				$this->l10n->t('New mind map'),
				'.km',
			);
			$creator->addMimetype('application/km');

			$iconContent = file_get_contents(__DIR__ . '/../../img/mindmap.svg');
			if ($iconContent !== false) {
				if (method_exists($creator, 'setIconSvgInline')) {
					$creator->setIconSvgInline($iconContent);
				} else {
					$creator->setIconClass('icon-mindmap');
				}
			} else {
				$creator->setIconClass('icon-template-add');
			}

			$creator->setActionLabel($this->l10n->t('Create new mind map'));
			return $creator;
		});
	}
}
