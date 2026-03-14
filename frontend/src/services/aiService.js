import api from './api';

function requestLearning(topic, mode, extraParams = {}) {
    return api.get('/ai-content/learning', {
        params: {
            topic,
            mode,
            ...extraParams
        }
    }).then((response) => response.data);
}

export function getAiContent(topic) {
    return api.get('/ai-content/ai-content', {
        params: { topic }
    }).then((response) => response.data);
}

export function getLearningExplanation(topic, extraParams) {
    return requestLearning(topic, 'explanation', extraParams);
}

export function getFlashcards(topic, extraParams) {
    return requestLearning(topic, 'flashcards', extraParams);
}

export function getFillBlank(topic, extraParams) {
    return requestLearning(topic, 'fillblank', extraParams);
}

export function getMatching(topic, extraParams) {
    return requestLearning(topic, 'matching', extraParams);
}

export function getMiniQuiz(topic, extraParams) {
    return requestLearning(topic, 'miniquiz', extraParams);
}

export default {
    getAiContent,
    getLearningExplanation,
    getFlashcards,
    getFillBlank,
    getMatching,
    getMiniQuiz
};
