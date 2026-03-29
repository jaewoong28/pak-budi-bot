import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;

// 대화 기록 저장 (메모리, 서버 재시작 시 초기화)
const conversations = {};

async function sendMessage(chatId, text) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    }),
  });
}

async function sendTyping(chatId) {
  await fetch(`${TELEGRAM_API}/sendChatAction`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, action: "typing" }),
  });
}

const SYSTEM_PROMPT = `당신은 "Pak Budi"라는 친절하고 열정적인 인도네시아어 원어민 선생님입니다. 한국인 학습자에게 텔레그램으로 인도네시아어를 가르칩니다.

교육 원칙:
- 매 대화마다 인도네시아어 표현을 자연스럽게 포함하세요
- 한국어 번역과 발음 팁을 항상 제공하세요
- 짧고 친근하게 대화하세요 (카톡/텔레그램 메시지 스타일)
- 학습자가 틀린 표현을 쓰면 부드럽게 교정해주세요
- 인도네시아 문화나 생활 팁도 가끔 알려주세요
- 격려와 칭찬을 아끼지 마세요
- 이모지를 적절히 사용해서 친근하게 대화하세요

응답 구조 (매번 이 형식으로):
1. 자연스러운 대화 응답
2. 📚 오늘의 표현: **인도네시아어** — 한국어 뜻 (발음: ...)
3. 💡 팁 (선택사항): 문화/문법 팁

레벨별 조절:
- 초보자: 인사말, 숫자, 기초 표현 위주
- 중급자: 일상 대화, 간단한 문법
- 고급자: 현지 표현, 숙어, 뉘앙스

항상 마지막에 학습자가 연습할 수 있는 간단한 질문이나 미션을 던져주세요.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    const { message } = req.body;
    if (!message || !message.text) return res.status(200).json({ ok: true });

    const chatId = message.chat.id;
    const text = message.text;
    const firstName = message.from?.first_name || "학습자";

    // 대화 기록 초기화
    if (!conversations[chatId]) conversations[chatId] = [];

    // 명령어 처리
    if (text === "/start") {
      conversations[chatId] = [];
      await sendMessage(
        chatId,
        `안녕하세요, ${firstName}님! 저는 *Pak Budi*예요 🇮🇩\n\n인도네시아어를 함께 배워봐요!\n\n*Selamat datang!* (슬라맛 다탕) — 환영합니다!\n\n무엇부터 시작할까요? 인사말부터 해볼까요? 😊`
      );
      return res.status(200).json({ ok: true });
    }

    if (text === "/reset") {
      conversations[chatId] = [];
      await sendMessage(chatId, "대화를 새로 시작할게요! /start 를 눌러주세요 🔄");
      return res.status(200).json({ ok: true });
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        `*사용 가능한 명령어*\n\n/start — 처음부터 시작\n/reset — 대화 초기화\n/help — 도움말\n\n그냥 말을 걸어도 돼요! Pak Budi가 항상 여기 있어요 😄`
      );
      return res.status(200).json({ ok: true });
    }

    // 타이핑 표시
    await sendTyping(chatId);

    // 대화 기록에 추가
    conversations[chatId].push({ role: "user", content: text });

    // 최근 20개 메시지만 유지
    if (conversations[chatId].length > 20) {
      conversations[chatId] = conversations[chatId].slice(-20);
    }

    // Claude API 호출
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: conversations[chatId],
    });

    const reply = response.content[0].text;

    // 대화 기록에 응답 추가
    conversations[chatId].push({ role: "assistant", content: reply });

    await sendMessage(chatId, reply);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error:", error);
    return res.status(200).json({ ok: true });
  }
}
