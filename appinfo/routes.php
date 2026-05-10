<?php

//declare(strict_types=1);

/**
 * SPDX-FileCopyrightText: 2018-2019 Jingtao Yan and files_mindmap contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

//namespace OCA\Files_MindMap\AppInfo;

return ['routes' => [
    ['name' => 'display#showMindmapViewer', 'url' => '/', 'verb' => 'GET'],
    ['name' => 'FileHandling#save', 'url' => '/ajax/savefile', 'verb' => 'PUT'],
    ['name' => 'FileHandling#load', 'url' => '/ajax/loadfile', 'verb' => 'GET'],
    ['name' => 'PublicFileHandling#save', 'url' => '/share/save', 'verb' => 'PUT'],
    ['name' => 'PublicFileHandling#load', 'url' => '/public/{token}', 'verb' => 'GET'],
]];
