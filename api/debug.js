export default function handler(req, res) {
    const cookieVar = process.env.YOUTUBE_COOKIES;
    const status = {
        hasEnvVar: !!cookieVar,
        envVarLength: cookieVar ? cookieVar.length : 0,
        parsedCookies: 0,
        error: null,
    };

    if (cookieVar) {
        try {
            const cookies = cookieVar.split(';').map(c => c.trim());
            status.parsedCookies = cookies.length;
            status.sampleCookie = cookies[0].split('=')[0] + '=[HIDDEN]'; // Safe preview
        } catch (e) {
            status.error = e.message;
        }
    }

    res.status(200).json(status);
}
