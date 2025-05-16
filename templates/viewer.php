<?php
    /** @var array $_ */
    use OCP\App\IAppManager;
    use OCP\IURLGenerator;
    $urlGenerator = \OC::$server->get(IURLGenerator::class);
    $version = \OC::$server[IAppManager::class]->getAppVersion('files_mindmap');
    $lang = $_['lang'];
    if (method_exists(\OC::$server, 'getContentSecurityPolicyNonceManager')) {
        $nonce = \OC::$server->getContentSecurityPolicyNonceManager()->getNonce();
    } else {
        $nonce = '';
    }
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
			top: 0;
			bottom: 0;
			left: 0;
			right: 0;
		}
		#autosave-div {
			z-index: 10000;
		}
		#autosave-checkbox {
			bottom: 3px;
		}
		#save-div {
			z-index: 10000;
		}
		#export-button {
			z-index: 10000;
		}
		#menu-header {
			display: flex;
		}
		#menu-header .header-left-spacer {
			flex: 1;
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

