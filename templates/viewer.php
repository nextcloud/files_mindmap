<?php

/**
 * SPDX-FileCopyrightText: 2026 Nextcloud GmbH and Nextcloud contributors
 * SPDX-FileCopyrightText: 2018-2025 Jingtao Yan and files_mindmap contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

    /** @var array $_ */
    use OCP\App\IAppManager;
    use OCP\IURLGenerator;
    $urlGenerator = \OC::$server->get(IURLGenerator::class);
    $version = \OC::$server[IAppManager::class]->getAppVersion('files_mindmap');
    $lang = $_['lang'];
    $nonce = $_['cspNonce'] ?? '';
?>
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>Mind Map</title>
    <base target="_blank" />


	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/bootstrap/dist/css/bootstrap.css')) ?>?v=<?php p($version) ?>" />
	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/lib/codemirror.css')) ?>?v=<?php p($version) ?>" />
	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/hotbox/hotbox.css')) ?>?v=<?php p($version) ?>" />
	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/kityminder-core/dist/kityminder.core.css')) ?>?v=<?php p($version) ?>" />
	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/color-picker/dist/color-picker.min.css')) ?>?v=<?php p($version) ?>" />
	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/kityminder-editor/kityminder.editor.min.css')) ?>?v=<?php p($version) ?>">
	<link rel="stylesheet" href="<?php p($urlGenerator->linkTo('files_mindmap', 'css/style.css')) /* add custom css to iframe */ ?>" />


	<style>
		html, body {
			margin: 0;
			padding: 0;
			height: 100%;
			overflow: hidden;
		}
		h1.editor-title {
			background: #393F4F;
			color: white;
			margin: 0;
			height: 40px;
			font-size: 14px;
			line-height: 40px;
			font-family: 'Hiragino Sans GB', 'Arial', 'Microsoft Yahei';
			font-weight: normal;
			padding: 0 20px;
		}
		div.minder-editor-container {
			position: absolute;
			/* leave room for #menu-header, which is not positioned and would
			   otherwise be painted over by this absolutely positioned container */
			top: 40px;
			bottom: 0;
			left: 0;
			right: 0;
		}
		#autosave-div label {
			text-wrap-mode: nowrap;
		}
		#autosave-div.checkbox {
			margin: 0;
		}
		#autosave-checkbox {
			bottom: 3px;
		}
		#menu-header {
			display: flex;
			align-items: center;
			gap: 8px;
			height: 40px;
			box-sizing: border-box;
			padding: 0 5px;
			font-size: 14px;
			/* own stacking context, so the export dropdown opens above the
			   absolutely positioned editor container instead of behind it */
			position: relative;
			z-index: 10;
		}
		#menu-header .header-left-spacer {
			flex-grow: 1;
			min-width: 240px;
		}
		#menu-header .btn-group-vertical {
			margin: 0;
		}
		/* the editor stylesheet strips border, radius, padding and size from
		   .export-caption; restore them so the controls read as buttons */
		#menu-header .btn {
			width: auto;
			height: 30px;
			padding: 0 10px;
			font-size: 14px;
			line-height: 28px;
			background-color: #fff;
			border: 1px solid #ccc !important;
			border-radius: 4px !important;
		}
		#menu-header .btn .caption {
			font-size: 14px;
		}
		#menu-header .btn:focus,
		#menu-header .btn:hover {
			background-color: #eff3fa;
			border-color: #adadad !important;
		}
		#menu-header .btn:active,
		#menu-header .open > .dropdown-toggle.btn-default {
			background-color: #c4d0ee;
			border-color: #adadad !important;
		}
		/* the export group sits at the right edge, so open the menu leftwards */
		#menu-header .dropdown-menu {
			right: 0;
			left: auto;
		}
	</style>
</head>
<script nonce="<?=$nonce?>">
    var lang = '<?=$lang?>';
</script>
<body ng-app="mindmap" ng-controller="MainController">
<div id="menu-header">
	<div class="header-left-spacer"></div>
    <div id="autosave-div" class="checkbox btn-group-vertical">
        <label>
            <input type="checkbox" id="autosave-checkbox" checked="checked" title="<?php p($l->t('AutoSave')); ?>"><?php p($l->t('AutoSave')); ?>
        </label>
    </div>
    <div id="save-div" class="btn-group-vertical" >
        <button id="save-button" type="button" class="btn btn-default export-caption dropdown-toggle" title="<?php p($l->t('Save')); ?>"><?php p($l->t('Save')); ?></button>
    </div>
    <div id="export-button" class="btn-group-vertical" dropdown is-open="isopen">
        <button type="button"
            class="btn btn-default export-caption dropdown-toggle"
            title="<?php p($l->t('Export')); ?>"
            dropdown-toggle>
            <span class="caption"><?php p($l->t('Export')); ?></span>
            <span class="caret"></span>
            <span class="sr-only"><?php p($l->t('Export')); ?></span>
        </button>
        <ul class="dropdown-menu" role="menu">
            <li>
                <a id="export-png" href="javascript:void(0)" target="_self"><?php p($l->t('Export to PNG')); ?></a>
            </li>
            <li>
                <a id="export-svg" href="javascript:void(0)" target="_self"><?php p($l->t('Export to SVG')); ?></a>
            </li>
            <li>
                <a id="export-pdf" href="javascript:void(0)" target="_self"><?php p($l->t('Export to PDF')); ?></a>
            </li>
            <li>
                <a id="export-markdown" href="javascript:void(0)" target="_self"><?php p($l->t('Export to Markdown')); ?></a>
            </li>
            <li>
                <a id="export-text" href="javascript:void(0)" target="_self"><?php p($l->t('Export to Text')); ?></a>
            </li>
        </ul>
    </div>
</div>
<kityminder-editor id="viewer" lang="<?=$lang?>" on-init="initEditor(editor, minder)"></kityminder-editor>
</body>

<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/jquery/dist/jquery.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/bootstrap/dist/js/bootstrap.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/angular/angular.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/angular-bootstrap/ui-bootstrap-tpls.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/lib/codemirror.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/mode/xml/xml.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/mode/javascript/javascript.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/mode/css/css.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/mode/htmlmixed/htmlmixed.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/mode/markdown/markdown.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/addon/mode/overlay.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/codemirror/mode/gfm/gfm.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/angular-ui-codemirror/ui-codemirror.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/marked/lib/marked.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/kity/dist/kity.min.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/hotbox/hotbox.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/kityminder-core/dist/kityminder.core.min.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/color-picker/dist/color-picker.min.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/js-base64/base64.min.js')) ?>?v=<?php p($version) ?>"></script>

<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/kityminder-editor/kityminder.editor.min.js')) ?>?v=<?php p($version) ?>"></script>

<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'js/viewer.js')) ?>?v=<?php p($version) ?>"></script>
<script nonce="<?=$nonce?>" src="<?php p($urlGenerator->linkTo('files_mindmap', 'vendor/jsPDF/dist/jspdf.min.js')) ?>?v=<?php p($version) ?>"></script>
</html>

