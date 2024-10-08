(async () => {
    const { Octokit } = await import("@octokit/core");
    const axios = require('axios');
    const puppeteer = require('puppeteer');
    const cheerio = await import('cheerio');

    const octokit = new Octokit({
        auth: process.env.GITHUB_TOKEN
    });

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
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
                // const response = await axios.get(`https://core.trac.wordpress.org/ticket/${ticketId}`);

                const url = `https://core.trac.wordpress.org/ticket/${ticketId}`;
                await page.goto(url, { waitUntil: 'domcontentloaded' });

                // Get some data from the page (for example, the ticket status)
                const ticketStatus = await page.evaluate(() => {
                    return document.querySelector('span.trac-status').textContent.trim(); // Modify the selector to match the ticket status element
                });

                console.log(ticketStatus);

                // const $ = cheerio.load(response.data);
                // const statusText = $('span.trac-status').text();

                if (ticketStatus && ticketStatus.toLowerCase().includes('closed')) {
                    await octokit.request('POST /repos/Sunrise-SoftTech/wp-workflow-setup/pulls/{issue_number}/comments', {
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
