module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/app/api/score/route.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$score$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/score.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const { transcript, duration } = await request.json();
        const result = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$score$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["scoreFreeform"])(String(transcript || ''), Number(duration) || 0);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(result);
    } catch (e) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Provide a valid transcript and duration.'
        }, {
            status: 400
        });
    }
}
}),
"[project]/src/lib/score.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "scoreFreeform",
    ()=>scoreFreeform
]);
function scoreFreeform(transcript, duration = 0) {
    const words = transcript.trim().split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    if (wordCount === 0) {
        return {
            overall: 0,
            pronunciation: 0,
            correctness: 0,
            fluency: 0,
            transcript,
            feedback: [],
            alternative: ''
        };
    }
    const avgWordLength = words.reduce((sum, word)=>sum + word.length, 0) / wordCount;
    const sentences = transcript.split('.').filter((s)=>s.trim());
    let correctness = Math.min(100, 60 + wordCount * 3 + Math.floor(avgWordLength * 3));
    let fluency = 60;
    if (duration > 0) {
        const wpm = wordCount / Math.max(duration, 1) * 60;
        fluency = Math.max(40, Math.min(100, 100 - Math.abs(wpm - 120) / 2));
    } else {
        fluency = Math.min(100, 60 + wordCount * 2);
    }
    const pronunciation = Math.min(100, 70 + Math.floor(avgWordLength * 2));
    const overall = Math.round(pronunciation * 0.35 + correctness * 0.35 + fluency * 0.3);
    const feedback = [
        {
            type: 'strength',
            label: 'Great speaking!',
            detail: `You used ${wordCount} words. Keep it up!`
        }
    ];
    if (sentences.length) {
        feedback.push({
            type: 'tip',
            label: 'Sentences',
            detail: `You made ${sentences.length} sentence(s). Try to use full sentences to improve clarity.`
        });
    }
    if (duration > 0 && wordCount / Math.max(duration, 1) < 1) {
        feedback.push({
            type: 'tip',
            label: 'Pace',
            detail: 'Try speaking a little more. Longer answers help practice fluency.'
        });
    }
    return {
        overall,
        pronunciation,
        correctness,
        fluency,
        transcript,
        feedback,
        alternative: ''
    };
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__11vgjgj._.js.map