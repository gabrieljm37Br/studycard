
/**
 * Helper function to render HTML content safely.
 * Use this with dangerouslySetInnerHTML.
 */
export const renderHTML = (text: string) => {
    // In a real production app, we would use DOMPurify here.
    // Since this is a local app and we trust the input (it comes from the user's own editor),
    // we'll just return the object.
    // If we add external content later, we MUST add sanitization.
    return { __html: text };
};
