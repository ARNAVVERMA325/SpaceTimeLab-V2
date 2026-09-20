/**
 * @license
 * Spacetime Lab — AnyaLabs
 * Validation Lab Modal (CLAUDE.md §16 & §20)
 * Executes live automated numerical relativity benchmarks on the real simulation engine,
 * reporting tolerances, numerical residuals, and authoritative academic citations.
 */

import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, AlertTriangle, Play, ShieldCheck, BookOpen, Clock } from 'lucide-react';
import { ValidationSuite } from '../../physics/validation/suite';
import { ValidationTestResult } from '../../physics/types';

interface ValidationLabModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ValidationLabModal: React.FC<ValidationLabModalProps> = ({ isOpen, onClose }) => {
  const [results, setResults] = useState<ValidationTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<number | null>(null);

  const runTests = () => {
    setIsRunning(true);
    const start = performance.now();
    setTimeout(() => {
      const suiteResults = ValidationSuite.runAllTests();
      setResults(suiteResults);
      setIsRunning(false);
      setLastRunTime(Math.round(performance.now() - start));
    }, 50);
  };

  useEffect(() => {
    if (isOpen && results.length === 0) {
      runTests();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const passedCount = results.filter((r) => r.passed).length;
  const allPassed = results.length > 0 && passedCount === results.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${allPassed ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                Numerical Physics Validation Registry
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                  CLAUDE.md §16
                </span>
              </h2>
              <p className="text-xs text-neutral-400">
                Automated live benchmarks verifying mathematical conservation laws, known limits, and integrators.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-medium flex items-center gap-1.5 border border-neutral-700 transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
              {isRunning ? 'Benchmarking...' : 'Re-run Suite'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Status Summary Banner */}
        <div className="px-6 py-3 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="text-neutral-400">Status:</span>
            <span className={allPassed ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
              {allPassed ? `ALL ${results.length} BENCHMARKS PASSED` : `${passedCount}/${results.length} PASSED`}
            </span>
          </div>
          {lastRunTime !== null && (
            <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
              <Clock className="w-3.5 h-3.5" />
              Completed in {lastRunTime} ms
            </div>
          )}
        </div>

        {/* Tests List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {results.map((test) => (
            <div
              key={test.id}
              className={`p-4 rounded-lg border text-xs font-mono transition-colors ${
                test.passed
                  ? 'bg-neutral-950/70 border-neutral-800 hover:border-neutral-700'
                  : 'bg-red-950/20 border-red-900/60'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded text-[11px]">
                    {test.id}
                  </span>
                  <span className="font-medium text-neutral-200 text-sm">{test.name}</span>
                  <span className="text-[10px] text-neutral-500 uppercase px-1.5 py-0.5 rounded border border-neutral-800">
                    {test.category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {test.passed ? (
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px] bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASSED
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400 font-semibold text-[11px] bg-red-950/60 border border-red-800 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      FAILED
                    </span>
                  )}
                </div>
              </div>

              <p className="text-neutral-400 font-sans text-xs mb-3">{test.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-neutral-900/70 p-2.5 rounded border border-neutral-800/80 text-[11px]">
                <div>
                  <span className="text-neutral-500 block">Expected:</span>
                  <span className="text-neutral-300">{test.expected}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Measured Residual:</span>
                  <span className={test.passed ? 'text-emerald-400' : 'text-red-400'}>{test.measured}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">Validated Tolerance:</span>
                  <span className="text-neutral-300">≤ {test.tolerance.toExponential(1)}</span>
                </div>
              </div>

              {test.citation && (
                <div className="mt-2 text-[10px] text-neutral-500 flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3 text-neutral-600" />
                  Citation: <span className="text-neutral-400 italic">{test.citation}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-neutral-950/80 text-[11px] text-neutral-400 flex items-center justify-between font-mono">
          <span>AnyaLabs Spacetime Lab • Physical Model → Numerical Computation → Validated Result</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-sans transition-colors"
          >
            Close Registry
          </button>
        </div>
      </div>
    </div>
  );
};
