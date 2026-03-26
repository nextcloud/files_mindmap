import { getLoggerBuilder } from '@nextcloud/logger'

const logger = getLoggerBuilder()
	.setApp('Files_MindMap')
	.detectUser()
	.build()

export default logger
