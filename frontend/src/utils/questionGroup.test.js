import { describe, expect, it } from 'vitest';
import {
  formatGroupProgressLabel,
  findAdjacentWorksheetIndex,
  getGroupedWorksheetMembers,
  getQuestionGroupMeta,
  resolveGroupedDisplayQuestion,
} from './questionGroup.js';

const sharedStem =
  'Kenar uzunluğu 5 cm olan karelerle oluşturulmuş bir şekil örüntüsünün ilk üç adımı görselde verilmiştir.';

describe('questionGroup', () => {
  it('reads group meta', () => {
    const meta = getQuestionGroupMeta({
      assessmentMeta: { groupId: 'g1', groupIndex: 2, groupSize: 3, sharedStem },
    });
    expect(meta.groupId).toBe('g1');
    expect(meta.groupIndex).toBe(2);
    expect(meta.groupSize).toBe(3);
  });

  it('merges shared image from first group member', () => {
    const q1 = {
      _id: 'a',
      text: `${sharedStem}\n\nSoru 1?`,
      image: '/uploads/patterns/l-square-pattern.svg',
      assessmentMeta: {
        groupId: 'l-pattern',
        groupIndex: 1,
        groupSize: 3,
        sharedStem,
        sharedImage: '/uploads/patterns/l-square-pattern.svg',
        parseLayout: { introText: sharedStem, questionLine: 'Soru 1?' },
      },
    };
    const q2 = {
      _id: 'b',
      text: 'Soru 2?',
      image: '',
      assessmentMeta: {
        groupId: 'l-pattern',
        groupIndex: 2,
        groupSize: 3,
        sharedStem,
        parseLayout: { questionLine: 'Soru 2?' },
      },
    };
    const display = resolveGroupedDisplayQuestion(q2, [q1, q2]);
    expect(display.image).toBe('/uploads/patterns/l-square-pattern.svg');
    expect(display.assessmentMeta.parseLayout.introText).toBe(sharedStem);
    expect(display.assessmentMeta.parseLayout.questionLine).toBe('Soru 2?');
  });

  it('uses sharedImage meta when sibling is not on the same page', () => {
    const q2Alone = {
      _id: 'b',
      text: 'Soru 2?',
      image: '',
      assessmentMeta: {
        groupId: 'l-pattern',
        groupIndex: 2,
        groupSize: 3,
        sharedStem,
        sharedImage: '/uploads/patterns/l-square-pattern.svg',
        parseLayout: { questionLine: 'Soru 2?' },
      },
    };
    const display = resolveGroupedDisplayQuestion(q2Alone, [q2Alone]);
    expect(display.image).toBe('/uploads/patterns/l-square-pattern.svg');
    expect(formatGroupProgressLabel(display)).toBe('Çoklu soru · 2/3');
  });

  it('formats progress label', () => {
    expect(
      formatGroupProgressLabel({
        assessmentMeta: { groupId: 'x', groupIndex: 3, groupSize: 3 },
      }),
    ).toBe('Çoklu soru · 3/3');
  });

  it('finds adjacent worksheet index skipping same group', () => {
    const list = [
      { _id: '1', assessmentMeta: { groupId: 'g', groupIndex: 1, groupSize: 3 } },
      { _id: '2', assessmentMeta: { groupId: 'g', groupIndex: 2, groupSize: 3 } },
      { _id: '3', assessmentMeta: { groupId: 'g', groupIndex: 3, groupSize: 3 } },
      { _id: '4', assessmentMeta: {} },
    ];
    expect(findAdjacentWorksheetIndex(list, 0, 1)).toBe(3);
    expect(findAdjacentWorksheetIndex(list, 3, -1)).toBe(0);
    expect(getGroupedWorksheetMembers(list[1], list)).toHaveLength(3);
  });
});
