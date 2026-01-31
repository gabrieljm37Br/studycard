import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Mathematics from '@tiptap/extension-mathematics';
import { sanitizeHTML, ensureMathDataType } from '@/utils/textUtils';

type FlashcardWysiwygEditorProps = {
    valueJson?: any;
    valueHtml?: string;
    onChangeJson?: (value: any) => void;
    onChangeHtml?: (value: string) => void;
    placeholder?: string;
    onImageUpload?: (file: File) => Promise<string>;
};

const FlashcardWysiwygEditor: React.FC<FlashcardWysiwygEditorProps> = ({
    valueJson,
    valueHtml,
    onChangeJson,
    onChangeHtml,
    placeholder,
    onImageUpload,
}) => {
    const textColors = ['#111827', '#1d4ed8', '#047857', '#b45309', '#dc2626', '#6d28d9'];
    const highlights = [
        '#fef3c7',
        '#d1fae5',
        '#e0f2fe',
        '#ede9fe',
        '#fee2e2',
        '#f3f4f6',
        '#FF69B4', // pink vibrante
        '#00FF00', // verde neon
        '#FFFF00', // amarelo vivo
    ];

    const editor = useEditor(
        {
            extensions: [
                StarterKit.configure({
                    bold: { HTMLAttributes: { class: 'font-bold' } },
                    italic: { HTMLAttributes: { class: 'italic' } },
                }),
                Image.configure({
                    HTMLAttributes: {
                        class: 'max-w-full h-auto rounded-md my-2',
                        loading: 'lazy',
                    },
                }),
                Underline,
                Subscript,
                Superscript,
                TextStyle,
                Color,
                Highlight.configure({ multicolor: true }),
                Link.configure({
                    openOnClick: false,
                    autolink: false,
                    protocols: ['http', 'https', 'mailto'],
                }),
                Mathematics.configure({
                    katexOptions: {
                        throwOnError: false,
                    },
                }),
            ],
            content: valueJson || valueHtml || '',
            onUpdate: ({ editor }) => {
                const html = sanitizeHTML(editor.getHTML());
                onChangeJson?.(editor.getJSON());
                onChangeHtml?.(html);
            },
            editorProps: {
                attributes: {
                    class:
                        'min-h-[120px] w-full p-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-base outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 prose prose-sm max-w-none',
                    'data-placeholder': placeholder || 'Digite aqui...',
                },
                transformPastedHTML: (html: string) => sanitizeHTML(html),
                handleClickOn: (view, pos, node, nodePos) => {
                    if (node.type.name === 'inlineMath' || node.type.name === 'blockMath') {
                        const latex = node.attrs.latex;
                        const newLatex = window.prompt('Editar fórmula LaTeX:', latex);
                        if (newLatex !== null && newLatex !== latex) {
                            const tr = view.state.tr.setNodeMarkup(nodePos, null, {
                                latex: newLatex,
                            });
                            view.dispatch(tr);
                        }
                        return true;
                    }
                    return false;
                },
                handleKeyDown: (_view, event) => {
                    if (event.metaKey || event.ctrlKey) {
                        const key = event.key.toLowerCase();
                        if (key === 'k') {
                            event.preventDefault();
                            const href = window.prompt('Insira o link (inclua http/https):');
                            if (!href) {
                                editor?.chain().focus().unsetLink().run();
                            } else {
                                editor?.chain().focus().setLink({ href }).run();
                            }
                            return true;
                        }
                        if (key === ',') {
                            event.preventDefault();
                            editor?.chain().focus().toggleSubscript().run();
                            return true;
                        }
                        if (key === '.') {
                            event.preventDefault();
                            editor?.chain().focus().toggleSuperscript().run();
                            return true;
                        }
                        if (key === 'm' && event.shiftKey) {
                            event.preventDefault();
                            const latex = window.prompt('Insira a fórmula LaTeX (sem delimitadores):');
                            if (latex) {
                                editor?.chain().focus().insertInlineMath({ latex }).run();
                            }
                            return true;
                        }
                    }
                    return false;
                },
            },
        },
        [] // evita recriar o editor a cada digitação
    );

    useEffect(() => {
        if (!editor) return;
        // Atualizações externas (ex.: abrir modal com dados existentes)
        if (valueJson) {
            editor.commands.setContent(valueJson);
            return;
        }
        if (valueHtml !== undefined) {
            const sanitized = sanitizeHTML(ensureMathDataType(valueHtml));
            if (sanitized !== editor.getHTML()) {
                editor.commands.setContent(sanitized);
            }
        }
    }, [valueJson, valueHtml, editor]);

    if (!editor) return null;

    const buttonBase =
        'px-2 py-1 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600 transition-colors';
    const fileInputId = React.useMemo(() => `upload-img-${Math.random().toString(36).slice(2)}`, []);
    const [isUploadingImage, setIsUploadingImage] = React.useState(false);

    const Dropdown: React.FC<{
        label: string;
        options: { label: string; value: string | null; style?: React.CSSProperties }[];
        onSelect: (value: string | null) => void;
    }> = ({ label, options, onSelect }) => (
        <div className="relative">
            <select
                className="px-2 py-1 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                onChange={(e) => onSelect(e.target.value || null)}
                defaultValue=""
            >
                <option value="">{label}</option>
                {options.map(opt => (
                    <option key={opt.label} value={opt.value || ''} style={opt.style}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const renderButton = (
        label: string,
        isActive: boolean,
        onClick: () => void,
        ariaLabel: string
    ) => (
        <button
            type="button"
            aria-label={ariaLabel}
            onMouseDown={(e) => {
                e.preventDefault();
                onClick();
            }}
            className={`${buttonBase} ${isActive ? 'bg-gray-100 dark:bg-gray-600 border-indigo-500 text-indigo-600 dark:text-indigo-300' : ''
                }`}
        >
            {label}
        </button>
    );

    const handleSelectImage = async (file?: File) => {
        if (!file || !onImageUpload) return;
        try {
            setIsUploadingImage(true);
            const url = await onImageUpload(file);
            editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        } catch (error) {
            console.error('Erro ao fazer upload da imagem:', error);
            alert('Erro ao fazer upload da imagem. Tente novamente.');
        } finally {
            setIsUploadingImage(false);
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
                {renderButton('B', editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), 'Negrito')}
                {renderButton('I', editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), 'Italico')}
                {renderButton('U', editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), 'Sublinhado')}
                {renderButton('X₂', editor.isActive('subscript'), () => editor.chain().focus().toggleSubscript().run(), 'Subscrito')}
                {renderButton('X²', editor.isActive('superscript'), () => editor.chain().focus().toggleSuperscript().run(), 'Sobrescrito')}
                {renderButton('•', editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), 'Lista nÃ£o ordenada')}
                {renderButton('1.', editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), 'Lista ordenada')}
                {renderButton('Link', editor.isActive('link'), () => {
                    let href = window.prompt('Insira o link (inclua http/https):') || '';
                    href = href.trim();
                    if (href && !/^https?:\/\//i.test(href) && !href.startsWith('mailto:')) {
                        href = `https://${href}`;
                    }
                    if (!href) {
                        editor.chain().focus().unsetLink().run();
                    } else {
                        editor.chain().focus().setLink({ href }).run();
                    }
                }, 'Link')}
                {renderButton(
                    'ƒ(x)',
                    editor.isActive('inlineMath') || editor.isActive('blockMath'),
                    () => {
                        const latex = window.prompt('Insira a fórmula LaTeX (sem delimitadores):');
                        if (latex) {
                            editor.chain().focus().insertInlineMath({ latex }).run();
                        }
                    },
                    'Inserir fórmula matemática'
                )}
                <Dropdown
                    label="Cor"
                    options={[
                        { label: 'Padrão', value: null },
                        ...textColors.map(c => ({ label: c, value: c, style: { color: c } })),
                    ]}
                    onSelect={(val) => {
                        if (!val) {
                            editor.chain().focus().unsetColor().run();
                        } else {
                            editor.chain().focus().setColor(val).run();
                        }
                    }}
                />
                <Dropdown
                    label="Destaque"
                    options={[
                        { label: 'Nenhum', value: null },
                        ...highlights.map(c => ({ label: c, value: c, style: { backgroundColor: c } })),
                    ]}
                    onSelect={(val) => {
                        if (!val) {
                            editor.chain().focus().unsetHighlight().run();
                        } else {
                            editor.chain().focus().unsetHighlight().setHighlight({ color: val }).run();
                        }
                    }}
                />
                {onImageUpload && (
                    <label
                        htmlFor={fileInputId}
                        className={`${buttonBase} cursor-pointer ${isUploadingImage ? 'opacity-60 cursor-not-allowed' : ''}`}
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        {isUploadingImage ? 'Enviando...' : 'Imagem'}
                    </label>
                )}
            </div>
            {onImageUpload && (
                <input
                    id={fileInputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        handleSelectImage(file);
                        e.target.value = '';
                    }}
                />
            )}
            <div className="tiptap">
                <style>{`
                    .tiptap ul { list-style-type: disc; padding-left: 1.5rem; }
                    .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; }
                    
                    /* Estilos para fórmulas matemáticas */
                    .math-node {
                        display: inline-block;
                        padding: 2px 4px;
                        margin: 0 2px;
                        background-color: rgba(99, 102, 241, 0.05);
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    
                    .math-node:hover {
                        background-color: rgba(99, 102, 241, 0.1);
                    }
                    
                    .dark .math-node {
                        background-color: rgba(129, 140, 248, 0.1);
                    }
                    
                    .dark .math-node:hover {
                        background-color: rgba(129, 140, 248, 0.15);
                    }
                `}</style>
                <EditorContent editor={editor} />
            </div>
        </div>
    );
};

export default FlashcardWysiwygEditor;
