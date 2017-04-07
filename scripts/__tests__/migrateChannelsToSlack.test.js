/* eslint-env mocha */
/* global expect, testContext */
/* eslint-disable prefer-arrow-callback, no-unused-expressions */

import nock from 'nock'

import {fetchTeamChannels} from '../slackMigration/migrateChannelsToSlack'
import {useFixture} from 'src/test/helpers'

describe(testContext(__filename), () => {
  useFixture.nockClean()
  describe('Migrate Channels To Slack Scripts', () => {
    describe('createChannel()', () => {
      it('returns an array of published goal Numbers', async () => {
        const response = {
          goals: [
            {goal_id: 110, title: 'Project 110', published: true},
            {goal_id: 98, title: 'Project 98', published: false},
            {goal_id: 128, title: 'Project 128',  published: true},
            {goal_id: 14,  title: 'Project 14', published: true},
          ]
        }

        nock('https://jsdev.learnersguild.org')
          .get('/api/goals/index.json')
          .reply(200, response)

        const actualResult = await fetchTeamChannels()
        const channelList = [
          {channelName: 110, topic: 'Project 110'},
          {channelName: 128, topic: 'Project 128'},
          {channelName: 14, topic: 'Project 14'},
        ]
        expect(actualResult).to.eql(channelList)
      })
    })
  })
})
