import * as core from '@actions/core';
import * as github from '@actions/github';

async function run() {
  try {
    const githubToken = core.getInput('github-token');
    const sourceBranchName = core.getInput('source');
    const destBranchName = core.getInput('dest');
    console.log(`Mirroring ${sourceBranchName} to ${destBranchName}.`);

    const octokit = github.getOctokit(githubToken);
    const sourceBranchTip = await octokit.git.getRef({
      ...github.context.repo,
      ref: `heads/${sourceBranchName}`,
    });
    github.context.repo.
    await octokit.git.updateRef({
      ...github.context.repo,
      ref: `heads/${destBranchName}`,
      sha: sourceBranchTip.data.object.sha,
    })
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
