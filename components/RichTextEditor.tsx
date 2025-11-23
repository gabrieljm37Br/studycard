import React, { useRef, useEffect, useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder = "Digite aqui...",
    className = "",
    minHeight = "100px"
}) => {
    const contentEditableRef = useRef<HTMLDivElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    // Sync value to contentEditable when value changes externally
    useEffect(() => {
        if (contentEditableRef.current && contentEditableRef.current.innerHTML !== value) {
            // Only update if the content is actually different to avoid cursor jumping
            // This is a simple check; for more complex apps, we might need better diffing
            // But for this use case, it should be enough if we don't update while focused/typing aggressively
            if (!isFocused) {
                contentEditableRef.current.innerHTML = value;
            } else if (value === '') {
                // Special case for clearing
                contentEditableRef.current.innerHTML = '';
            }
        }
    }, [value, isFocused]);

    const handleInput = () => {
        if (contentEditableRef.current) {
            const html = contentEditableRef.current.innerHTML;
            onChange(html);
        }
    };

    const executeCommand = (command: string) => {
        document.execCommand(command, false, undefined);
        // Ensure focus remains or returns to the editor
        if (contentEditableRef.current) {
            contentEditableRef.current.focus();
            handleInput(); // Update state after formatting
        }
    };

    const ToolbarButton = ({ command, icon, label }: { command: string, icon: React.ReactNode, label: string }) => (
        <button
            type="button"
            onMouseDown={(e) => {
                e.preventDefault(); // Prevent losing focus from editor
                executeCommand(command);
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 rounded transition-colors"
            title={label}
            aria-label={label}
        >
            {icon}
        </button>
    );

    return (
        <div className={`relative border rounded-md overflow-hidden border-slate-300 dark:border-slate-600 focus-within:ring-2 focus-within:ring-cyan-500 focus-within:border-transparent transition-all bg-slate-100 dark:bg-slate-700 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-1 border-b border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                <ToolbarButton
                    command="bold"
                    label="Negrito"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path></svg>}
                />
                <ToolbarButton
                    command="italic"
                    label="Itálico"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="4" x2="10" y2="4"></line><line x1="14" y1="20" x2="5" y2="20"></line><line x1="15" y1="4" x2="9" y2="20"></line></svg>}
                />
                <ToolbarButton
                    command="underline"
                    label="Sublinhado"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path><line x1="4" y1="21" x2="20" y2="21"></line></svg>}
                />
            </div>

            {/* Editor Area */}
            <div
                ref={contentEditableRef}
                contentEditable
                onInput={handleInput}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="p-3 focus:outline-none text-slate-900 dark:text-slate-100 overflow-y-auto"
                style={{ minHeight }}
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
            />

            {/* Placeholder logic (CSS-based usually better, but simple fallback here if needed) */}
            {value === '' && !isFocused && (
                <div
                    className="absolute pointer-events-none p-3 text-slate-400 dark:text-slate-500 top-[40px]" // Adjust top based on toolbar height
                    onClick={() => contentEditableRef.current?.focus()}
                >
                    {placeholder}
                </div>
            )}
        </div>
    );
};

export default RichTextEditor;
