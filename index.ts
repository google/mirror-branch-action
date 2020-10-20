/**
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as core from '@actions/core';
import * as github from '@actions/github';
import type { OctokitResponse, GitUpdateRefResponseData } from '@octokit/types';

async function run(): Promise<void> {
  try {
    const githubToken = core.getInput('github-token');
    const sourceBranchName = core.getInput('source');
    const destBranchNames = JSON.parse(core.getInput('dest'));

    const octokit = github.getOctokit(githubToken);
    const sourceBranchTip = await octokit.git.getRef({
      ...github.context.repo,
      ref: `heads/${sourceBranchName}`,
    });

    if (sourceBranchTip.data.object.type !== "commit") {
      throw new Error(`Expected branch ${sourceBranchName} to resolve to a commit. Got a ${sourceBranchTip.data.object.type}.`);
    }

    const sourceBranchSha = sourceBranchTip.data.object.sha;

    destBranchNames.forEach(async (destBranchName: string) => {
      console.log(`Pushing ${sourceBranchName} (${sourceBranchSha}) to ${destBranchName}.`);

      let result: OctokitResponse<GitUpdateRefResponseData>;
      try {
        result = await octokit.git.updateRef({
          ...github.context.repo,
          ref: `heads/${destBranchName}`,
          sha: sourceBranchSha,
          force: true,
        });
      } catch (error) {
        if (error.message !== 'Reference does not exist') {
          throw error;
        }
        console.log(`${destBranchName} does not exist. Creating it.`);
        result = await octokit.git.createRef({
          ...github.context.repo,
          ref: `refs/heads/${destBranchName}`,
          sha: sourceBranchSha,
        });
      }

      console.log(`Set ${result.data.ref} to ${result.data.object.sha}.`);
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
