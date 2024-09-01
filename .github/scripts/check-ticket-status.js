const axios = require('axios');
const { Octokit } = require("@octokit/core");

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

(async () => {
    try {
        const { data: pullRequests } = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
            owner: 'Sunrise-SoftTech',
            repo: 'wp-workflow-setup',
            state: 'open'
        });

        for (const pr of pullRequests) {
            const prBody = pr.body;
            const ticketUrl = prBody.match(/https:\/\/core.trac.wordpress.org\/ticket\/(\d+)/);

            if (ticketUrl && ticketUrl[0]) {
                const ticketId = ticketUrl[1];
                const response = await axios.get(`https://core.trac.wordpress.org/rest/ticket/${ticketId}`);

                const ticketStatus = response.data.status;

                if (ticketStatus === 'closed') {
                    await octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
                        owner: 'Sunrise-SoftTech',
                        repo: 'wp-workflow-setup',
                        issue_number: pr.number,
                        body: 'The ticket associated with this PR is closed. Do you still want to keep this PR open?'
                    });
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
})();
