import {
  isGenericHook,
  isGithubHook,
  isSlackHook,
} from '@sorry-cypress/common';

import {
  Project,
  HookEvent,
  RunWithSpecs,
  getRunSummary,
} from '@sorry-cypress/common';
import { getCleanHookReportData } from '../utils';
import { reportStatusToGithub } from './github';
import { reportToGenericWebHook } from './generic';
import { reportToSlack } from './slack';

export function reportToHook({
  hookEvent,
  run,
  project,
}: {
  hookEvent: HookEvent;
  run: RunWithSpecs;
  project: Project;
}): Promise<any> {
  try {
    const runSummary = getCleanHookReportData(
      getRunSummary(run.specsFull.map((s) => s.results?.stats))
    );

    project?.hooks?.forEach((hook) => {
      if (isSlackHook(hook)) {
        return reportToSlack({
          hook,
          runSummary,
          runId: run.runId,
          ciBuildId: run.meta.ciBuildId,
          hookEvent,
        });
      }
      if (isGithubHook(hook)) {
        return reportStatusToGithub({
          hook,
          sha: run.meta.commit.sha,
          runId: run.runId,
          runSummary,
          hookEvent,
        });
      }

      if (isGenericHook(hook)) {
        return reportToGenericWebHook({
          hook,
          runId: run.runId,
          runSummary,
          hookEvent,
        });
      }
    });
  } catch (error) {
    console.error(`Failed to run hook at for ${project.projectId}`, error);
  }
  return Promise.resolve();
}