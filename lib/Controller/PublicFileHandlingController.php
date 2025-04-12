<?php
namespace OCA\Files_MindMap\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\Files\Folder;
use OCP\Files\ForbiddenException;
use OCP\Files\GenericFileException;
use OCP\Files\NotFoundException;
use OCP\IL10N;
use OCP\ILogger;
use OCP\IRequest;
use OCP\ISession;
use OCP\Lock\LockedException;
use OCP\Share\Exceptions\ShareNotFound;
use OCP\Share\IManager as ShareManager;

class PublicFileHandlingController extends Controller{

    /** @var IL10N */
    private $l;

    /** @var ILogger */
    private $logger;

    /** @var ShareManager */
    private $shareManager;

    /** @var ISession */
    private $session;

    /**
     *
     * @param string $AppName
     * @param IRequest $request
     * @param IL10N $l10n
     * @param ShareManager $shareManager
     * @param ISession $session
     */
    public function __construct($AppName,
                                IRequest $request,
                                IL10N $l10n,
                                ILogger $logger,
                                ShareManager $shareManager,
                                ISession $session) {
        parent::__construct($AppName, $request);
        $this->l = $l10n;
        $this->logger = $logger;
        $this->shareManager = $shareManager;
        $this->session = $session;
    }

    protected function checkPermissions($share, $permissions) {
        return ($share->getPermissions() & $permissions) === $permissions;
    }

    /**
     * load share mindmap file by path
     *
     * @NoAdminRequired
     * @PublicPage
     * @NoCSRFRequired
     *
     * @param string $token
     * @return DataResponse
     * @throws NotFoundException
     * @throws \OCP\Files\InvalidPathException
     * @throws \OCP\Files\NotPermittedException
     */
    public function load($token) {
        try {
            $share = $this->shareManager->getShareByToken($token);
        } catch (ShareNotFound $e) {
            return new DataResponse(['message' => $this->l->t('Share not found')], Http::STATUS_NOT_FOUND);
        }

        if ($share->getPassword() !== null &&
            (!$this->session->exists('public_link_authenticated')
                || $this->session->get('public_link_authenticated') !== (string)$share->getId())) {
            return new DataResponse(['message' => $this->l->t('You are not authorized to open this share')], Http::STATUS_BAD_REQUEST);
        }

        try {
            $node = $share->getNode();
        } catch (NotFoundException $e) {
            return new DataResponse(['message' => $this->l->t('Share not found')], Http::STATUS_NOT_FOUND);
        }

        $fileNode = $node;
        if ($node instanceof Folder) {
            $dir = $this->request->getParam('dir');
            $filename = $this->request->getParam('filename');
            $fullpath = trim($dir.$filename);
            if (!$fullpath) {
                return new DataResponse(['message' => $this->l->t('File not found')], Http::STATUS_NOT_FOUND);
            }
            try {
                $fileNode = $node->get($fullpath);
            } catch (NotFoundException $e) {
                return new DataResponse(['message' => $this->l->t('File not found')], Http::STATUS_NOT_FOUND);
            }
        }

        // default of 100MB
        $maxSize = 104857600;
        if ($fileNode->getSize() > $maxSize) {
            return new DataResponse(['message' => $this->l->t('This file is too big to be opened. Please download the file instead.')], Http::STATUS_BAD_REQUEST);
        }

        $fileContents = $fileNode->getContent();
        if ($fileContents !== false) {
            $writeable = $this->checkPermissions($share, \OCP\Constants::PERMISSION_UPDATE);
            return new DataResponse(
                [
                    'writeable' => $writeable,
                    'filecontents' => base64_encode($fileContents),
                    'mtime' => $fileNode->getMTime(),
                    'mime' => $fileNode->getMimeType()
                ],
                Http::STATUS_OK
            );
        }

        return new DataResponse(['message' => $this->l->t('Cannot read the file.')], Http::STATUS_BAD_REQUEST);
    }

    /**
     * save share mindmap file
     *
     * @NoAdminRequired
     * @PublicPage
     * @NoCSRFRequired
     *
     * @param string $token
     * @param string $filecontents
     * @param string $path
     * @return DataResponse
     * @throws NotFoundException
     * @throws \OCP\Files\InvalidPathException
     * @throws \OCP\Files\NotPermittedException
     */
    public function save($token, $filecontents, $path, $mtime) {
        try {
            $share = $this->shareManager->getShareByToken($token);
        } catch (ShareNotFound $e) {
            return new DataResponse(['message' => $this->l->t('Share not found')], Http::STATUS_NOT_FOUND);
        }

        if ($share->getPassword() !== null &&
            (!$this->session->exists('public_link_authenticated')
                || $this->session->get('public_link_authenticated') !== (string)$share->getId())) {
            return new DataResponse(['message' => $this->l->t('You are not authorized to open this share')], Http::STATUS_BAD_REQUEST);
        }

        try {
            $node = $share->getNode();
        } catch (NotFoundException $e) {
            return new DataResponse(['message' => $this->l->t('Share not found')], Http::STATUS_NOT_FOUND);
        }

        $writeable = $this->checkPermissions($share, \OCP\Constants::PERMISSION_UPDATE);
        if (!$writeable) {
            return new DataResponse(['message' => $this->l->t('You have no permission to write this file')], Http::STATUS_FORBIDDEN);
        }

        $file = $node;
        if ($node instanceof Folder) {
            $fullpath = trim($path);
            if (!$fullpath) {
                return new DataResponse(['message' => $this->l->t('File not found')], Http::STATUS_NOT_FOUND);
            }
            try {
                $file = $node->get($fullpath);
            } catch (NotFoundException $e) {
                return new DataResponse(['message' => $this->l->t('File not found')], Http::STATUS_NOT_FOUND);
            }
        }

        if($file->isUpdateable()) {
            if ($mtime != $file->getMTime()) {
                $this->logger->error("Anonymous cannot save shared mind map (someone updated it in the meantime): {$mtime} vs. {$file->getMTime()} {$file->getPath()}", ['app' => 'files_mindmap']);
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
            $this->logger->error('User does not have permission to write to shared file: ' . $file->getPath(), ['app' => 'files_mindmap']);
            return new DataResponse([ 'message' => $this->l->t('Insufficient permissions')],Http::STATUS_BAD_REQUEST);
        }
    }
}
