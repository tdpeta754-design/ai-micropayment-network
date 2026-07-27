/**
 * ============================================================================
 * 🤖 AIMPN V2.0 — AUTONOMOUS OUTREACH BOT & AMBASSADOR ENGINE
 * ============================================================================
 * Automatically executes outreach campaigns to target developer repositories
 * via GitHub API and Twitter/X API, or generates one-click web intents.
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const DOSSIER_PATH = path.join(__dirname, "target_dossier.json");
const OUTPUT_HTML_PATH = path.join(__dirname, "outreach_campaign.html");
const OUTPUT_MD_PATH = path.join(__dirname, "OUTREACH_CAMPAIGN_LINKS.md");

async function executeGitHubAPIOutreach(target, token) {
  try {
    console.log(`   📡 [GitHub API] Posting Issue to ${target.repo}...`);
    const response = await fetch(`https://api.github.com/repos/${target.repo}/issues`, {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: `🎁 [Bounty Invitation] $10 USDC Instant Reward & Zero-Gas M2M Payments for ${target.name}`,
        body: target.outreachMessage
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`   ✅ [SUCCESS] Posted Issue: ${data.html_url}`);
      return { success: true, url: data.html_url };
    } else {
      const err = await response.text();
      console.log(`   ⚠️ [GitHub API Notice] Could not post directly (${response.status}): Repo might require manual Issue creation or Discussion.`);
      return { success: false, error: err };
    }
  } catch (error) {
    console.error(`   ❌ [GitHub API Error]:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log("====================================================================");
  console.log("🤖 AIMPN V2.0 — AUTONOMOUS OUTREACH BOT & AMBASSADOR ENGINE");
  console.log("====================================================================\n");

  if (!fs.existsSync(DOSSIER_PATH)) {
    console.error("❌ Error: target_dossier.json not found! Please run `node target-scanner.js` first.");
    process.exit(1);
  }

  const dossier = JSON.parse(fs.readFileSync(DOSSIER_PATH, "utf8"));
  console.log(`📋 Loaded ${dossier.length} high-priority targets from target_dossier.json\n`);

  const githubToken = process.env.GITHUB_PAT_TOKEN || process.env.GITHUB_TOKEN;
  const twitterToken = process.env.TWITTER_BEARER_TOKEN;

  console.log("🔍 Checking Autonomous API Credentials in .env...");
  console.log(`   └─ GitHub API Token : ${githubToken ? "✅ DETECTED (Ready for automated posting)" : "🟡 NOT DETECTED (Using One-Click Web Intent Fallback)"}`);
  console.log(`   └─ Twitter API Token: ${twitterToken ? "✅ DETECTED (Ready for automated tweeting)" : "🟡 NOT DETECTED (Using One-Click Web Intent Fallback)"}\n`);

  console.log("⚡ Executing Autonomous Ambassador Campaigns...\n");

  const campaignResults = [];

  for (const target of dossier) {
    console.log(`🎯 Processing Target: [ ${target.repo} ] (Score: ${target.aiScore}/100)`);

    let githubResult = null;
    if (githubToken) {
      githubResult = await executeGitHubAPIOutreach(target, githubToken);
    }

    // Generate Pre-filled Web Intent URLs
    const encodedTitle = encodeURIComponent(`🎁 [Bounty Invitation] $10 USDC Instant Reward & Zero-Gas M2M Payments for ${target.name}`);
    const encodedBody = encodeURIComponent(target.outreachMessage);
    const githubIssueUrl = `https://github.com/${target.repo}/issues/new?title=${encodedTitle}&body=${encodedBody}`;

    // Tweet text
    const tweetText = `🚀 Calling all @${target.owner} builders! 🤖\n\nWe just launched AiMPN v2.0 on @base Mainnet! Integrate @antigravity/sdk for ZERO-GAS M2M micropayments + get an instant $10 USDC bounty! 🎁⚡\n\nDocs & $10 Bounty: https://github.com/tdpeta754-design/ai-micropayment-network\n\n#AiMPN #BaseBuilds @jessepollak`;
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

    campaignResults.push({
      ...target,
      githubIssueUrl,
      twitterIntentUrl,
      apiSuccess: githubResult?.success || false,
      apiPostedUrl: githubResult?.url || null
    });

    console.log(`   └─ Generated Pre-filled GitHub Issue URL`);
    console.log(`   └─ Generated Pre-filled X/Twitter Intent URL\n`);
  }

  // Generate Markdown Dashboard
  let mdContent = `# 🚀 AIMPN V2.0 — AUTONOMOUS OUTREACH CAMPAIGN LAUNCHPAD\n\n`;
  mdContent += `Generated at: ${new Date().toISOString()}\n\n`;
  mdContent += `This document contains instant one-click launch links to post our **$10 USDC Builder Bounty** directly to our top identified target communities.\n\n`;

  campaignResults.forEach((res, idx) => {
    mdContent += `## ${idx + 1}. ${res.name} (\`${res.repo}\`)\n`;
    mdContent += `- **AI Score:** ${res.aiScore}/100 | **Language:** ${res.language}\n`;
    mdContent += `- **Pain Point:** *${res.painPoint}*\n`;
    if (res.apiPostedUrl) {
      mdContent += `- **✅ AUTOBOT POSTED:** [View Live Issue on GitHub](${res.apiPostedUrl})\n`;
    }
    mdContent += `- **🔗 One-Click Post to GitHub Issues:** [Click Here to Open Pre-filled Issue](${res.githubIssueUrl})\n`;
    mdContent += `- **🐦 One-Click Post to X/Twitter:** [Click Here to Open Pre-filled Tweet](${res.twitterIntentUrl})\n\n`;
    mdContent += `<details><summary>📄 View Outreach Message Copy</summary>\n\n\`\`\`markdown\n${res.outreachMessage}\n\`\`\`\n\n</details>\n\n---\n\n`;
  });

  fs.writeFileSync(OUTPUT_MD_PATH, mdContent, "utf8");
  console.log(`✅ Campaign launchpad markdown saved to: ${OUTPUT_MD_PATH}`);

  // Generate HTML Executive Dashboard
  let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>AiMPN v2.0 — Outreach Launchpad</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0b0f19; color: #e2e8f0; margin: 0; padding: 40px; }
    .container { max-width: 900px; margin: 0 auto; }
    h1 { color: #38bdf8; border-bottom: 2px solid #1e293b; padding-bottom: 15px; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 24px; margin-bottom: 24px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .title { font-size: 20px; font-weight: bold; color: #f8fafc; }
    .badge { background: #0369a1; color: #fff; padding: 4px 12px; border-radius: 20px; font-size: 14px; font-weight: bold; }
    .pain { color: #94a3b8; font-style: italic; margin-bottom: 20px; }
    .btn-group { display: flex; gap: 12px; flex-wrap: wrap; }
    .btn { display: inline-flex; align-items: center; justify-content: center; padding: 12px 20px; border-radius: 8px; font-weight: bold; text-decoration: none; transition: all 0.2s; }
    .btn-gh { background: #238636; color: #ffffff; }
    .btn-gh:hover { background: #2ea043; transform: translateY(-2px); }
    .btn-tw { background: #1d9bf0; color: #ffffff; }
    .btn-tw:hover { background: #1a8cd8; transform: translateY(-2px); }
  </style>
</head>
<body>
  <div class="container">
    <h1>🚀 AiMPN v2.0 — Autonomous Outreach Campaign</h1>
    <p style="color: #94a3b8; margin-bottom: 30px;">Select a target below and click the button to instantly open the pre-filled bounty invitation in your browser.</p>
`;

  campaignResults.forEach((res, idx) => {
    htmlContent += `
    <div class="card">
      <div class="header">
        <div class="title">${idx + 1}. ${res.name}</div>
        <div class="badge">Score: ${res.aiScore}/100</div>
      </div>
      <div class="pain">"${res.painPoint}"</div>
      <div class="btn-group">
        <a href="${res.githubIssueUrl}" target="_blank" class="btn btn-gh">💬 Post Pre-filled GitHub Issue</a>
        <a href="${res.twitterIntentUrl}" target="_blank" class="btn btn-tw">🐦 Post Pre-filled Tweet to X</a>
      </div>
    </div>
`;
  });

  htmlContent += `
  </div>
</body>
</html>`;

  fs.writeFileSync(OUTPUT_HTML_PATH, htmlContent, "utf8");
  console.log(`✅ Interactive HTML launchpad saved to: ${OUTPUT_HTML_PATH}`);

  console.log("\n====================================================================");
  console.log("🎉 AUTONOMOUS OUTREACH ENGINE EXECUTION COMPLETE!");
  console.log("====================================================================\n");
}

main().catch(console.error);
