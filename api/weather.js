export default async function handler(req, res) {
  const OWM_KEY = "20e4c950bcbe3acf63fa6b94be614f70";

  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=Seoul&appid=${OWM_KEY}&units=metric&lang=kr`
    );
    const weather = await weatherRes.json();
    res.status(200).json(weather);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
