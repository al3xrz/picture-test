/**
 * Перемешивает копию массива алгоритмом Фишера—Йетса.
 * Исходный массив не мутируется.
 */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  // Не оставляем исходный порядок случайно неизменным, если элементов минимум два.
  if (array.length > 1 && result.every((item, index) => item === array[index])) {
    [result[0], result[1]] = [result[1], result[0]];
  }
  return result;
}

/**
 * Перемешивает порядок вопросов и вариантов ответа внутри каждого вопроса.
 * @param {Array<{options: Array}>} questions — вопросы из API
 * @returns {Array} новые объекты вопросов с перемешанными вариантами
 */
export function shuffleQuiz(questions) {
  return shuffle(questions).map((question) => ({
    ...question,
    options: shuffle(question.options),
  }));
}
