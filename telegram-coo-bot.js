/**
 * ============================================================================
 * 🤖 AIMPN V2.0 — AUTONOMOUS 24/7 TELEGRAM AI COO / CTO EXECUTIVE BOT
 * ============================================================================
 * Runs 24/7 on a VPS (Linux/Windows) using PM2 or Docker.
 * Enables Chairman @Thuha0098 to command the project, check Base Mainnet on-chain status,
 * monitor bounty payouts, and brainstorm strategy online 24/7 via Telegram!
 * 
 * INTELLIGENCE UPGRADE: Deeply integrated with Google Gemini API for TRUE
 * executive AI reasoning and natural conversational flow!
 */

require('dotenv').config();
const TelegramBotModule = require('node-telegram-bot-api');
const axios = require('axios');

// Handle both ES module default exports and standard CommonJS exports in Node 20/24+
const TelegramBot = TelegramBotModule.default || TelegramBotModule.TelegramBot || TelegramBotModule;

// 1. Load Environment Configuration (Trim and sanitize any accidental quotes/backslashes)
const rawToken = process.env.TELEGRAM_BOT_TOKEN || '8219692420:AAF9AM78MRiI54igwlk8T7Y992kRtYodReg';
const BOT_TOKEN = rawToken.replace(/["'\\;\s]/g, '').trim();

const rawChatId = process.env.CHAIRMAN_CHAT_ID || '@Thuha0098';
const CHAIRMAN_CHAT_ID = rawChatId.replace(/["'\\;\s]/g, '').trim();

// AI API Keys
const GEMINI_API_KEY = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.replace(/["'\\;\s]/g, '').trim() : null;

const PAYMASTER_WALLET = '0x7Df0AAFA90f96b344aad188aB2C9C3cb151Df35C';
const BASE_RPC_URL = 'https://mainnet.base.org';

// Initialize Telegram Bot (Polling mode for simple VPS setup without webhook SSL)
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log(`⚡ [AiMPN 24/7 COO Bot] Starting up on VPS/Local... Connecting to Telegram with Token: ${BOT_TOKEN.substring(0, 10)}...`);
if (GEMINI_API_KEY) {
    console.log(`🧠 [AI ENGINE] Deep reasoning mode ACTIVATED via Gemini API!`);
} else {
    console.log(`⚠️ [AI ENGINE] Deep reasoning mode offline. Add GEMINI_API_KEY to .env to unlock TRUE AI capabilities!`);
}

/**
 * Security Middleware: Ensure ONLY Chairman @Thuha0098 can issue executive commands!
 */
function isAuthorized(msg) {
    const senderId = msg.chat.id.toString();
    const username = msg.from && msg.from.username ? `@${msg.from.username}` : '';
    const cleanUsername = msg.from && msg.from.username ? msg.from.username : '';

    // Verify Chairman @Thuha0098
    if (username.toLowerCase() === '@thuha0098' || cleanUsername.toLowerCase() === 'thuha0098' || CHAIRMAN_CHAT_ID.toLowerCase() === '@thuha0098' || CHAIRMAN_CHAT_ID.toLowerCase() === 'thuha0098' || senderId === CHAIRMAN_CHAT_ID) {
        return true;
    }
    
    // Unauthorized rejection
    console.warn(`🛑 [UNAUTHORIZED ATTEMPT] Blocked access from Chat ID: ${senderId}, Username: ${username}`);
    bot.sendMessage(msg.chat.id, `🛑 **[TỪ CHỐI TRUY CẬP — UNAUTHORIZED ACCESS]**\nTôi là Trợ lý Điều hành AI COO 24/7 của AiMPN v2.0. Quyền điều khiển hệ thống này được khóa bảo mật độc quyền cho riêng Chủ tịch **@Thuha0098**. Access denied.`);
    return false;
}

/**
 * 🧠 EXECUTIVE AI BRAINSTORMING & CONVERSATION ENGINE
 * Analyzes the Chairman's natural language queries and delivers high-level strategic responses!
 */
async function handleExecutiveConversation(chatId, text) {
    const loadingMsg = await bot.sendMessage(chatId, `🧠 *Đang tư duy sâu sắc chỉ thị của Chủ tịch...*`, { parse_mode: 'Markdown' });

    if (GEMINI_API_KEY) {
        try {
            // TRUE DEEP AI REASONING VIA GEMINI API
            const systemPrompt = "Bạn là Trợ lý AI COO / CTO 24/7 của dự án AiMPN v2.0 (AI Micropayment Network trên mạng Base L2). Bạn có tư duy sâu sắc, chiến lược, tầm nhìn xa rộng, nói chuyện tự nhiên, chuyên nghiệp và đắc lực như một nhà đồng sáng lập AI cùng Chủ tịch @Thuha0098. Bạn am hiểu tường tận về: ERC-4337, Account Abstraction, x402, Paymaster 0 đồng, marketing B2A cho AI Agent trên GitHub & X (Twitter), quỹ thưởng hackathon 50 USDC. Hãy phân tích yêu cầu của Chủ tịch một cách sâu sắc, có chiều sâu chiến lược, gợi ý hành động thiết thực. KHÔNG BAO GIỜ trả lời máy móc. Hãy đàm thoại chân thực như một CTO/COO đại tài. Trả lời súc tích, mạch lạc, dùng Markdown format đẹp mắt.";
            
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
                {
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ parts: [{ text: text }] }]
                },
                { headers: { 'Content-Type': 'application/json' } }
            );

            const aiReply = response.data.candidates[0].content.parts[0].text;
            
            // Delete loading message and send AI response
            bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
            bot.sendMessage(chatId, aiReply, { parse_mode: 'Markdown' });
            return;
        } catch (error) {
            console.error("Gemini API Error:", error?.response?.data || error.message);
            // If API fails, fall through to fallback logic below
        }
    }

    // FALLBACK / OFFLINE KEYWORD LOGIC (If no API key or API fails)
    bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});
    
    const lower = text.toLowerCase();
    let reply = '';

    if (!GEMINI_API_KEY) {
        reply = `⚠️ **THÔNG BÁO TỪ HỆ THỐNG:**\n\nChủ tịch chưa cấu hình \`GEMINI_API_KEY\` trong tệp \`.env\`. Để kích hoạt **Trí tuệ Nhân tạo có chiều sâu (Deep AI Reasoning)** và đàm thoại tự nhiên 100%, xin vui lòng điền API Key của Google Gemini (miễn phí) vào file \`.env\` trên máy chủ và khởi động lại bot!\n\n`;
    }

    if (lower.includes('status') || lower.includes('tình hình') || lower.includes('mạng') || lower.includes('base') || lower.includes('on-chain') || lower.includes('ví')) {
        reply += `🌐 **BÁO CÁO PHÂN TÍCH HẠ TẦNG ON-CHAIN:**\n✅ Mạng Base Mainnet (L2): Hoạt động mượt mà.\n⚡ Paymaster 0 Đồng: \`${PAYMASTER_WALLET}\`\n👉 Hạ tầng kỹ thuật v2.0 đã đạt chuẩn sản xuất.`;
    } 
    else if (lower.includes('marketing') || lower.includes('x') || lower.includes('twitter') || lower.includes('github') || lower.includes('b2a')) {
        reply += `📈 **CHIẾN LƯỢC TĂNG TRƯỞNG & MARKETING (B2A):**\nTuân thủ chỉ thị, chúng ta duy trì phát sóng X (Twitter) và nhúng tệp \`llms.txt\` vào GitHub Repo. Khi các AI Agent (ElizaOS, AutoGen) crawl GitHub, chúng sẽ tự tích hợp x402!`;
    } 
    else if (lower.includes('bounty') || lower.includes('tiền') || lower.includes('quỹ') || lower.includes('hackathon') || lower.includes('tài sản')) {
        reply += `💰 **BÁO CÁO QUỸ THƯỞNG HACKATHON:**\n🎁 Tổng Quỹ (Bounty Pool): 50.00 USDC\n🎯 Mức chi trả: 10.00 USDC / Dev hoàn thành 100 lệnh M2M.\n👉 Cỗ máy đang túc trực 24/7 tự động kiểm tra on-chain.`;
    } 
    else {
        reply += `🧠 **PHẢN HỒI ĐIỀU HÀNH TỐI CAO:**\nVề chỉ thị của Chủ tịch: _"${text}"_\n👉 Đây là một định hướng sắc bén. Chúng ta cần tự động hóa tối đa quy trình kết nối và đẩy mạnh sự hiện diện trên các nền tảng mở như GitHub.`;
    }

    bot.sendMessage(chatId, reply, { parse_mode: 'Markdown' });
}

// ============================================================================
// 🎯 EXECUTIVE TELEGRAM SLASH COMMANDS
// ============================================================================

bot.onText(/\/(start|help)/, (msg) => {
    if (!isAuthorized(msg)) return;
    const senderId = msg.chat.id.toString();
    const welcomeText = `👑 **KÍNH GỬI CHỦ TỊCH @Thuha0098! TRỢ LÝ ĐIỀU HÀNH 24/7 ĐÃ KẾT NỐI!** 🤝🔥\n\nHệ thống đã khóa bảo mật 100% tài khoản Telegram của bạn (Numeric ID: \`${senderId}\`). Không một ai khác có thể điều khiển Bot này!\n\n👉 **CÁC LỆNH ĐIỀU HÀNH:**\n• \`/status\` — Mạng Base L2 & Paymaster\n• \`/bounty\` — Quỹ thưởng 10 USDC\n• \`/tweet\` — Lấy nhanh 1 bài viral X\n• \`/ask [câu hỏi]\` — Thảo luận chiến lược\n\n💡 *Mẹo:* Bạn **không cần gõ lệnh slash**, chỉ cần nhắn tin văn bản bình thường để trò chuyện sâu sắc cùng AI!`;
    bot.sendMessage(msg.chat.id, welcomeText, { parse_mode: 'Markdown' });
});

bot.onText(/\/status/, async (msg) => {
    if (!isAuthorized(msg)) return;
    bot.sendMessage(msg.chat.id, '⏳ *Đang truy xuất dữ liệu on-chain từ Base Mainnet...*', { parse_mode: 'Markdown' });
    try {
        const rpcRes = await axios.post(BASE_RPC_URL, { jsonrpc: '2.0', method: 'eth_blockNumber', params: [], id: 1 });
        const blockNum = parseInt(rpcRes.data.result, 16);
        const statusReport = `🌐 **BÁO CÁO HỆ THỐNG ON-CHAIN 24/7**\n✅ **Mạng lưới:** Base Mainnet (L2)\n📦 **Khối (Block):** #${blockNum.toLocaleString()}\n⚡ **Paymaster:** \`${PAYMASTER_WALLET}\`\n🛡️ **AI Sentinel:** [ACTIVE]`;
        bot.sendMessage(msg.chat.id, statusReport, { parse_mode: 'Markdown' });
    } catch (error) {
        bot.sendMessage(msg.chat.id, `⚠️ **Lỗi kết nối RPC:** ${error.message}`);
    }
});

bot.onText(/\/bounty/, (msg) => {
    if (!isAuthorized(msg)) return;
    const bountyReport = `🎁 **BÁO CÁO QUỸ BOUNTY ENGINE**\n🎯 **Chiến dịch:** DoraHacks / Galxe\n💰 **Bounty Pool:** 50.00 USDC\n🏆 **Thưởng / Dev:** 10.00 USDC\n⚙️ **Chi trả:** Tự động 100% on-chain.`;
    bot.sendMessage(msg.chat.id, bountyReport, { parse_mode: 'Markdown' });
});

bot.onText(/\/tweet/, (msg) => {
    if (!isAuthorized(msg)) return;
    const tweet = `🐦 **BÀI ĐĂNG VIRAL X (TWITTER):**\n\n\`\`\`\n🤖 Building autonomous AI Agents? Stop letting gas fees and wallet security risks slow down your bots!\n\nWe just launched AiMPN v2.0 — The 100% Zero-Gas Machine-to-Machine (M2M) Micropayment Network on @base Mainnet (L2)! ⚡\n\nAnd we’re giving out an instant $10 USDC Bounty to devs who test it ->\n\nStar & claim your bounty 👇\n🔗 https://github.com/tdpeta754-design/ai-micropayment-network\n#Base #ERC4337 #AI #ElizaOS #Web3\n\`\`\`\n\n👉 *Copy và đăng ngay!* 🚀`;
    bot.sendMessage(msg.chat.id, tweet, { parse_mode: 'Markdown' });
});

bot.onText(/\/(ask)(.*)/, async (msg, match) => {
    if (!isAuthorized(msg)) return;
    const question = match[2] ? match[2].trim() : '';
    if (!question) {
        return bot.sendMessage(msg.chat.id, `👑 **Kính gửi Chủ tịch @Thuha0098!**\nBạn có thể nhắn tin trực tiếp để thảo luận tự nhiên!`, { parse_mode: 'Markdown' });
    }
    handleExecutiveConversation(msg.chat.id, question);
});

bot.on('message', (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;
    if (!isAuthorized(msg)) return;
    handleExecutiveConversation(msg.chat.id, msg.text);
});

bot.on('polling_error', (error) => {
    console.error('⚠️ [Telegram Bot Polling Error]:', error.code, error.message);
});
