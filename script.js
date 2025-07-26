/* DOM elements */
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chatWindow");

// Create the "jump to present" arrow button
const scrollBtn = document.createElement("button");
scrollBtn.className = "scroll-btn";
scrollBtn.innerHTML = '<span class="material-icons">arrow_downward</span>';
scrollBtn.setAttribute("aria-label", "Jump to present");
scrollBtn.addEventListener("click", () => {
  // Smoothly scroll to the bottom of the chat window
  chatWindow.scrollTo({
    top: chatWindow.scrollHeight,
    behavior: "smooth",
  });
  scrollBtn.style.display = "none";
});
chatWindow.parentElement.style.position = "relative";
chatWindow.parentElement.appendChild(scrollBtn);

// Store chat history for OpenAI API
let messages = [
  {
    role: "system",
    content:
      "You are a helpful assistant for L'Oréal products and routines. You only answer questions about L'Oreal and L'Oréal products. If you are asked a question or given a prompt that does not pertain to L'Oréal, you will politely explain that how their prompt was not on topic with L'Oréal, and then let them know you can only discuss L'Oréal products and routines. When mentioning that you cannot answer an unrelated question, mention the topic of their prompt in explaining that you cannot respond to it, to show the user that you actually processed their prompt. This way the user will know the chatbot is not simply broken, but is in fact reading their prompts, and just cannot answer to an unrelated prompt.",
  },
];

// Show initial greeting (bot message, left)
chatWindow.innerHTML = `<div class="msg-row ai"><div class="msg ai">👋 Hello! How can I help you today?</div></div>`;
chatWindow.scrollTop = chatWindow.scrollHeight;

// Function to "type out" the bot's response letter by letter
function typeBotResponse(text) {
  // Create the bubble and row
  const msgRow = document.createElement("div");
  msgRow.className = "msg-row ai";
  const msgBubble = document.createElement("div");
  msgBubble.className = "msg ai";
  msgRow.appendChild(msgBubble);
  chatWindow.appendChild(msgRow);

  let i = 0;
  // Use setInterval to add one character at a time
  const typing = setInterval(() => {
    msgBubble.textContent += text[i];
    i++;
    // Always scroll to bottom while typing
    chatWindow.scrollTop = chatWindow.scrollHeight;
    if (i >= text.length) {
      clearInterval(typing);
    }
  }, 18); // 18ms per character for a smooth effect
}

// Show scroll button if user scrolls up
chatWindow.addEventListener("scroll", () => {
  // If user is not at the bottom, show button
  if (chatWindow.scrollTop + chatWindow.clientHeight < chatWindow.scrollHeight - 10) {
    scrollBtn.style.display = "flex";
  } else {
    scrollBtn.style.display = "none";
  }
});

/* Handle form submit */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get user's message from input box
  const userMsg = userInput.value;
  messages.push({ role: "user", content: userMsg });

  // Show user's message in chat window (right side, blue bubble)
  chatWindow.innerHTML += `<div class="msg-row user"><div class="msg user">${userMsg}</div></div>`;
  userInput.value = "";

  // Scroll to bottom after user message
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Show loading message (bot side, left)
  chatWindow.innerHTML += `<div class="msg-row ai"><div class="msg ai">Thinking...</div></div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Keep only the system prompt and last 10 messages
  const systemPrompt = messages[0];
  const recentMessages = messages.slice(-10);
  const messagesToSend = [systemPrompt, ...recentMessages];

  // Send messagesToSend instead of messages
  try {
    const response = await fetch("https://twilight-cell-bfb8.shalevancleve.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: messagesToSend }),
    });
    const data = await response.json();

    // Remove the "Thinking..." bubble before showing the AI's reply
    chatWindow.removeChild(chatWindow.lastChild);

    // Get AI's reply from response
    const aiMsg = data.choices[0].message.content;

    // Show AI's reply in chat window, typing out letter by letter
    typeBotResponse(aiMsg);
    messages.push({ role: "assistant", content: aiMsg });
  } catch (error) {
    chatWindow.removeChild(chatWindow.lastChild);

    chatWindow.innerHTML += `<div class="msg-row ai"><div class="msg ai">Sorry, there was an error. Please try again.</div></div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
