document.addEventListener("DOMContentLoaded", () => {
  const textareas = document.querySelectorAll(
    ".add-recipe-textarea"
  );

  if (!textareas.length) return;

  const adjustHeight = (textarea) => {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  textareas.forEach((textarea) => {
    adjustHeight(textarea);
    textarea.addEventListener("input", () => adjustHeight(textarea));
  });
});
