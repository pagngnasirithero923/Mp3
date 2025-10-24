const yts = require('yt-search');

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        // Search for YouTube videos
        const searchResults = await yts(query);
        
        if (!searchResults.videos.length) {
            return res.status(404).json({ error: 'No results found' });
        }

        const video = searchResults.videos[0];

        // Construct response data
        const songData = {
            title: video.title,
            url: video.url,
            thumbnail: video.thumbnail,
            duration: video.timestamp,
            views: video.views,
            author: video.author.name
        };

        res.json(songData);

    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
