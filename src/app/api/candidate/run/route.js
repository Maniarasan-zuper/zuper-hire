import { NextResponse } from 'next/server';
import vm from 'vm';
import db from '@/lib/db';

export async function POST(request) {
    const { code, questionId } = await request.json();

    if (!code || !questionId) {
        return NextResponse.json({ error: 'Code and Question ID are required' }, { status: 400 });
    }

    const question = db.prepare('SELECT test_cases FROM questions WHERE id = ?').get(questionId);
    if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 });
    }

    const testCases = JSON.parse(question.test_cases || '[]');
    const results = [];
    let allPassed = true;

    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];

        try {
            // Strict sandbox — no access to process, require, global, Buffer, etc.
            const sandbox = {
                console: { log: () => {}, error: () => {}, warn: () => {} },
                Math,
                JSON,
                parseInt,
                parseFloat,
                isNaN,
                isFinite,
                Number,
                String,
                Boolean,
                Array,
                Object,
                Date,
                RegExp,
                Map,
                Set,
                Symbol,
                Error,
                TypeError,
                RangeError,
                encodeURIComponent,
                decodeURIComponent,
                undefined,
                NaN,
                Infinity,
            };
            vm.createContext(sandbox);

            const inputStr = tc.input;

            const runnerCode = `
(function() {
  'use strict';
  ${code}

  if (typeof solution !== 'function') {
    throw new Error('Please define the "solution(input)" function.');
  }

  return solution(${inputStr});
})();
`;

            const result = vm.runInContext(runnerCode, sandbox, {
                timeout: 3000,
                displayErrors: false,
                breakOnSigint: false,
            });

            const passed = JSON.stringify(result) === tc.expectedOutput.trim();
            results.push({
                passed,
                expected: tc.expectedOutput,
                actual: result === undefined ? 'undefined' : JSON.stringify(result)
            });

            if (!passed) allPassed = false;

        } catch (error) {
            allPassed = false;
            let msg = error.message || 'Runtime error';
            // Sanitize error — don't leak internals
            if (msg.includes('Script execution timed out')) msg = 'Time limit exceeded (3s)';
            results.push({
                passed: false,
                expected: tc.expectedOutput,
                actual: `Error: ${msg}`
            });
        }
    }

    const passingCount = results.filter(r => r.passed).length;
    const totalCount = results.length;

    return NextResponse.json({
        results,
        allPassed,
        passingCount,
        totalCount
    });
}
