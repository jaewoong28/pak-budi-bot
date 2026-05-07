export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;
  const OWM_KEY = "20e4c950bcbe3acf63fa6b94be614f70";

  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=Seoul&appid=${OWM_KEY}&units=metric&lang=kr&cnt=8`
    );
    const weather = await weatherRes.json();

    const today = weather.list[0];
    const desc = today.weather[0].description;
    const temp = Math.round(today.main.temp);
    const feels = Math.round(today.main.feels_like);
    const tempMin = Math.round(today.main.temp_min);
    const tempMax = Math.round(today.main.temp_max);
    const humidity = today.main.humidity;
    const rain = today.rain?.['3h'] ?? 0;
    const wind = today.wind.speed;

    const message = `🌤 오늘 서울 날씨\n\n☁️ ${desc}\n🌡 현재: ${temp}°C (체감 ${feels}°C)\n📊 최고: ${tempMax}° / 최저: ${tempMin}°\n💧 습도: ${humidity}%\n🌧 강수: ${rain}mm\n💨 바람: ${wind}m/s`;

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text: message })
    });

    res.status(200).json({ ok: true, message });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
