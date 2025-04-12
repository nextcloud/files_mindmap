<?php
namespace OCA\Files_MindMap\Controller;

use OCP\HintException;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\Files\File;
use OCP\Files\Folder;
use OCP\Files\ForbiddenException;
use OCP\Files\GenericFileException;
use OCP\IL10N;
use OCP\IRequest;
use OCP\Lock\LockedException;
use \Psr\Log\LoggerInterface;

class FileHandlingController extends Controller{

	/** @var IL10N */
	private $l;

	/** @var LoggerInterface */
	private $logger;

	/** @var Folder */
	private $userFolder;

	/**
	 * @NoAdminRequired
	 *
	 * @param string $AppName
	 * @param IRequest $request
	 * @param IL10N $l10n
	 * @param LoggerInterface $logger
	 * @param Folder $userFolder
	 */
	public function __construct($AppName,
								IRequest $request,
								IL10N $l10n,
								LoggerInterface $logger,
								Folder $userFolder) {
		parent::__construct($AppName, $request);
		$this->l = $l10n;
		$this->logger = $logger;
		$this->userFolder = $userFolder;
	}

    /**
     * load mind map file
     *
     * @NoAdminRequired
     *
     * @param string $dir
     * @param string $filename
     * @return DataResponse
     */
	public function load($dir, $filename) {
		try {
			if (!empty($filename)) {
				$path = $dir . '/' . $filename;

				/** @var File $file */
				$file = $this->userFolder->get($path);

				if ($file instanceof Folder) {
					return new DataResponse(['message' => $this->l->t('You cannot open a folder')], Http::STATUS_BAD_REQUEST);
				}

				// default of 100MB
				$maxSize = 104857600;
				if ($file->getSize() > $maxSize) {
					return new DataResponse(['message' => (string)$this->l->t('This file is too big to be opened. Please download the file instead.')], Http::STATUS_BAD_REQUEST);
				}
				$fileContents = $file->getContent();
				if ($fileContents !== false) {
					$writable = $file->isUpdateable();
					$mime = $file->getMimeType();
					$mTime = $file->getMTime();
					return new DataResponse(
						[
							'filecontents' => base64_encode($fileContents),
							'writeable' => $writable,
							'mime' => $mime,
							'mtime' => $mTime
						],
						Http::STATUS_OK
					);
				} else {
					return new DataResponse(['message' => (string)$this->l->t('Cannot read the file.')], Http::STATUS_BAD_REQUEST);
				}
			} else {
				return new DataResponse(['message' => (string)$this->l->t('Invalid file path supplied.')], Http::STATUS_BAD_REQUEST);
			}

		} catch (LockedException $e) {
			$message = (string) $this->l->t('The file is locked.');
			return new DataResponse(['message' => $message], Http::STATUS_BAD_REQUEST);
		} catch (ForbiddenException $e) {
			return new DataResponse(['message' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
		} catch (HintException $e) {
			$message = (string)$e->getHint();
			return new DataResponse(['message' => $message], Http::STATUS_BAD_REQUEST);
		} catch (\Exception $e) {
			$message = (string)$this->l->t('An internal server error occurred.');
			return new DataResponse(['message' => $message], Http::STATUS_BAD_REQUEST);
		}
	}

    /**
     * save mind map file
     *
     * @NoAdminRequired
     *
     * @param string $path
     * @param string $filecontents
     * @return DataResponse
     */
	public function save($path, $filecontents, $mtime) {
		try {
			if($path !== '') {

				/** @var File $file */
				$file = $this->userFolder->get($path);

				if ($file instanceof Folder) {
					return new DataResponse(['message' => $this->l->t('You cannot write to a folder')], Http::STATUS_BAD_REQUEST);
				}
			
				if($file->isUpdateable()) {
					if ($mtime != $file->getMTime()) {
						$this->logger->error("User cannot save shared mind map (someone updated it in the meantime): {$mtime} vs. {$file->getMTime()} {$file->getPath()}", ['app' => 'files_mindmap']);
						return new DataResponse([ 'message' => $this->l->t('The file you are working on was updated in the meantime. You cannot save your progress as saving would overwrite these changes. Please reload the page.')],Http::STATUS_BAD_REQUEST);
					}
					try {
						$file->putContent($filecontents);
					} catch (LockedException $e) {
						$message = (string) $this->l->t('The file is locked.');
						return new DataResponse(['message' => $message], Http::STATUS_BAD_REQUEST);
					} catch (ForbiddenException $e) {
						return new DataResponse(['message' => $e->getMessage()], Http::STATUS_BAD_REQUEST);
					} catch (GenericFileException $e) {
						return new DataResponse(['message' => $this->l->t('Could not write to file.')], Http::STATUS_BAD_REQUEST);
					}
					// Clear statcache
					clearstatcache();
					// Get new mtime
					$newmtime = $file->getMTime();
					$newsize = $file->getSize();
					return new DataResponse(['mtime' => $newmtime, 'size' => $newsize], Http::STATUS_OK);
				} else {
					// Not writeable!
					$this->logger->error('User does not have permission to write to file: ' . $path,
						['app' => 'files_texteditor']);
					return new DataResponse([ 'message' => $this->l->t('Insufficient permissions')],
						Http::STATUS_BAD_REQUEST);
				}
			} else if ($path === '') {
				$this->logger->error('No file path supplied');
				return new DataResponse(['message' => $this->l->t('File path not supplied')], Http::STATUS_BAD_REQUEST);
			} else {
				$this->logger->error('No file mtime supplied', ['app' => 'files_texteditor']);
				return new DataResponse(['message' => $this->l->t('File mtime not supplied')], Http::STATUS_BAD_REQUEST);
			}

		} catch (HintException $e) {
			$message = (string)$e->getHint();
			return new DataResponse(['message' => $message], Http::STATUS_BAD_REQUEST);
		} catch (\Exception $e) {
			$message = (string)$this->l->t('An internal server error occurred.');
			$message = $path;
			return new DataResponse(['message' => $message], Http::STATUS_BAD_REQUEST);
		}
	}

}
