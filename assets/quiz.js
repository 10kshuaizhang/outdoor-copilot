/**
 * Minimal quiz widget for teaching lessons.
 * Usage:
 *   <div class="quiz" data-quiz data-answer="1" data-ok="..." data-bad="...">
 *     <h3>练习</h3>
 *     <p class="prompt">...</p>
 *     <div class="choices">
 *       <button type="button" class="choice" data-choice="0">...</button>
 *       ...
 *     </div>
 *     <p class="feedback" data-feedback aria-live="polite"></p>
 *   </div>
 *   <script type="module" src="../assets/quiz.js"></script>
 */
function initQuiz(root) {
  const answer = root.dataset.answer;
  const ok = root.dataset.ok || "正确。";
  const bad = root.dataset.bad || "再想一次。";
  const feedback = root.querySelector("[data-feedback]");
  const buttons = [...root.querySelectorAll("[data-choice]")];

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const chosen = btn.dataset.choice;
      const correct = chosen === answer;
      buttons.forEach((b) => {
        b.disabled = true;
        if (b.dataset.choice === answer) b.classList.add("correct");
      });
      if (!correct) btn.classList.add("wrong");
      if (feedback) {
        feedback.textContent = correct ? ok : bad;
        feedback.className = `feedback ${correct ? "ok" : "bad"}`;
      }
    });
  });
}

document.querySelectorAll("[data-quiz]").forEach(initQuiz);
