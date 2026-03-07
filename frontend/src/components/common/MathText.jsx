import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

const SHAPE_PLACEHOLDER_MAP = {
    DAIRE: '🔵',
    CEMBER: '⭕',
    KARE: '🟦',
    UCGEN: '🔺',
    YILDIZ: '⭐',
    PENTAGON: '⬟',
    BESGEN: '⬟',
    ALTIGEN: '⬢',
    HEXAGON: '⬢',
    DIKDORTGEN: '▭'
};

const LEGACY_GLYPH_TO_EMOJI = {
    '●': '🔵',
    '○': '⭕',
    '■': '🟦',
    '▲': '🔺',
    '★': '⭐'
};

const normalizeShapePlaceholders = (value) => {
    const input = String(value || '');
    const withPlaceholders = input.replace(/\[\s*([A-ZCIGOSU\u00C7\u011E\u0130\u00D6\u015E\u00DC]+)\s*\]/gi, (_full, rawToken) => {
        const normalized = String(rawToken)
            .toLocaleUpperCase('tr-TR')
            .replace(/\u00C7/g, 'C')
            .replace(/\u011E/g, 'G')
            .replace(/\u0130/g, 'I')
            .replace(/\u00D6/g, 'O')
            .replace(/\u015E/g, 'S')
            .replace(/\u00DC/g, 'U');

        return SHAPE_PLACEHOLDER_MAP[normalized] || `[${normalized}]`;
    });

    return withPlaceholders.replace(/[●○■▲★]/g, (glyph) => LEGACY_GLYPH_TO_EMOJI[glyph] || glyph);
};

const MathText = ({ text, block = false }) => {
    if (!text) return null;

    const displayText = normalizeShapePlaceholders(text);

    // LaTeX formüllerini tespit et ($ veya $$ arasındaki ifadeler)
    const parts = [];
    let lastIndex = 0;
    
    // Block math için $$ ... $$ deseni
    const blockPattern = /\$\$(.*?)\$\$/gs;
    // Inline math için $ ... $ deseni
    const inlinePattern = /\$(.*?)\$/g;

    let processedText = displayText;
    let match;

    // Önce block math'i işle
    while ((match = blockPattern.exec(displayText)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: displayText.slice(lastIndex, match.index) });
        }
        parts.push({ type: 'block', content: match[1] });
        lastIndex = match.index + match[0].length;
    }

    // Kalan metni al
    if (lastIndex < displayText.length) {
        processedText = displayText.slice(lastIndex);
    } else {
        processedText = '';
    }

    // Şimdi inline math'i işle (kalan metinde)
    if (processedText) {
        lastIndex = 0;
        while ((match = inlinePattern.exec(processedText)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: processedText.slice(lastIndex, match.index) });
            }
            parts.push({ type: 'inline', content: match[1] });
            lastIndex = match.index + match[0].length;
        }

        if (lastIndex < processedText.length) {
            parts.push({ type: 'text', content: processedText.slice(lastIndex) });
        }
    }

    // Hiç math bulunamadıysa düz metin döndür
    if (parts.length === 0) {
        return <span className="math-content text-gray-800">{displayText}</span>;
    }

    return (
        <span className="math-content text-gray-800">
            {parts.map((part, index) => {
                if (part.type === 'block') {
                    return <BlockMath key={index} math={part.content} />;
                } else if (part.type === 'inline') {
                    return <InlineMath key={index} math={part.content} />;
                } else {
                    return <span key={index}>{part.content}</span>;
                }
            })}
        </span>
    );
};

export default MathText;
