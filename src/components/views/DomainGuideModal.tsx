import React, { useState } from 'react';
import { Globe, Copy, Check, X, ShieldCheck, Server, GitBranch, ExternalLink, Terminal } from 'lucide-react';

interface DomainGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DomainGuideModal: React.FC<DomainGuideModalProps> = ({ isOpen, onClose }) => {
  const [subdomain, setSubdomain] = useState('spacetime');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'github' | 'bigrock' | 'cloudflare'>('github');

  if (!isOpen) return null;

  const fullDomain = `${subdomain || 'spacetime'}.anyalabs.in`;
  const hostValue = window.location.hostname;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="bg-[#090f1a] border border-[#1d2d47] rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-200 overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#152238] flex items-center justify-between bg-[#0a1220]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <GitBranch className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                GitHub & Domain Connection Guide
              </h2>
              <p className="text-[11px] text-slate-400 font-sans">
                Connecting GitHub repo to <span className="text-sky-300 font-mono font-semibold">{fullDomain}</span> (BigRock)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#121e33] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Subdomain Input */}
          <div className="bg-[#05080f] p-3 rounded-xl border border-[#142033] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Your desired subdomain:</label>
              <div className="flex items-center gap-1.5 font-mono">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="spacetime"
                  className="bg-[#0c1422] border border-[#1a2c47] rounded-lg px-2.5 py-1 text-xs text-sky-200 font-mono outline-none focus:border-sky-500 w-32"
                />
                <span className="text-slate-300 font-semibold">.anyalabs.in</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Target Production URL:</span>
              <span className="text-emerald-400 font-semibold font-mono text-xs">
                https://{fullDomain}
              </span>
            </div>
          </div>

          {/* Navigation Tabs for Setup Methods */}
          <div className="flex items-center gap-1 bg-[#05080f] p-1 rounded-xl border border-[#16253c] text-xs">
            <button
              onClick={() => setActiveTab('github')}
              className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${
                activeTab === 'github'
                  ? 'bg-[#102d55] text-sky-200 border border-sky-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step 1: Connect GitHub Repo
            </button>
            <button
              onClick={() => setActiveTab('bigrock')}
              className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${
                activeTab === 'bigrock'
                  ? 'bg-[#102d55] text-sky-200 border border-sky-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Step 2: BigRock CNAME
            </button>
            <button
              onClick={() => setActiveTab('cloudflare')}
              className={`flex-1 py-1.5 rounded-lg text-center font-medium transition-all ${
                activeTab === 'cloudflare'
                  ? 'bg-[#102d55] text-sky-200 border border-sky-500/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Option 3: Cloudflare (Free SSL)
            </button>
          </div>

          {/* TAB 1: How to Connect GitHub Repo */}
          {activeTab === 'github' && (
            <div className="space-y-3 font-sans">
              <div className="bg-[#0b1220] border border-[#16253c] p-3.5 rounded-xl space-y-3 text-[11px]">
                <div className="flex items-center justify-between font-mono font-semibold text-sky-300">
                  <span className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-sky-400" />
                    <span>How to connect this codebase to a GitHub Repo:</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 border border-sky-800 text-sky-300">
                    Git Workflow
                  </span>
                </div>

                <div className="text-slate-300 space-y-2 leading-relaxed">
                  <p>
                    <strong>Option A (Direct Push):</strong> In your downloaded or local repository, push to your GitHub account:
                  </p>
                  <div className="bg-[#05080f] p-2.5 rounded-lg border border-[#142033] font-mono text-[10px] space-y-1 text-slate-300">
                    <div className="text-slate-500"># 1. Initialize and add all files</div>
                    <div>git init</div>
                    <div>git add .</div>
                    <div>git commit -m &quot;feat: initial commit of Spacetime Lab v2&quot;</div>
                    <div className="text-slate-500 mt-1"># 2. Add your GitHub remote and push</div>
                    <div>git remote add origin https://github.com/&lt;your-username&gt;/spacetime-lab.git</div>
                    <div>git branch -M main</div>
                    <div>git push -u origin main</div>
                  </div>

                  <p className="pt-1">
                    <strong>Option B (Auto-deploy to Vercel or Cloudflare Pages):</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
                    <li>Go to <strong className="text-white">Vercel.com</strong> or <strong className="text-white">Cloudflare Pages</strong>.</li>
                    <li>Click <strong>&quot;Add New Project&quot;</strong> and import your GitHub repository.</li>
                    <li>Framework preset: <strong>Vite</strong> (Build command: <code className="text-sky-300 font-mono">npm run build</code>, Output directory: <code className="text-sky-300 font-mono">dist</code>).</li>
                    <li>In Project Settings &rarr; <strong>Domains</strong>, type <code className="text-sky-300 font-mono">{fullDomain}</code>.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BigRock Native Steps */}
          {activeTab === 'bigrock' && (
            <div className="space-y-3 font-sans">
              <div className="bg-[#0b1220] border border-[#16253c] p-3.5 rounded-xl space-y-3 text-[11px]">
                <div className="flex items-center gap-2 font-mono font-semibold text-sky-300">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>Adding CNAME in BigRock Control Panel</span>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-slate-300 leading-relaxed pl-1">
                  <li>
                    Log in to your <strong>BigRock Account</strong> (<code className="text-sky-300 font-mono">bigrock.in</code>).
                  </li>
                  <li>
                    Go to <strong>Manage Orders</strong> &rarr; <strong>List/Search Orders</strong> and click on{' '}
                    <strong className="text-white font-mono">anyalabs.in</strong>.
                  </li>
                  <li>
                    Scroll down to the <strong>DNS Management</strong> section and click{' '}
                    <strong>Manage DNS</strong>.
                  </li>
                  <li>
                    Click the <strong>CNAME Records</strong> tab, then click <strong>Add CNAME Record</strong>.
                  </li>
                </ol>

                {/* BigRock Record Table */}
                <div className="bg-[#05080f] p-3 rounded-lg border border-[#142033] font-mono text-[10px] space-y-2">
                  <div className="grid grid-cols-3 gap-2 text-slate-500 font-semibold border-b border-slate-800 pb-1">
                    <span>HOST NAME / SUBDOMAIN</span>
                    <span>RECORD TYPE</span>
                    <span>VALUE / DESTINATION</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-emerald-400 items-center font-medium pt-1">
                    <span className="text-white">{subdomain || 'spacetime'}</span>
                    <span className="text-sky-300 font-bold">CNAME</span>
                    <span className="truncate text-slate-200" title={hostValue}>
                      {hostValue}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-sky-950/40 border border-sky-800/40 text-[10px] text-sky-300 font-sans">
                  💡 <strong>TTL Setting:</strong> Set TTL to <strong>14400</strong> and click <strong>Add Record</strong>.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BigRock with Cloudflare */}
          {activeTab === 'cloudflare' && (
            <div className="space-y-3 font-sans">
              <div className="bg-[#0b1220] border border-[#16253c] p-3.5 rounded-xl space-y-3 text-[11px]">
                <div className="flex items-center justify-between font-mono font-semibold text-emerald-300">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Cloudflare + BigRock (Free SSL)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800 text-emerald-300">
                    100% Free SSL
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  BigRock often charges extra for SSL certificates. If you point BigRock&apos;s NameServers to <strong>Cloudflare</strong>:
                </p>
                <div className="bg-[#05080f] p-3 rounded-lg border border-[#142033] space-y-2 text-[10px] font-mono">
                  <div className="space-y-1 text-slate-300">
                    <div>1. Add <code className="text-sky-300">anyalabs.in</code> in free Cloudflare.com</div>
                    <div>2. In BigRock &rarr; <strong>Name Servers</strong>, replace with Cloudflare&apos;s 2 nameservers.</div>
                    <div>3. In Cloudflare DNS &rarr; Add CNAME <code className="text-emerald-400">{subdomain || 'spacetime'}</code> &rarr; <code className="text-slate-200">{hostValue}</code> with <strong>Proxied (Orange Cloud)</strong> ON.</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Copy Target Host Box */}
          <div className="bg-[#05080f] p-3 rounded-xl border border-[#142033] flex items-center justify-between font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Target Hostname for CNAME:</span>
              <span className="text-sky-300 text-xs font-semibold">{hostValue}</span>
            </div>
            <button
              onClick={() => copyToClipboard(hostValue, 1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0e274a] border border-[#1d4c88] text-sky-200 hover:bg-[#123668] transition-colors text-[11px]"
            >
              {copiedIndex === 1 ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Host</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#152238] bg-[#0a1220] flex items-center justify-between text-[11px]">
          <span className="text-slate-400 font-sans">
            Ready for: <strong className="text-white font-mono">{fullDomain}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
