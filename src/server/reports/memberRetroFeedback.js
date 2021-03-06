/* eslint-disable camelcase */
import Promise from 'bluebird'

import getUser from 'src/server/actions/getUser'
import findUsers from 'src/server/actions/findUsers'
import {Project, Response} from 'src/server/services/dataService'
import {mapById} from 'src/server/util'
import {LGBadRequestError} from 'src/server/util/error'
import {writeCSV} from './util'

const HEADERS = [
  'subject_handle',
  'subject_name',
  'cycle_number',
  'project_name',
  'respondent_handle',
  'respondent_name',
  'feedback_type_descriptor',
  'response_type',
  'response_value',
  'question_body',
]

export default async function handleRequest(req, res) {
  const {handle} = req.query
  if (!handle) {
    throw new LGBadRequestError('Must provide user handle (ex: ?handle=supercooluser)')
  }

  const userHandle = String(handle).trim()
  const user = await getUser(userHandle)
  if (!user) {
    throw new LGBadRequestError(`User not found for handle ${userHandle}`)
  }

  const reportRows = await generateReport(user)

  res.setHeader('Content-disposition', `attachment; filename=memberRetroFeedback_${userHandle}.csv`)
  return writeCSV(reportRows, res, {headers: HEADERS})
}

async function generateReport(user) {
  const projects = await findUserProjects(user.id)

  return Promise.reduce(projects, async (result, project) => {
    const {cycle} = project
    const [retroSurveyResponses, projectMembers] = await Promise.all([
      getSurveyResponsesForSubject(user.id, project.retrospectiveSurveyId),
      findUsers(project.memberIds),
    ])

    const projectMembersById = mapById(projectMembers)

    const reportRows = retroSurveyResponses.map(response => {
      const respondent = projectMembersById.get(response.respondentId)
      if (!respondent) {
        console.warn('Survey response found for user no longer a member of project')
        return result
      }

      return {
        subject_handle: user.handle,
        subject_name: user.name,
        cycle_number: cycle.cycleNumber,
        project_name: project.name,
        respondent_handle: respondent.handle,
        respondent_name: respondent.name,
        feedback_type_descriptor: response.question.feedbackType.descriptor,
        response_type: response.question.responseType,
        response_value: response.value,
        question_body: response.question.body,
      }
    })

    return result.concat(reportRows)
  }, [])
}

function getSurveyResponsesForSubject(subjectId, surveyId) {
  return Response
    .filter({subjectId, surveyId})
    .getJoin({question: {feedbackType: true}})
    .orderBy('questionId', 'respondentId')
}

function findUserProjects(userId) {
  return Project
    .filter(row => row('memberIds').contains(userId))
    .getJoin({cycle: true})
    .orderBy('createdAt')
}
