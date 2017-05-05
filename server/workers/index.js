global.__CLIENT__ = false
global.__SERVER__ = true

// start workers
require('./chapterCreated').start()
require('./chatMessageSent').start()
require('./cycleCompleted').start()
require('./cycleInitialized').start()
require('./cycleReflectionStarted').start()
require('./projectArtifactChanged').start()
require('./surveySubmitted').start()
require('./userCreated').start()
require('./voteSubmitted').start()
require('./projectFormationComplete').start()
require('./projectStarted').start()
require('./projectArtifactDeadlinePassed').start()

// start change feed listeners
require('src/server/configureChangeFeeds')()
