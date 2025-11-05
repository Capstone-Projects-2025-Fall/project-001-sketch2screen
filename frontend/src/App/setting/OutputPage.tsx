import { EditableComponents } from './EditableComponentsToString';

export function OutputPage(safeHtml: string): string {
    // Use EditableComponents to generate the HTML string with editing capabilities
    const content = EditableComponents({
        htmlContent: safeHtml,
        onStyleChange: (elements) => {
            // Optional: Handle style changes if needed
            console.log('Styles updated:', elements);
        }
    });

    // Ensure we always return a string
    return typeof content === 'string' ? content : '';
}