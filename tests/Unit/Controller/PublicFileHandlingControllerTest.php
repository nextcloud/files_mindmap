<?php

declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

namespace OCA\Files_MindMap\Tests\Unit\Controller;

use OCA\Files_MindMap\Controller\PublicFileHandlingController;
use OCP\AppFramework\Http;
use OCP\Constants;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\IL10N;
use OCP\IRequest;
use OCP\ISession;
use OCP\Share\IManager;
use OCP\Share\IShare;
use PHPUnit\Framework\MockObject\MockObject;
use Psr\Log\LoggerInterface;
use Test\TestCase;

class PublicFileHandlingControllerTest extends TestCase {
	private IManager&MockObject $shareManager;
	private PublicFileHandlingController $controller;

	protected function setUp(): void {
		parent::setUp();

		$request = $this->createMock(IRequest::class);
		$request->method('getParam')->willReturnMap([
			['dir', null, '/'],
			['filename', null, 'secret.km'],
		]);
		$this->shareManager = $this->createMock(IManager::class);
		$l10n = $this->createMock(IL10N::class);
		$l10n->method('t')->willReturnArgument(0);

		$this->controller = new PublicFileHandlingController(
			'files_mindmap',
			$request,
			$l10n,
			$this->createMock(LoggerInterface::class),
			$this->shareManager,
			$this->createMock(ISession::class),
		);
	}

	public function testLoadFromFileDropShareIsRefused(): void {
		$folder = $this->createMock(Folder::class);
		$folder->expects($this->never())->method('get');
		$this->mockShare(Constants::PERMISSION_CREATE, $folder);

		$this->assertSame(Http::STATUS_FORBIDDEN, $this->controller->load('token')->getStatus());
	}

	public function testLoadFromReadableShare(): void {
		$file = $this->createMock(File::class);
		$file->method('getContent')->willReturn('{"root":{}}');
		$folder = $this->createMock(Folder::class);
		$folder->method('get')->with('/secret.km')->willReturn($file);
		$this->mockShare(Constants::PERMISSION_READ, $folder);

		$response = $this->controller->load('token');

		$this->assertSame(Http::STATUS_OK, $response->getStatus());
		$this->assertSame(base64_encode('{"root":{}}'), $response->getData()['filecontents']);
	}

	private function mockShare(int $permissions, Folder $node): void {
		$share = $this->createMock(IShare::class);
		$share->method('getPermissions')->willReturn($permissions);
		$share->method('getNode')->willReturn($node);
		$this->shareManager->method('getShareByToken')->willReturn($share);
	}
}
