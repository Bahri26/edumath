/**
 * Çoklu soru (ortak kök) — assessmentMeta.groupId ile bağlanan sorular.
 */

function clean(value) {
  return String(value || '').trim();
}

export function getQuestionGroupMeta(question = {}) {
  const meta = question?.assessmentMeta || {};
  const groupId = clean(meta.groupId);
  if (!groupId) return null;
  const groupIndex = Number(meta.groupIndex) || 0;
  const groupSize = Number(meta.groupSize) || 0;
  return {
    groupId,
    groupIndex,
    groupSize,
    sharedStem: clean(meta.sharedStem || meta.parseLayout?.introText),
    sharedImage: clean(meta.sharedImage),
    sharedPrompt: clean(meta.sharedPrompt),
  };
}

export function findGroupMembers(questions = [], groupId) {
  const id = clean(groupId);
  if (!id) return [];
  return (Array.isArray(questions) ? questions : [])
    .filter((q) => clean(q?.assessmentMeta?.groupId) === id)
    .sort((a, b) => (Number(a?.assessmentMeta?.groupIndex) || 0) - (Number(b?.assessmentMeta?.groupIndex) || 0));
}

/**
 * Ortak kök + madde sorusunu QuestionStemCard’ın anlayacağı forma getirir.
 */
export function resolveGroupedDisplayQuestion(question, allQuestions = []) {
  if (!question) return question;
  const group = getQuestionGroupMeta(question);
  if (!group) return question;

  const members = findGroupMembers(allQuestions, group.groupId);
  const anchor = members[0] || question;
  const sharedImage =
    group.sharedImage
    || clean(question.image)
    || clean(anchor.image);
  const sharedStem =
    group.sharedStem
    || clean(anchor?.assessmentMeta?.sharedStem)
    || clean(anchor?.assessmentMeta?.parseLayout?.introText);

  const parseLayout = { ...(question.assessmentMeta?.parseLayout || {}) };
  if (sharedStem && !clean(parseLayout.introText)) {
    parseLayout.introText = sharedStem;
  }
  if (!clean(parseLayout.questionLine) && !clean(parseLayout.questionText)) {
    const full = clean(question.text);
    if (sharedStem && full.startsWith(sharedStem)) {
      parseLayout.questionLine = clean(full.slice(sharedStem.length));
    } else if (full.includes('\n\n')) {
      const parts = full.split(/\n\n+/).map(clean).filter(Boolean);
      parseLayout.questionLine = parts[parts.length - 1] || full;
      if (!parseLayout.introText && parts.length >= 2) {
        parseLayout.introText = parts.slice(0, -1).join('\n\n');
      }
    } else {
      parseLayout.questionLine = full;
    }
  }

  const groupSize = group.groupSize || members.length || 0;
  const groupIndex = group.groupIndex || (members.findIndex((m) => String(m._id) === String(question._id)) + 1);

  return {
    ...question,
    image: sharedImage || question.image,
    assessmentMeta: {
      ...(question.assessmentMeta || {}),
      groupId: group.groupId,
      groupIndex,
      groupSize,
      sharedStem: sharedStem || group.sharedStem,
      sharedImage: sharedImage || group.sharedImage,
      sharedPrompt: group.sharedPrompt,
      parseLayout,
    },
  };
}

export function formatGroupProgressLabel(question) {
  const group = getQuestionGroupMeta(question);
  if (!group?.groupId) return '';
  const size = group.groupSize || 0;
  const index = group.groupIndex || 0;
  if (index && size) return `Çoklu soru · ${index}/${size}`;
  if (index) return `Çoklu soru · ${index}`;
  return 'Çoklu soru';
}

/** Mevcut sorunun grubundaki tüm üyeler (yoksa [question]). */
export function getGroupedWorksheetMembers(question, allQuestions = []) {
  if (!question) return [];
  const group = getQuestionGroupMeta(question);
  if (!group?.groupId) return [question];
  const members = findGroupMembers(allQuestions, group.groupId);
  return members.length ? members : [question];
}

/**
 * Grup çalışma sayfasında gezinme: önceki/sonraki "sayfa" indeksini bulur.
 * Aynı gruptaki maddeler tek sayfa sayılır.
 */
export function findAdjacentWorksheetIndex(questions = [], currentIndex, direction) {
  const list = Array.isArray(questions) ? questions : [];
  if (!list.length) return currentIndex;
  const cur = list[currentIndex];
  const curGroup = getQuestionGroupMeta(cur)?.groupId || '';
  const step = direction < 0 ? -1 : 1;
  let i = currentIndex + step;
  while (i >= 0 && i < list.length) {
    const g = getQuestionGroupMeta(list[i])?.groupId || '';
    if (!curGroup || g !== curGroup) {
      // Gruba girerken ilk üyeye hizala
      const landGroup = g;
      if (landGroup) {
        const first = list.findIndex((q) => clean(q?.assessmentMeta?.groupId) === landGroup);
        return first >= 0 ? first : i;
      }
      return i;
    }
    i += step;
  }
  return currentIndex;
}

