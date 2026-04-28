export default async function handler(req, res) {
  const OWM_KEY = process.env.OWM_KEY;

  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=Seoul&appid=${OWM_KEY}&units=metric&lang=kr&cnt=8`
    );
    const weather = await weatherRes.json();

    // 일단 전체 응답 그대로 반환
    res.status(200).json(weather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
