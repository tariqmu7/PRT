export default async function handler(req, res) {
  // CORS Headers to allow your frontend to talk to this backend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with your specific domain in production
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight check
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { GITHUB_TOKEN, REPO_OWNER, REPO_NAME, FILE_PATH } = process.env;
  const GITHUB_API_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

  // Helper to fetch file from GitHub
  const getFile = async () => {
    const response = await fetch(GITHUB_API_URL, {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    
    if (response.status === 404) return { sha: null, content: [] }; // File doesn't exist yet
    if (!response.ok) throw new Error("GitHub API Error");
    
    const data = await response.json();
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf-8'));
    return { sha: data.sha, content };
  };

  try {
    // --- POST: Submit New Answer ---
    if (req.method === 'POST') {
      const newSubmission = req.body;
      
      // 1. Get current data
      const { sha, content } = await getFile();
      
      // 2. Append new data
      const updatedContent = [...content, newSubmission];
      
      // 3. Push back to GitHub
      const updateResponse = await fetch(GITHUB_API_URL, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: "New Exam Submission via App",
          content: Buffer.from(JSON.stringify(updatedContent, null, 2)).toString('base64'),
          sha: sha, // Required to update existing file
        }),
      });

      if (!updateResponse.ok) throw new Error("Failed to update GitHub");
      
      return res.status(200).json({ success: true, message: "Saved to GitHub" });
    }

    // --- GET: Fetch All Results (For Admin Panel) ---
    if (req.method === 'GET') {
      const { content } = await getFile();
      return res.status(200).json(content);
    }

    return res.status(405).json({ error: "Method not allowed" });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}