import { env } from "../config/env.js";

const TELEGRAM_MESSAGE_LIMIT = 3500;

export async function sendTelegramMessage({ phone, text, replyMarkup }) {
  const chatId = extractTelegramChatId(phone);
  if (!env.telegramBotToken || !chatId || !text) return false;

  const chunks = splitMessage(text);
  for (const [index, chunk] of chunks.entries()) {
    const body = {
      chat_id: chatId,
      text: chunk,
      disable_web_page_preview: false,
    };

    if (replyMarkup && index === chunks.length - 1) {
      body.reply_markup = replyMarkup;
    }

    const response = await fetch(`https://api.telegram.org/bot${env.telegramBotToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`Telegram sendMessage failed: ${response.status} ${errorText.slice(0, 180)}`);
      return false;
    }
  }

  return true;
}

function extractTelegramChatId(phone) {
  const value = String(phone || "");
  if (!value) return null;
  return value.startsWith("telegram:") ? value.slice("telegram:".length) : value;
}

function splitMessage(text) {
  const value = String(text || "");
  if (value.length <= TELEGRAM_MESSAGE_LIMIT) return [value];

  const chunks = [];
  for (let index = 0; index < value.length; index += TELEGRAM_MESSAGE_LIMIT) {
    chunks.push(value.slice(index, index + TELEGRAM_MESSAGE_LIMIT));
  }
  return chunks;
}
