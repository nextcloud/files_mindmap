<?php

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2019-2025 Jingtao Yan and files_mindmap contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Files_MindMap\AppInfo;

use OCA\Files\Event\LoadAdditionalScriptsEvent;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Http\ContentSecurityPolicy;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\EventDispatcher\IEventDispatcher;
use OCP\Files\IMimeTypeDetector;
use OCP\Security\CSP\AddContentSecurityPolicyEvent;
use OCA\Viewer\Event\LoadViewer;
use OCA\Files_MindMap\Listener\LoadAdditionalListener;
use OCA\Files_MindMap\Listener\LoadViewerListener;
use OCA\Files_MindMap\Listener\LoadPublicViewerListener;
use OCA\Files_MindMap\Listener\RegisterTemplateCreatorListener;
use OCP\Files\Template\RegisterTemplateCreatorEvent;



class Application extends App implements IBootstrap {
    const APPNAME = 'files_mindmap';

	public function __construct(array $urlParams = array()) {
		parent::__construct(self::APPNAME, $urlParams);
    }


	public function registerProvider() {
		$container = $this->getContainer();

		// Register mimetypes
		/** @var IMimeTypeDetector $detector */
		$detector = $container->get(IMimeTypeDetector::class);
		$detector->getAllMappings();
		$detector->registerType('km','application/km');
	}

	public function register(IRegistrationContext $context): void {
		$context->registerEventListener(LoadAdditionalScriptsEvent::class, LoadAdditionalListener::class);
		$context->registerEventListener(BeforeTemplateRenderedEvent::class, LoadPublicViewerListener::class);
		$context->registerEventListener(LoadViewer::class, LoadViewerListener::class);
		$context->registerEventListener(RegisterTemplateCreatorEvent::class, RegisterTemplateCreatorListener::class);
	}

	public function boot(IBootContext $context): void {
		$this->registerProvider();

		$context->injectFn([$this, 'registerEventsSecurity']);
	}

	public function registerEventsSecurity(IEventDispatcher $dispatcher): void {
		$dispatcher->addListener(AddContentSecurityPolicyEvent::class, function (AddContentSecurityPolicyEvent $e) {
			$policy = new ContentSecurityPolicy();
			$policy->addAllowedFrameDomain("'self'");
			$policy->addAllowedFrameDomain("data:");
			$e->addPolicy($policy);
		});

	}
}
