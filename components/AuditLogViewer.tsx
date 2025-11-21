
import React, { useEffect, useState, useRef } from 'react';
import { AuditLogEntry } from '../lib/security';
import { TrashIcon } from './icons';

interface AuditLogViewerProps {
    variant?: 'full' | 'widget';
}

const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ variant = 'full' }) => {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const bottomRef = useRef<HTMLDivElement>(null);

    const loadLogs = () => {
        try {
            const stored = localStorage.getItem('audit_trail');
            if (stored) {
                setLogs(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load audit logs");
        }
    };

    const clearLogs = () => {
        if (confirm("Clear audit trail? This cannot be undone.")) {
            localStorage.removeItem('audit_trail');
            setLogs([]);
        }
    };

    useEffect(() => {
        loadLogs();
        // Poll for updates
        const interval = setInterval(loadLogs, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (variant === 'widget' && bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, variant]);

    if (variant === 'widget') {
        return (
            <div className="flex flex-col h-64 bg-black/40 border border-gray-700 rounded-lg overflow-hidden font-mono text-[10px]">
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-800/50 border-b border-gray-700">
                    <span className="text-emerald-500 font-bold tracking-wider">KERNEL_STREAM</span>
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500">{logs.length} EVTS</span>
                        <button onClick={clearLogs} className="hover:text-red-400 text-gray-600 transition-colors">
                            <TrashIcon className="w-3 h-3" />
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                    {logs.length === 0 && <span className="text-gray-600 italic">...waiting for system events...</span>}
                    {logs.map((log) => (
                        <div key={log.id} className="flex gap-2 opacity-80 hover:opacity-100 transition-opacity">
                            <span className="text-gray-500 flex-shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
                            </span>
                            <div className="flex-1 break-all">
                                <span className={`font-bold mr-1 ${
                                    log.agent === 'TRADER' ? 'text-amber-400' :
                                    log.agent === 'SENTINEL' ? 'text-red-400' :
                                    log.agent === 'ENGINEER' ? 'text-emerald-400' :
                                    'text-blue-400'
                                }`}>
                                    [{log.agent}]
                                </span>
                                <span className="text-gray-300">{log.action}</span>
                                <span className={`ml-1 ${log.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}>
                                    {log.status === 'SUCCESS' ? '✔' : '✘'}
                                </span>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>
            </div>
        );
    }

    // Full Mode (Documentation Modal)
    return (
        <div className="h-full flex flex-col bg-gray-900 text-xs font-mono">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
                <span className="font-bold text-gray-300">IMMUTABLE AUDIT TRAIL</span>
                <div className="flex items-center gap-4">
                    <span className="text-gray-500">{logs.length} Records</span>
                    <button onClick={clearLogs} className="flex items-center gap-1 text-red-400 hover:text-red-300 bg-red-900/20 px-2 py-1 rounded border border-red-900/50">
                        <TrashIcon className="w-3 h-3" /> Clear
                    </button>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-800/50 text-gray-400 sticky top-0">
                        <tr>
                            <th className="p-2 border-b border-gray-700">Timestamp</th>
                            <th className="p-2 border-b border-gray-700">Agent</th>
                            <th className="p-2 border-b border-gray-700">Action</th>
                            <th className="p-2 border-b border-gray-700">Status</th>
                            <th className="p-2 border-b border-gray-700 text-right">Hash</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                                <td className="p-2 text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                <td className="p-2">
                                    <span className={`px-1.5 py-0.5 rounded border ${
                                        log.agent === 'TRADER' ? 'text-amber-400 border-amber-900/50 bg-amber-900/20' :
                                        log.agent === 'SENTINEL' ? 'text-red-400 border-red-900/50 bg-red-900/20' :
                                        log.agent === 'ENGINEER' ? 'text-emerald-400 border-emerald-900/50 bg-emerald-900/20' :
                                        'text-blue-400 border-blue-900/50 bg-blue-900/20'
                                    }`}>
                                        {log.agent}
                                    </span>
                                </td>
                                <td className="p-2 text-gray-300">{log.action}</td>
                                <td className="p-2">
                                    <span className={log.status === 'SUCCESS' ? 'text-green-500' : 'text-red-500'}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="p-2 text-right text-gray-600" title={log.hash}>
                                    {log.hash.substring(0, 8)}...
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-600">No audited actions recorded yet.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AuditLogViewer;
