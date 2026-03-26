import MindMap from './views/MindMap.vue'
import FilesMindMap from './mindmap'

OCA.FilesMindMap = FilesMindMap

FilesMindMap.init()
FilesMindMap.registerNewFileMenuPlugin()
FilesMindMap.registerFileActions()

const supportedMimes = OCA.FilesMindMap.getSupportedMimetypes()

if (OCA.Viewer) {
	OCA.Viewer.registerHandler({
		id: 'mindmap',
		group: null,
		mimes: supportedMimes,
		component: MindMap,
		theme: 'default',
		canCompare: true,
	})
}
