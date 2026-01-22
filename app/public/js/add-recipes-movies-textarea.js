document.addEventListener("DOMContentLoaded", () => {
  const textareas = document.querySelectorAll(
    ".recipe-textarea, .recipe-context-textarea"
  );

  if (!textareas.length) return;

  const adjustHeight = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  textareas.forEach((textarea) => {
    if (textarea.classList.contains("recipe-context-textarea")) {
      textarea.setAttribute("maxlength", "500");
    }

    adjustHeight(textarea);
    textarea.addEventListener("input", () => adjustHeight(textarea));
  });
});
