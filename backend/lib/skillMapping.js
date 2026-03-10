function normalizeSkillKey(value) {
  return String(value || 'genel-matematik')
    .trim()
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-z0-9çğıöşü]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'genel-matematik';
}

function makeSkill(skillKey, displayName, weight = 1) {
  return { skill_key: skillKey, display_name: displayName, weight };
}

function inferSkillMappings(question = {}) {
  const topic = String(question.topic || '').toLocaleLowerCase('tr-TR');
  const text = String(question.content_text || '').toLocaleLowerCase('tr-TR');
  const skills = [];

  if (/örüntü|oruntu|pattern/.test(topic + ' ' + text)) {
    if (/kural|ilişki|kaç fazlası|kaç katı|genel terim/.test(text)) {
      skills.push(makeSkill('pattern.rule-inference', 'Örüntü Kuralını Bulma', 1.5));
    }
    if (/yerine|sonraki|devamı|\?/.test(text)) {
      skills.push(makeSkill('pattern.missing-term', 'Eksik Terimi Bulma', 1.4));
    }
    if (/bulunmaz|uymaz|olamaz|değildir|değil/.test(text)) {
      skills.push(makeSkill('pattern.non-member', 'Örüntüye Uymayanı Bulma', 1.6));
    }
    if (/şekil|kare|üçgen|daire/.test(text)) {
      skills.push(makeSkill('pattern.shape-sequence', 'Şekil Örüntüsü', 1.3));
    }
    if (/sayı|rakam|dizi/.test(text)) {
      skills.push(makeSkill('pattern.number-sequence', 'Sayı Örüntüsü', 1.2));
    }
  }

  if (/denklem|cebir|algebra|x\s|y\s/.test(topic + ' ' + text)) {
    if (/çöz|eşittir|denklem/.test(text)) skills.push(makeSkill('algebra.solve-equation', 'Denklem Çözme', 1.4));
    if (/ifade|özdeşlik|sadeleştir/.test(text)) skills.push(makeSkill('algebra.expression', 'Cebirsel İfade', 1.2));
  }

  if (/geometri|geometry/.test(topic + ' ' + text)) {
    if (/alan/.test(text)) skills.push(makeSkill('geometry.area', 'Alan Hesabı', 1.4));
    if (/çevre/.test(text)) skills.push(makeSkill('geometry.perimeter', 'Çevre Hesabı', 1.4));
    if (/açı/.test(text)) skills.push(makeSkill('geometry.angles', 'Açılar', 1.3));
    if (/üçgen/.test(text)) skills.push(makeSkill('geometry.triangle', 'Üçgen Bilgisi', 1.2));
  }

  if (/kesir|fraction/.test(topic + ' ' + text)) {
    skills.push(makeSkill('fractions.core', 'Kesirler', 1.2));
    if (/topla|çıkar|ekle|fark/.test(text)) skills.push(makeSkill('fractions.operations', 'Kesir İşlemleri', 1.4));
  }

  if (/oran|orantı/.test(topic + ' ' + text)) {
    skills.push(makeSkill('ratio.proportion', 'Oran ve Orantı', 1.4));
  }

  if (!skills.length) {
    const normalizedTopic = normalizeSkillKey(question.topic || 'genel-matematik');
    skills.push(makeSkill(`topic.${normalizedTopic}`, question.topic || 'Genel Matematik', 1));
  }

  const unique = new Map();
  skills.forEach((skill) => {
    const current = unique.get(skill.skill_key);
    if (!current || current.weight < skill.weight) unique.set(skill.skill_key, skill);
  });
  return [...unique.values()].sort((a, b) => Number(b.weight || 0) - Number(a.weight || 0));
}

function pickPrimarySkill(skills = [], fallbackTopic = 'Genel Matematik') {
  if (Array.isArray(skills) && skills.length) return skills[0];
  return makeSkill(`topic.${normalizeSkillKey(fallbackTopic)}`, fallbackTopic, 1);
}

module.exports = {
  normalizeSkillKey,
  inferSkillMappings,
  pickPrimarySkill
};