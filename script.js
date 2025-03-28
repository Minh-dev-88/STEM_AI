// Hàm lưu câu hỏi vào localStorage
function saveQuestion(question) {
    let questions = JSON.parse(localStorage.getItem('questions')) || [];
    questions.push(question);
    localStorage.setItem('questions', JSON.stringify(questions));
}

// Hàm lấy tất cả câu hỏi từ localStorage
function getQuestions() {
    return JSON.parse(localStorage.getItem('questions')) || [];
}

// Hàm tạo câu hỏi gợi ý dựa trên các câu hỏi đã lưu
async function generateSuggestions() {
    const suggestionArea = document.getElementById("suggestionArea");
    const questions = getQuestions();

    if (questions.length === 0) {
        suggestionArea.innerHTML = `<p class="text-gray-600">Chưa có câu hỏi nào để tạo gợi ý.</p>`;
        return;
    }

    // Tạo prompt để yêu cầu AI tạo câu hỏi gợi ý liên quan
    const prompt = `Dựa trên các câu hỏi sau: "${questions.join('", "')}", hãy tạo một danh sách các câu hỏi gợi ý liên quan để người dùng tiếp tục tìm hiểu. Trả lời bằng tiếng Việt, sử dụng cách diễn đạt tự nhiên, đúng ngữ pháp tiếng Việt. Sử dụng ký hiệu "-" để liệt kê các câu hỏi gợi ý. Ví dụ: nếu câu hỏi là "H2O là gì?", gợi ý có thể là "- Phân tử khối của H2O là bao nhiêu?".`;

    try {
        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCyOlwZ-ePaYFifDsHNOQbYxe2Z6Ipa7M0", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: prompt }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi từ API: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.candidates || data.candidates.length === 0) {
            throw new Error("Không nhận được câu trả lời từ API. Kiểm tra API Key hoặc model.");
        }

        let suggestions = data.candidates[0].content.parts[0].text;

        // Xử lý định dạng HTML cho nội dung gợi ý
        suggestions = suggestions.replace(/\n/g, '<br>');
        suggestions = suggestions.replace(/^\s*-\s*/gm, '<li>');
        if (suggestions.includes('<li>')) {
            suggestions = `<ol class="list-decimal pl-5">${suggestions}</ol>`; // Sử dụng <ol> để hiển thị số thứ tự
        }

        // Hiển thị nội dung gợi ý
        suggestionArea.innerHTML = suggestions;
    } catch (error) {
        suggestionArea.innerHTML = `<p class="text-red-500">Có lỗi khi tạo gợi ý: ${error.message}</p>`;
    }
}

// Hàm xử lý câu hỏi và câu trả lời
async function getAnswer() {
    const questionInput = document.getElementById("question");
    const chatArea = document.getElementById("chatArea");
    const question = questionInput.value.trim();

    if (!question) {
        chatArea.innerHTML += `<div class="text-red-500 p-2">Vui lòng nhập câu hỏi!</div>`;
        chatArea.scrollTop = chatArea.scrollHeight;
        return;
    }

    // Hiển thị câu hỏi của người dùng
    chatArea.innerHTML += `<div class="flex justify-end mb-2">
        <div class="bg-blue-500 text-white p-2 rounded-lg max-w-xs">Bạn: ${question}</div>
    </div>`;
    chatArea.scrollTop = chatArea.scrollHeight;

    // Lưu câu hỏi vào localStorage
    saveQuestion(question);

    // Xóa ô nhập
    questionInput.value = "";

    // Hiển thị trạng thái "Đang xử lý..."
    chatArea.innerHTML += `<div class="text-gray-500 p-2">Đang xử lý...</div>`;
    chatArea.scrollTop = chatArea.scrollHeight;

    try {
        // Thêm yêu cầu định dạng câu trả lời
        const formattedQuestion = `${question}\nHãy trả lời bằng tiếng Việt, sử dụng cách diễn đạt tự nhiên, đúng ngữ pháp tiếng Việt. Sử dụng các ký hiệu như "-", "+" và "\"" khi cần thiết để làm rõ ý (ví dụ: dùng "-" cho danh sách, "+" cho điểm tích cực, "\"" cho trích dẫn). Không sử dụng "*" để nhấn mạnh. Đảm bảo câu trả lời dễ đọc, chia thành các ý rõ ràng.`;

        const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyCyOlwZ-ePaYFifDsHNOQbYxe2Z6Ipa7M0", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: formattedQuestion }
                        ]
                    }
                ],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Lỗi từ API: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();

        if (!data || !data.candidates || data.candidates.length === 0) {
            throw new Error("Không nhận được câu trả lời từ API. Kiểm tra API Key hoặc model.");
        }

        let answer = data.candidates[0].content.parts[0].text;

        // Xử lý định dạng HTML cho câu trả lời
        answer = answer.replace(/\n/g, '<br>');
        answer = answer.replace(/^\s*-\s*/gm, '<li>');
        answer = answer.replace(/^\s*\+\s*/gm, '<li class="text-green-600">+ ');
        if (answer.includes('<li>')) {
            answer = `<ul class="list-disc pl-5">${answer}</ul>`;
        }

        // Xóa trạng thái "Đang xử lý..."
        chatArea.removeChild(chatArea.lastChild);

        // Hiển thị câu trả lời của AI
        chatArea.innerHTML += `<div class="flex justify-start mb-2">
            <div class="bg-gray-300 text-black p-2 rounded-lg max-w-xs">${answer}</div>
        </div>`;
        chatArea.scrollTop = chatArea.scrollHeight;

        // Tạo câu hỏi gợi ý sau khi nhận được câu trả lời
        await generateSuggestions();
    } catch (error) {
        // Xóa trạng thái "Đang xử lý..."
        chatArea.removeChild(chatArea.lastChild);

        chatArea.innerHTML += `<div class="text-red-500 p-2">Có lỗi xảy ra: ${error.message}</div>`;
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// Tạo câu hỏi gợi ý khi trang được tải
document.addEventListener('DOMContentLoaded', generateSuggestions);