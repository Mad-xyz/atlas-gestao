import React, { useState, useEffect } from 'react'
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link as LinkIcon,
    Eraser,
    Type
} from 'lucide-react'

// Hook utilitário interno
function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);
    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) setMatches(media.matches);
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [matches, query]);
    return matches;
}

function TextEditorToolbar({ editorRef }) {
    const [activeStates, setActiveStates] = useState({});

    const checkStates = () => {
        const states = {
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            insertOrderedList: document.queryCommandState('insertOrderedList'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
        };
        setActiveStates(states);
    };

    useEffect(() => {
        const handleSelectionChange = () => {
            if (document.activeElement === editorRef.current) {
                checkStates();
            }
        };
        document.addEventListener('selectionchange', handleSelectionChange);
        return () => document.removeEventListener('selectionchange', handleSelectionChange);
    }, [editorRef]);

    const runCommand = (cmd, val = null) => {
        document.execCommand(cmd, false, val);
        checkStates();
        if (editorRef?.current) editorRef.current.focus();
    };

    const tools = [
        { cmd: 'bold', icon: <Bold size={14} />, label: 'Negrito' },
        { cmd: 'italic', icon: <Italic size={14} />, label: 'Itálico' },
        { cmd: 'underline', icon: <Underline size={14} />, label: 'Sublinhado' },
        { type: 'separator' },
        { cmd: 'insertOrderedList', icon: <ListOrdered size={14} />, label: 'Lista Numerada' },
        { cmd: 'insertUnorderedList', icon: <List size={14} />, label: 'Lista Marcadores' },
        { type: 'separator' },
        {
            cmd: 'createLink',
            icon: <LinkIcon size={14} />,
            label: 'Inserir Link',
            action: () => {
                const url = prompt('Digite a URL:');
                if (url) runCommand('createLink', url);
            }
        },
        { cmd: 'removeFormat', icon: <Eraser size={14} />, label: 'Limpar Formatação' },
    ]

    return (
        <div className="flex items-center gap-0.5">
            <div className="p-2 mr-2 text-primary opacity-50 border border-white/5 rounded-lg">
                <Type size={14} />
            </div>
            <div className="w-px h-4 bg-white/5 mx-2" />
            {tools.map((tool, i) => tool.type === 'separator' ? (
                <div key={i} className="w-px h-4 bg-white/5 mx-2" />
            ) : (
                <button
                    key={i}
                    type="button"
                    onClick={() => tool.action ? tool.action() : runCommand(tool.cmd)}
                    className={`p-2 rounded-lg transition-all ${activeStates[tool.cmd]
                        ? 'text-primary bg-primary/10 border border-primary/20 shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]'
                        : 'text-gray-500 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                    title={tool.label}
                >
                    {tool.icon}
                </button>
            ))}
        </div>
    );
}

const RichTextEditor = React.memo(React.forwardRef(({ initialValue, onChange, placeholder }, ref) => {
    useEffect(() => {
        if (ref.current && initialValue && !ref.current.innerHTML) {
            ref.current.innerHTML = initialValue;
        }
    }, [initialValue]);

    return (
        <div className="flex flex-col rounded-3xl bg-white/[0.02] border border-white/5 overflow-hidden focus-within:border-primary/30 transition-all">
            <div className="px-4 py-2 border-b border-white/5 bg-white/[0.01]">
                <TextEditorToolbar editorRef={ref} />
            </div>
            <div
                ref={ref}
                contentEditable
                onInput={e => onChange(e.currentTarget.innerHTML)}
                onBlur={e => onChange(e.currentTarget.innerHTML)}
                placeholder={placeholder}
                className="w-full min-h-[160px] p-6 text-gray-300 text-sm outline-none leading-relaxed relative before:content-[attr(placeholder)] before:absolute before:text-gray-700 before:pointer-events-none empty:before:block before:hidden [&_a]:text-blue-500 [&_a]:underline"
                style={{ whiteSpace: 'pre-wrap' }}
            />
        </div>
    );
}));

RichTextEditor.displayName = 'RichTextEditor';

export default RichTextEditor;
