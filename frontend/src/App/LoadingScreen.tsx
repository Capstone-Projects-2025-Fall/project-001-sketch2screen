// React Loading Spinner Component with TypeScript
import "./LoadingSpinner.css"

/** Props for customizing the LoadingSpinner component */
interface LoadingSpinnerProps {
    /** Size variant of the spinner */
    size?: 'small' | 'medium' | 'large';
    /** Color of the spinner (CSS color value) */
    color?: string;
}

/**
 * Displays an animated loading spinner with optional text
 * @param props - Component properties
 * @param props.size - Size variant of the spinner ('small' | 'medium' | 'large')
 * @param props.color - Color of the spinner (defaults to "#3498db")
 * @returns JSX element containing the loading spinner
 * 
 * @example
 * ```tsx
 * <LoadingSpinner size="large" color="#ff0000" />
 * ```
 */
export function LoadingSpinner({
    size = 'medium',
    color = "#3498db"
}: LoadingSpinnerProps) {
    return (
        <>
            <div className="spin-container">
                <div className="loading-spinner" style={{ borderTopColor: color }} />
                <div id="loading-text">Generating...</div>
            </div>
        </>
    )
}